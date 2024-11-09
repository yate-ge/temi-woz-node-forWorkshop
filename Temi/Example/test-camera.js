import Robot from '../robotapi.js';
import { logger } from '../logger.js';

async function testCamera() {
    const robot = await Robot.create();

    try {
        logger("Test", "启动相机");
        await robot.startCamera();
        await robot.showCameraPreview();
        
        logger("Test", "准备拍照");
        await robot.wait(5); // 等待2秒确保相机准备好
        
        // 拍照并获取保存的图片路径
        const imagePath = await robot.takePicture();
        logger("Test", "拍照成功，保存在: " + imagePath);
        
        await robot.wait(1); // 等待1秒
        await robot.hideCameraPreview();
        await robot.stopCamera();
        logger("Test", "相机测试完成");
    } catch (error) {
        logger("Test", "相机测试失败: " + error.message);
        // 确保相机关闭
        await robot.hideCameraPreview();
        await robot.stopCamera();
    }
}

testCamera().catch(console.error);