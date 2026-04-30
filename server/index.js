const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Attach io to requests so routes can emit
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use('/api', routes);

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Socket.io real-time layer
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('join-squad', (squadId) => {
    socket.join(`squad:${squadId}`);
    console.log(`[socket] ${socket.id} joined squad:${squadId}`);
  });

  socket.on('leave-squad', (squadId) => {
    socket.leave(`squad:${squadId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Savings Squads server running at http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates\n`);
});
