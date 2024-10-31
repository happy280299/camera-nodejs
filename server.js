const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const NodeWebcam = require("node-webcam");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure webcam options for Raspberry Pi
const webcamOpts = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: false,
  output: "jpeg",
  callbackReturn: "buffer",
  verbose: false,
  device: "/dev/video0" // or `null` to autodetect
};

const webcam = NodeWebcam.create(webcamOpts);

// Serve static HTML page to display camera feed (optional if you have a frontend)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Send image data to client every second using WebSocket
io.on("connection", (socket) => {
  console.log("New client connected");

  const captureImage = () => {
    webcam.capture("test", (err, data) => {
      if (err) {
        console.log("Error capturing image:", err);
        return;
      }
      socket.emit("image", { image: true, buffer: data.toString("base64") });
    });
  };

  // Set interval to capture image every second
  const intervalId = setInterval(captureImage, 1000);

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

// Proxy endpoint to access camera feed through Render
app.get("/", async (req, res) => {
  try {
    // Replace <IP-RaspberryPi> with the actual IP or DDNS of your Raspberry Pi
    const response = await axios.get("http://192.168.122.24:3000", { responseType: "stream" });
    response.data.pipe(res); // Pipe the camera stream from Raspberry Pi to Render
  } catch (error) {
    console.error("Failed to connect to Raspberry Pi:", error.message);
    res.status(500).send("Cannot connect to Raspberry Pi camera");
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
