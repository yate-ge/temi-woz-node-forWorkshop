let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let captureButton = document.getElementById('captureButton');
let resultDiv = document.getElementById('result');

// 启动摄像头
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("无法访问摄像头: ", err);
    }
}

// 拍照并分析
async function captureAndAnalyze() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    
    try {
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // 使用GPT-4o模型
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: "请分析这张图片中物体的设计风格。描述主要物体的风格特征，如现代、复古、简约、奢华等。如果无法辨识明显的设计风格，请说明原因。" 
                            },
                            { 
                                type: "image_url", 
                                image_url: { 
                                    url: imageDataUrl 
                                } 
                            }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const result = data.choices[0].message.content;
            displayResult(formatResult(result));
        } else {
            throw new Error('Unexpected API response structure');
        }
    } catch (error) {
        console.error('Error:', error);
        displayResult('分析失败，请重试。错误信息：' + error.message);
    }
}

// 格式化结果
function formatResult(result) {
    return `设计风格分析：${result}`;
}

// 显示结果并播放语音
function displayResult(result) {
    resultDiv.textContent = result;
    speak(result);
}

// 文字转语音
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    speechSynthesis.speak(utterance);
}

// 事件监听
captureButton.addEventListener('click', captureAndAnalyze);

// 启动摄像头
startCamera();