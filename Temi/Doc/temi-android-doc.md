# Temi Wizard-of-Oz Testing

A Wizard-of-Oz testing application that enables remote-controlling the actions of the Temi robot. This application allows researchers and developers to simulate robot behaviors and interactions in real-time.

## Features

- Remote control of Temi robot via WebSocket
- Support for basic robot actions (speaking, movement, asking questions)
- Easy integration with Node-RED for visual programming
- Real-time feedback on robot actions
- Customizable interface loading

## Installation

### Prerequisites

- Android Studio
- ADB (Android Debug Bridge)
- Node-RED (optional, for visual programming)

### Setting up the Robot

1. Clone this repository and open it in Android Studio
2. Build the project to generate the APK
3. Connect to Temi on your local network:
```bash
adb connect <TEMI_IP_ADDRESS>:5555
```
4. Install the APK:
```bash
adb install PATH_TO_APK
```

## Development Guide

### 1. Enable Developer Mode on Temi

1. Go to Temi's Settings
2. Tap on the Temi icon in the top right corner 10 times to enable developer settings
3. Navigate to Settings > Developer Tools
4. Enable "ADB Debug" and "Developer Mode"

### 2. Connect to Temi via ADB

1. Make sure your computer and Temi are on the same network
2. Find Temi's IP address:
   - Go to Settings > Network & Internet
   - Select the connected WiFi network
   - Note down the IP address
3. Open terminal/command prompt and connect to Temi:
```bash
adb connect <TEMI_IP_ADDRESS>:5555
```
4. Verify connection:
```bash
adb devices
```
You should see your Temi device listed.

### 3. Build and Install the App

1. Open the project in Android Studio
2. Configure build settings:
   - Set minimum SDK version to match Temi's Android version
   - Ensure the application ID is unique
3. Build the APK:
   - Click Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Or use Build > Generate Signed Bundle / APK for release versions
4. Install the APK on Temi:
```bash
adb install -r path/to/your/app.apk
```
   - Use `-r` flag to replace existing installation if needed

Note: If you encounter connection issues, try these steps:
- Ensure both devices are on the same network
- Try disconnecting and reconnecting ADB:
```bash
adb disconnect
adb connect <TEMI_IP_ADDRESS>:5555
```
- Restart ADB server if needed:
```bash
adb kill-server
adb start-server
```

## Usage

### WebSocket Connection

Connect to Temi using WebSocket at:
```
ws://YOUR_TEMI_IP_ADDRESS:8175
```

Upon successful connection, you'll receive: "Temi is ready to receive commands!"

### Command Structure

All commands are sent as JSON objects. Here are the supported robot commands:

### Basic Communication Commands

#### Speaking Command
```json
{
  "command": "speak",
  "sentence": "The sentence you want Temi to say",
  "id": "unique_command_id"  
}
```
- Description: Makes Temi speak the given sentence
- WebSocket Response: 
```json
{
  "command": "speak",
  "id": "unique_command_id",
  "status": "completed"
}
```

#### Ask Question Command
```json
{
  "command": "ask",
  "sentence": "The question you want Temi to ask",
  "id": "unique_command_id"  
}
```
- Description: Makes Temi ask a question and wait for user's response
- WebSocket Response: 
```json
{
  "command": "ask",
  "id": "unique_command_id",
  "reply": "用户回答的文本",
  "status": "completed"
}
```

### Movement Commands

#### Go to Location Command
```json
{
  "command": "goto",
  "location": "The exact name of the location as set in Temi",
  "id": "unique_command_id"  
}
```
- Description: Commands Temi to navigate to a pre-defined location
- WebSocket Response: 
```json
{
  "command": "goto",
  "id": "unique_command_id",
  "status": "completed",
  "location": "location_name"
}
```

#### Move Command
```json
{
  "command": "move",
  "x": 0.5,    // Linear velocity, range -1~1, positive=forward, negative=backward
  "y": 0.5     // Angular velocity, range -1~1, positive=left turn, negative=right turn
}
```
- Description: Controls continuous movement of the robot. The robot will keep moving at the specified velocity until a stop command is received or a new movement command is issued
- To stop movement: Send a move command with x=0 and y=0
```json
{
  "command": "move",
  "x": 0,
  "y": 0
}
```
- Notes:
  - x and y values are clamped to the range of -1 to 1
  - Movement commands are sent every 500ms to maintain continuous movement
  - New movement commands will update the current movement velocity
  - Basic obstacle avoidance is handled by Temi's built-in safety features

- WebSocket Response: 
  - Start moving:
  ```json
  {
    "command": "move",
    "status": "started",
    "x": 0.5,
    "y": 0.5
  }
  ```
  - Update movement:
  ```json
  {
    "command": "move",
    "status": "updated",
    "x": 0.7,
    "y": 0.3
  }
  ```
  - Stop moving:
  ```json
  {
    "command": "move",
    "status": "stopped",
    "x": 0,
    "y": 0
  }
  ```

#### Stop Movement Command
```json
{
  "command": "stopMovement",
  "id": "unique_command_id"
}
```
- Description: Stops any current movement
- WebSocket Response: `{"command":"stopMovement", "id":"unique_command_id", "status":"stopped"}`

#### Turn By Command
```json
{
  "command": "turn",
  "angle": 90,
  "id": "unique_command_id"
}
```
- Description: Turns robot by specified angle (degrees, positive=right, negative=left)
- WebSocket Response: 
```json
{
  "command": "turn",
  "id": "unique_command_id",
  "status": "completed"
}
```

#### Tilt Command
```json
{
  "command": "tilt",
  "angle": 45,
  "id": "unique_command_id"
}
```
- Description: Tilts robot's head by specified angle (degrees, positive=up, negative=down)
- WebSocket Response: 
```json
{
  "command": "tilt",
  "id": "unique_command_id",
  "angle": 45,
  "status": "completed"
}
```

### Following Commands

#### Be With Me Command
```json
{
  "command": "beWithMe",
  "id": "unique_command_id"
}
```
- Description: Makes robot follow the user
- WebSocket Response: 
```json
{
  "command": "beWithMe",
  "id": "unique_command_id", 
  "status": "following"
}
```

#### Constraint Be With Command
```json
{
  "command": "constraintBeWith",
  "id": "unique_command_id"
}
```
- Description: Makes robot follow with constraints
- WebSocket Response: 
```json
{
  "command": "constraintBeWith",
  "id": "unique_command_id", 
  "status": "following"
}
```

### Location Management Commands

#### Save Location Command
```json
{
  "command": "saveLocation",
  "locationName": "kitchen",
  "id": "unique_command_id"
}
```
- Description: Saves current position as a named location
- WebSocket Response: 
```json
{
  "command": "saveLocation",
  "id": "unique_command_id",
  "status": "completed",
  "location": "kitchen"
}
```

#### Delete Location Command
```json
{
  "command": "deleteLocation",
  "locationName": "kitchen",
  "id": "unique_command_id"
}
```
- Description: Deletes a saved location
- WebSocket Response: 
```json
{
  "command": "deleteLocation",
  "id": "unique_command_id",
  "status": "completed",
  "location": "kitchen"
}
```

### Camera Commands

#### Camera Control Commands
```json
{
  "command": "startCamera",  // or "stopCamera", "showCameraPreview", "hideCameraPreview"
  "id": "unique_command_id"
}
```
- Description: Controls camera operations
- WebSocket Response: 
```json
{
  "command": "startCamera",
  "id": "unique_command_id",
  "status": "success"
}
```

#### Take Picture Command
```json
{
  "command": "takePicture",
  "id": "unique_command_id"
}
```
- Description: Takes a picture using robot's camera
- WebSocket Response: 
```json
{
  "command": "takePicture",
  "id": "unique_command_id",
  "path": "image_file_path",
  "imageData": "base64_encoded_image"
}
```
- Error Response:
```json
{
  "id": "unique_command_id", 
  "error": "error_message"
}
```

#### Recording Commands
```json
{
  "command": "startRecording",  // or "stopRecording"
  "id": "unique_command_id"
}
```
- Description: Controls video recording
- WebSocket Response:
```json
{
  "command": "startRecording", // or "stopRecording"
  "id": "unique_command_id",
  "status": "success"
}
```

### Detection and Tracking Commands

#### Set Detection Mode Command
```json
{
  "command": "setDetectionMode",
  "on": true,
  "id": "unique_command_id"
}
```
- Description: Enables or disables detection mode
- WebSocket Response: 
```json
{
  "command": "setDetectionMode",
  "id": "unique_command_id",
  "status": "completed",
  "isOn": true
}
```

#### Check Detection Mode Command
```json
{
  "command": "checkDetectionMode",
  "id": "unique_command_id"
}
```
- Description: Checks if detection mode is enabled
- WebSocket Response: 
```json
{
  "command": "checkDetectionMode",
  "id": "unique_command_id",
  "isOn": true
}
```

#### Set Track User Command
```json
{
  "command": "setTrackUserOn",
  "on": true,
  "id": "unique_command_id"
}
```
- Description: Enables or disables user tracking
- WebSocket Response: 
```json
{
  "command": "setTrackUserOn",
  "id": "unique_command_id",
  "status": "success"
}
```

#### Movement Command
```json
{
  "command": "move",
  "x": 0.5,
  "y": 0.5
}
```
- Description: Controls continuous movement of the robot
- WebSocket Response: 
```json
{
  "command": "move",
  "status": "started|updated|stopped",
  "x": 0.5,
  "y": 0.5
}
```

### System Commands

#### Wake Up Command
```json
{
  "command": "wakeup",
  "id": "unique_command_id"
}
```
- Description: Wakes up the robot from sleep mode
- WebSocket Response: `{"command":"wakeup", "id":"unique_command_id", "status":"completed"}`

### Communication Commands

#### Get Contact Command
```json
{
  "command": "getContact",
  "id": "unique_command_id"
}
```
- Description: Gets the contact list from Temi
- WebSocket Response: `{"command":"getContact", "id":"unique_command_id", "contacts":[...]}`

#### Call Command
```json
{
  "command": "call",
  "userId": "user_id_to_call",
  "id": "unique_command_id"
}
```
- Description: Initiates a call to specified user
- WebSocket Response: `{"command":"call", "id":"unique_command_id", "status":"initiated"}`

### Screen Commands

#### Load Screen Command
```json
{
  "command": "display",
  "url": "URL_TO_LOAD",
  "id": "unique_command_id"
}
```
- Description: Loads a web page on Temi's screen
- WebSocket Response: `{"command":"display", "id":"unique_command_id", "status":"loaded"}`

### Using Node-RED

~~1. [Install Node-RED](https://nodered.org/docs/getting-started/local)~~
~~2. Import our custom nodes from [this JSON file](https://gist.github.com/shaunabanana/1c70946826b08cb46c49c8e8b105a726)~~
~~3. Configure the nodes with your Temi's IP address~~
~~4. Start building your control flows!~~

To be updated

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

Copyright (c) 2024 CDI Lab

## Acknowledgments

This project was used in our CHI'21 paper "Patterns for Representing Knowledge Graphs to Communicate Situational Knowledge of Service Robots".
