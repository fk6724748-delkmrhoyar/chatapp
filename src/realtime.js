// CK Chat (Node) - Socket.IO realtime layer.
// Gives the app instant messages, typing, online state and one-click WebRTC calls.
const onlineUsers = new Map(); // userId -> Set(socketId)

module.exports = function realtime(io) {
  io.on('connection', (socket) => {
    let uid = null;

    socket.on('auth', (userId) => {
      uid = parseInt(userId, 10) || null;
      if (!uid) return;
      socket.join('user:' + uid);
      if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
      onlineUsers.get(uid).add(socket.id);
      io.emit('presence', { userId: uid, online: true });
    });

    socket.on('join', (room) => { if (room) socket.join(String(room)); });
    socket.on('leave', (room) => { if (room) socket.leave(String(room)); });

    socket.on('typing', ({ to, name, on }) => {
      if (to) io.to('user:' + to).emit('typing', { from: uid, name, on: !!on });
    });

    // ---- WebRTC signalling (voice + video calls) ----
    socket.on('call:offer', (data) => {
      if (data && data.to) io.to('user:' + data.to).emit('call:offer', { ...data, from: uid });
    });
    socket.on('call:answer', (data) => {
      if (data && data.to) io.to('user:' + data.to).emit('call:answer', { ...data, from: uid });
    });
    socket.on('call:ice', (data) => {
      if (data && data.to) io.to('user:' + data.to).emit('call:ice', { ...data, from: uid });
    });
    socket.on('call:end', (data) => {
      if (data && data.to) io.to('user:' + data.to).emit('call:end', { ...data, from: uid });
    });

    socket.on('disconnect', () => {
      if (!uid) return;
      const set = onlineUsers.get(uid);
      if (set) {
        set.delete(socket.id);
        if (!set.size) {
          onlineUsers.delete(uid);
          io.emit('presence', { userId: uid, online: false });
        }
      }
    });
  });
};

module.exports.onlineUsers = onlineUsers;
