const WebSocket = require("ws");

// WebSocket server that listens for incoming connections
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let latestFrame = null; // Store the latest frame

// When a Raspberry Pi client connects
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Store the frame sent by the Raspberry Pi
  ws.on("message", (data) => {
    latestFrame = data;

    // Broadcast the frame to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ image: true, buffer: latestFrame }));
      }
    });
  });

  // Log when a client disconnects
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running.");
