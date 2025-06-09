const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const ROOM_ID = 'main-room';
let usersInRoom = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join single room
  socket.join(ROOM_ID);
  usersInRoom.add(socket.id);

  // Notify all clients with updated user list
  io.to(ROOM_ID).emit('users-update', Array.from(usersInRoom));

  // Forward signaling messages only to room
  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('candidate', ({ candidate, to }) => {
    socket.to(to).emit('candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    usersInRoom.delete(socket.id);
    io.to(ROOM_ID).emit('users-update', Array.from(usersInRoom));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
