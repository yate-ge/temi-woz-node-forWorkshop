import WebSocket from "ws";
import { ws, eventemitter, msg_id } from './ws.js';
import generateUUID from "./generateUUID.js";
import events from 'events';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

// 导出一个Robot类，初始化的时候通过websockect 连接到```ws://192.168.123.10:8175```
export default class Robot {
    
    static async create() {
        const robot = new Robot();
        
        // 初始化时确保机器人停止移动
        const stopMessage = {
            command: 'move',
            x: 0,
            y: 0,
            id: generateUUID()
        };

        
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        logger("Robot", "等待1秒后初始化完成");
        
        // 初始化时打开本地网页
        robot.display("file:///android_asset/web/index.html");
        robot.stopMovement();
        
        return robot;
    }
    
    constructor() {
        this.reply = "no reply";
        this.location = [
            "接待区",
            "会议室",
            "作品示区",
            "领导办公室",
            "员工办公区",
            "创作室",
            "健身房",
            "会客厅",
            "茶水间" 
        ];

        this.robotEvent = new events.EventEmitter();
        logger("Robot", "初始化Robot对象");

        // 转发用户语音输入事件
        eventemitter.on("voiceInputEvent", (reply) => {
            console.log("replyEvent: " + reply);
            this.robotEvent.emit("voiceInputEvent", reply);
        });
    }

    //let reply = "no reply";
    display(url) {
        const message = {
            command: 'display',
            url,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        logger("Robot", "发送display消息: " + jsonMessage);
    }

    speak(sentence) {
        const message = {
            command: 'speak',
            sentence,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        console.log('send message: ' + jsonMessage);
        msg_id.speak = message.id;

        return new Promise((resolve, reject) => {
            eventemitter.on("speakEvent", () => {
                this.robotEvent.emit("speakEvent");
                resolve();
            });           
        });

    }

    ask(sentence) {
        const message = {
            command: 'ask',
            sentence,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        msg_id.ask = message.id;
        console.debug("ask_id: " + msg_id.ask);
        ws.send(jsonMessage);
        console.log('send message: ' + jsonMessage);
        

        return new Promise((resolve, reject) => {
            this.reply = "no reply";

            eventemitter.on("replyEvent", (reply) => {
                this.reply = reply;
                console.log("replyEvent: " + reply);

                this.robotEvent.emit("replyEvent", reply);
                resolve(this.reply);
            });
            
            setTimeout(() => {
                resolve(this.reply);
            }, 60000);
        });
    }




    goto(location) {
        const message = {
            command: 'goto',
            location,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        console.log('send message: ' + jsonMessage);
        msg_id.goto = message.id;

        return new Promise((resolve, reject) => {
            eventemitter.on("gotoEvent", () => {
                console.log("goto complete");

                this.robotEvent.emit("gotoEvent");
                resolve();
            });
            
            // setTimeout(() => {
            //     resolve("goto timeout");
            // }, 30000);
        })



    }

    
// temi的头部倾斜的角度，取值范围为 -25 ~ 55
    tilt(angle) {
        const message = {
            command: 'tilt',
            angle,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    turn(angle) {
        const message = {
            command: 'turn',
            angle,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }
    
    // 停止机器人的所有运动
    stopMovement() {
        const message = {
            command: 'stopMovement',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    // 保存位置
    savaLocation(location) {
        const message = {
            command: 'savaLocation',
            location,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    // 删除位置
    deleteLocation(location) {
        const message = {
            command: 'deleteLocation',
            location,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }




    // 呼叫用户
    call(userId) {
        const message = {
            command: 'call',
            userId,
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    // 唤醒机器人，允许用户输入语音，等同于用关键词唤醒Temi机器人
    wakeup() {
        const message = {
            command: 'wakeup',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        console.log('wsSend', jsonMessage);
    }

    // 用户输入语音，等待用户输入的内容与task匹配，匹配成功后返回用户输入的内容. 如果用户输入的内容与task不匹配，则返回"no wakeup"
    async userRequest(task) {

        //在事件触发后，将promise的状态改为resolve，返回promise,为用户输入内容。
        return new Promise((resolve, reject) => {
            eventemitter.on("voiceInputEvent", (reply) => {
                this.robotEvent.emit("voiceInputEvent", reply);

                this.reply = reply;
                if (this.reply == task) {
                    console.log("UserRequest: " + this.reply);
                    resolve(this.reply);
                } else {
                    console.log("no wakeup: " + this.reply);
                    // resolve("no wakeup")
                }

            });
        }
        );

    }
    // customRequest() {
    //     return new Promise((resolve, reject) => {
    //         eventemitter.on("wakeupEvent", (reply) => {
    //             this.robotEvent.emit("wakeupEvent", reply);

    //             this.reply = reply;
    //             console.log("wakeup: " + this.reply);
    //             resolve(this.reply);
    //         });
    //     }
    //     );

    // }

    // setDetectionMode(on) {
    //     const message = {
    //         command: 'setDetectionMode',
    //         on,
    //         id: generateUUID()
    //     };
    //     const jsonMessage = JSON.stringify(message);
    //     ws.send(jsonMessage);
    // }

    // checkDetectionMode() {
    //     const message = {
    //         command: 'checkDetectionMode',
    //         id: generateUUID()
    //     };
    //     const jsonMessage = JSON.stringify(message);
    //     ws.send(jsonMessage);
    // }

    // detectHuman() {
    //     return new Promise((resolve, reject) => {
    //         eventemitter.on("humanDetected", () => {
    //             resolve();
    //         });
    //     });
    // }

    // 用bewithme接口实现，从而可以手动关闭检测模式。检测机器人前面是否。
    detectHuman() {
        const message = {
            command: 'beWithMe',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);

        return new Promise((resolve) => {

            eventemitter.on("humanDetectedonBeWithMe", () => {
                this.robotEvent.emit("humanDetectedonBeWithMe");

                this.stopMovement();
                resolve(true);
            });

            setTimeout(() => {
                this.stopMovement();
                resolve(false);
            }, 5000);           

            // if (duration) {
            //     setTimeout(() => {
            //         this.stopMovement();
            //         resolve(false);
            //     }, duration*1000);
            // }
        });
    }

    // 让机器人等待duration秒，再执行下一步
    wait(duration) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, duration*1000);
        });
    }


    /**
     * 控制机器人移动
     * @param {number} x - 线性速度，范围 -1~1，正值前进，负值后退
     * @param {number} y - 角速度，范围 -1~1，正值左，负值右转
     * @param {number} [duration] - 可选参数，移动持续时间(秒)，不传则持续移动直到新命令
     */
    move(x, y, duration) {
        const message = {
            command: 'move',
            x: Math.max(-1, Math.min(1, x)), // 确保值在 -1 到 1 之间
            y: Math.max(-1, Math.min(1, y)),
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        console.log('send message: ' + jsonMessage);
        msg_id.move = message.id;

        return new Promise((resolve) => {
            eventemitter.on("moveEvent", (status) => {
                console.log("move status: " + status);
                this.robotEvent.emit("moveEvent", status);
            });

            if (duration) {
                // 如果指定了时间，则在时间到后自动停止
                setTimeout(() => {
                    // 发送停止命令
                    const stopMessage = {
                        command: 'move',
                        x: 0,
                        y: 0,
                        id: generateUUID()
                    };
                    ws.send(JSON.stringify(stopMessage));
                    console.log('auto stop after duration');
                    resolve('completed');
                }, duration * 1000);
            } else {
                // 如果没有指定时间，立即resolve
                resolve('started');
            }
        });
    }

    startCamera() {
        const message = {
            command: 'startCamera',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    stopCamera() {
        const message = {
            command: 'stopCamera',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    takePicture() {
        const message = {
            command: 'takePicture',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
        msg_id.takePicture = message.id;  // 保存消息ID用于匹配响应
        logger("Robot", "发送takePicture命令: " + jsonMessage);

        return new Promise((resolve, reject) => {
            const handlePicture = (response) => {
                logger("Robot", "收到图片数据");
                
                try {
                    // 验证响应数据
                    if (!response.imageData || !response.path) {
                        throw new Error("Invalid response data");
                    }

                    // 创建保存图片的目录（使用绝对路径）
                    const imageDir = path.resolve('./images');
                    if (!fs.existsSync(imageDir)) {
                        fs.mkdirSync(imageDir, { recursive: true });
                        logger("Robot", "创建图片目录成功");
                    }

                    // 使用返回的图片数据
                    const imageBuffer = Buffer.from(response.imageData, 'base64');
                    
                    // 使用返回的路径名作为文件名
                    const fileName = path.basename(response.path);
                    const filePath = path.join(imageDir, fileName);
                    
                    // 同步写入文件
                    fs.writeFileSync(filePath, imageBuffer);
                    logger("Robot", "图片保存成功: " + filePath);
                    
                    // 清理事件监听器和超时
                    eventemitter.removeListener("takePictureEvent", handlePicture);
                    clearTimeout(timeoutId);
                    
                    resolve(filePath);
                } catch (error) {
                    logger("Robot", "保存图片失败: " + error.message);
                    reject(error);
                }
            };

            // 设置超时处理
            const timeoutId = setTimeout(() => {
                eventemitter.removeListener("takePictureEvent", handlePicture);
                logger("Robot", "拍照超时");
                reject(new Error("Take picture timeout"));
            }, 15000);

            // 添加事件监听器
            eventemitter.once("takePictureEvent", handlePicture);
        });
    }

    showCameraPreview() {
        const message = {
            command: 'showCameraPreview',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    hideCameraPreview() {
        const message = {
            command: 'hideCameraPreview',
            id: generateUUID()
        };
        const jsonMessage = JSON.stringify(message);
        ws.send(jsonMessage);
    }

    

}
