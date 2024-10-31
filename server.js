const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to the Raspberry Pi through WebSocket
const raspberryPiUrl = "ws://192.168.122.24:3000"; // Replace with Raspberry Pi WebSocket URL
const raspberryPiSocket = new WebSocket(raspberryPiUrl);

// Store the latest frame
let latestFrame = null;

// When a frame is received from Raspberry Pi
raspberryPiSocket.on("message", (data) => {
  latestFrame = data; // Update the latest frame with the received data
});

raspberryPiSocket.on("error", (error) => {
  console.error("Error connecting to Raspberry Pi:", error.message);
});

// Serve static HTML for clients
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Serve the latest frame to connected clients
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send the latest frame every second
  const intervalId = setInterval(() => {
    if (latestFrame) {
      socket.emit("image", { image: true, buffer: latestFrame });
    }
  }, 1000);

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
