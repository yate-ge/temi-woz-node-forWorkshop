import Robot from '../../Temi/robotapi.js';
import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';
import fetch from 'node-fetch';

dotenv.config();

// 添加更详细的配置检查日志
console.log('API Configuration:');
console.log('API Base URL:', process.env.OPENAI_API_BASE);
console.log('API Key (first 8 chars):', process.env.OPENAI_API_KEY?.substring(0, 8) + '...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const LOCAL_IP = process.env.LOCAL_IP;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const wss = new WebSocketServer({ port: 8080, host: '0.0.0.0' });

let activeWebSocket = null;

// 创建事件发射器
const robotEvent = new EventEmitter();

// 创建自定义的 OpenAI API 调用函数
async function callOpenAI(messages) {
    const response = await fetch('https://api.openai-proxy.org/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-2024-05-13",
            messages: messages,
            temperature: 0.7,
            max_tokens: 150
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 测试函数
async function testOpenAIConnection() {
    try {
        console.log('Sending test request to OpenAI API...');
        const response = await callOpenAI([
            {
                role: "user",
                content: "Hello"
            }
        ]);
        console.log('OpenAI connection test successful:', response);
    } catch (error) {
        console.error('OpenAI connection test failed:', error);
        throw error;
    }
}

async function main() {
    // 在启动服务之前测试 OpenAI 连接
    console.log('Testing OpenAI connection...');
    await testOpenAIConnection();
    console.log('OpenAI connection test completed');

    const robot = await Robot.create();
    
    // 监听语音输入事件
    robotEvent.on('voiceInputEvent', async (text) => {
        console.log('Voice input received:', text);
        if (activeWebSocket) {
            try {
                console.log('Sending request to OpenAI API...');
                const response = await callOpenAI([
                    {
                        role: "system",
                        content: "你是一个友好的助手，请用简短、自然的方式回答问题。"
                    },
                    {
                        role: "user",
                        content: text
                    }
                ]);

                console.log('API request successful');
                console.log('GPT Response:', response);

                // 让机器人说出回复
                await robot.speak(response);

                // 发送回复给客户端
                activeWebSocket.send(JSON.stringify({ 
                    type: 'response', 
                    userText: text,
                    botText: response 
                }));
            } catch (error) {
                console.error('OpenAI API Error:', error);
                activeWebSocket.send(JSON.stringify({ type: 'error', message: '语言模型服务暂时不可用' }));
            }
        }
    });

    // 设置机器人的语音输入处理
    robot.robotEvent = robotEvent;

    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://${LOCAL_IP}:${port}`);
        try {
            robot.display(`http://${LOCAL_IP}:${port}`);
            console.log('网页已在机器人屏幕上显示');
        } catch (error) {
            console.error('显示网页失败:', error);
        }
    });

    // WebSocket 连接处理
    wss.on('connection', (ws) => {
        console.log('Client connected');
        activeWebSocket = ws;

        // 处理来自客户端的消息（开始/停止监听）
        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            if (data.action === 'startListening') {
                try {
                    await robot.wakeup();
                    ws.send(JSON.stringify({ type: 'status', text: '正在听...' }));
                } catch (error) {
                    console.error('唤醒失败:', error);
                    ws.send(JSON.stringify({ type: 'error', message: '唤醒失败' }));
                }
            }
        });

        ws.on('close', () => {
            if (activeWebSocket === ws) {
                activeWebSocket = null;
            }
        });
    });
}

main().catch(error => {
    console.error('Application startup failed:', error);
    process.exit(1);
});
