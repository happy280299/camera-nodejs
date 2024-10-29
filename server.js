// File: server.js
const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Route để phục vụ file HTML hiển thị camera
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // File HTML sẽ được tạo trong bước tiếp theo
});

// Khởi tạo server WebSocket để truyền dữ liệu camera
const server = app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://192.168.122.24:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Gửi dữ liệu tới tất cả các client đã kết nối
wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Khởi động camera và truyền dữ liệu qua WebSocket
const stream = spawn('raspivid', ['-o', '-', '-t', '0', '-w', '640', '-h', '480', '-fps', '24']);

// Khi có dữ liệu từ camera, gửi tới tất cả các client
stream.stdout.on('data', (data) => {
  wss.broadcast(data);
});

// Xử lý lỗi từ camera
stream.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

// Khi camera kết thúc
stream.on('close', () => {
  console.log('Camera stream ended');
});
