import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Set up Socket.io event handlers for E2E encrypted chat.
 * Messages are encrypted client-side — server only relays ciphertext.
 */
export function setupSocket(io) {
  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);

    // Join community room
    if (socket.user.communityId) {
      socket.join(`community:${socket.user.communityId}`);
    }

    // Handle encrypted chat message
    socket.on('chat:message', (data) => {
      // data contains: { channelId, encryptedContent, nonce, senderPublicKey }
      // Server relays encrypted payload — it cannot read the content
      const payload = {
        ...data,
        senderId: socket.user.userId,
        senderUsername: socket.user.username,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to channel (could be community-wide or DM)
      socket.to(data.channelId).emit('chat:message', payload);

      // TODO: Phase 5 — persist encrypted message to MongoDB
    });

    // Join a specific chat channel
    socket.on('chat:join', (channelId) => {
      socket.join(channelId);
      console.log(`${socket.user.username} joined channel: ${channelId}`);
    });

    // Leave a chat channel
    socket.on('chat:leave', (channelId) => {
      socket.leave(channelId);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });
}
