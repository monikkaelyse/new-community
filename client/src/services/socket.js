import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.io connection with JWT auth.
 * All chat payloads are E2E encrypted before being sent.
 */
export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io({
    auth: { token },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
