//const WebSocket = require('ws');

import fetch from 'node-fetch';
import { logger } from './logger.js';

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import WebSocket from 'ws';
import events from 'events';
import { stringify } from 'querystring';


const temiWebsocketIP = process.env.TEMI_IP || '192.168.123.130:8175';
const execution_mode = process.env.EXECUTION_MODE || 'robot';
// 是否在mock模式下
const isMock = execution_mode === 'mock';


export const eventemitter = new events.EventEmitter();
export let ws = '';

// let serverCondition = true;


if (!isMock) {
  // console.log('Temi 开启 WOZ APP');
  logger('Temi连接状态', '连接到Temi');
  ws = new WebSocket('ws://' + temiWebsocketIP);

  ws.on('open', function() {
    const message = {
      command: 'speak',
      sentence: '连接成功',
      id: 'connect_id'
    };
    const jsonMessage = JSON.stringify(message);
    ws.send(jsonMessage);

    // const message2 = {
    //   command: 'openURL',
    //   url: 'http://192.168.123.70:9999/temi-face.html',
    //   id: 'connect_id'
    // };
    // const jsonMessage2 = JSON.stringify(message2);
    // ws.send(jsonMessage2);

  });
  
  ws.on('message', function(data) {
    // For takePicture responses, truncate the image data to avoid long logs

        // const jsonData = JSON.parse(data);
        // if (jsonData.image) {
        //     const truncatedData = {
        //         ...jsonData,
        //         image: jsonData.image.substring(0, 50) + '...[truncated]'
        //     };
        //     console.log('Received message: ' + JSON.stringify(truncatedData));
        // } else {
        //     console.log('Received message: ' + data);
        // }
    
    // console.log('Received message: ' + data);
    

    //尝试解析json
    let json = {};
    try {
      json = JSON.parse(data);

      console.log('Received message: ' + JSON.stringify(json));
  
      //
      //判断是否是事件
      if (json.event&&json.state == "2") {
        //触发事件
        eventemitter.emit("humanDetected");
      }
  
      // 处理speak 结束的回调
      if (json.id == msg_id.speak) {
        console.log("触发speak完成事件");
        eventemitter.emit("speakEvent");
      }
      
      // console.log('ws中获取用户语音 ', json.reply);
      // 处理普通的用户语音输入
      if (json.reply) {
        console.log("触发语音输入事件");
        eventemitter.emit("voiceInputEvent", json.reply);
      }


  // 处理 askQuestion的用户回复
      if (json.reply && json.id == msg_id.ask) {
        console.log("触发reply事件");
        eventemitter.emit("replyEvent", json.reply);
      }
      // 处理用户唤醒temi时的输入，由于返回的结果都是用户返回的内容，如果是askquestion回复的话，会有对应的id。所以如果id不匹配的话，可以认为是 temi唤醒时用户的输入。
      // if (json.reply && json.id != msg_id.ask) {
      //   console.log("触发wakeup事件");
      //   eventemitter.emit("wakeupEvent", json.reply);
      // }
  
      if (json.id == msg_id.goto) {
        console.log("触发goto完成事件");
        eventemitter.emit("gotoEvent", json.state);
      }
  
      if (json.event == "onBeWithMeStatusChanged" && json.status == "track") {
        console.log("触发onBeWithMeStatusChanged事件,找到目标");
        eventemitter.emit("humanDetectedonBeWithMe", json.status);
      }
  
      // 处理拍照事件
      if (json.command === "takePicture" && json.id === msg_id.takePicture) {
        try {
          console.log("触发拍照事件，数据大小:", json.imageData ? json.imageData.length : 0, "字节");
          if (json.imageData && json.path) {
            eventemitter.emit("takePictureEvent", json);
          } else {
            console.error("未收到完整的图像数据");
          }
        } catch (error) {
          console.error("处理图像数据时出错:", error);
        }
      }
  
      
  
    } catch (e) {
      //console.log("无法解析json: " + data);
    }
  
  
  
    
  
  
  
  
  
  
  });
  
  ws.on('close', function() {
    console.log('Connection closed.');
  });
  
} else {
  // console.log('Temi 未开启 WOZ APP，请在temi上打开WOZ APP');
  // console.log("mock模式下，不连接temi");
  logger('Temi连接状态', 'mock模式下不连接temi');
  
}


// export let goto_id = 0;
// export let ask_id = 0;

export let msg_id = {
  goto: 0,
  ask: 0,
  speak: 0,
  takePicture: 0
}





