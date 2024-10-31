const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const NodeWebcam = require("node-webcam");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure webcam options
const webcamOpts = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: false,
  output: "jpeg",
  callbackReturn: "buffer",
  verbose: false,
  device: "/dev/video0" // or use `null` to autodetect
};

const webcam = NodeWebcam.create(webcamOpts);

// Serve static HTML page to display camera feed
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Capture images and send to client every second
io.on("connection", (socket) => {
  console.log("New client connected");

  const captureImage = () => {
    NodeWebcam.capture("test", webcamOpts, (err, data) => {
      if (err) return console.log(err);
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

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});

