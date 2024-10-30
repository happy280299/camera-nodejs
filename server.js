// File: server.js
const express = require('express');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = 3000;

// Phục vụ file HTML để hiển thị video từ client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Khởi tạo server WebSocket để truyền video
const server = app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://192.168.122.24:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Gửi dữ liệu video đến tất cả các client đã kết nối
wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Thiết lập ffmpeg để lấy dữ liệu từ camera USB (video0)
const command = ffmpeg('/dev/video0')
  .inputFormat('v4l2')
  .format('mpeg1video')
  .size('320x240') // Lower resolution
  .fps(15) // Lower frame rate
  .videoBitrate('500k') // Lower bitrate
  .on('start', () => {
    console.log('Đã bắt đầu streaming từ camera USB');
  })
  .on('error', (err) => {
    console.error('Lỗi ffmpeg:', err.message);
  });

const ffstream = command.pipe();

ffstream.on('data', (data) => {
  wss.broadcast(data);
});
