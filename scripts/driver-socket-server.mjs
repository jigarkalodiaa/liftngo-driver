/**
 * LiftNGo driver real-time hub (dev).
 * Run: node scripts/driver-socket-server.mjs
 * Default port 3001 — set SOCKET_PORT to override.
 *
 * Relays driver:event to trip rooms and admin; supports trip resync stub.
 */
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT || 3001);
const tripState = new Map();

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LiftNGo socket server OK\n");
});

const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  socket.on("join_driver", ({ driverId }) => {
    if (driverId) socket.join(`driver:${driverId}`);
  });

  socket.on("join_trip", ({ tripId, driverId }) => {
    if (!tripId) return;
    socket.join(`trip:${tripId}`);
    if (driverId) socket.join(`driver:${driverId}`);
  });

  socket.on("driver:event", (payload) => {
    const tripId = payload?.tripId;
    if (tripId) {
      tripState.set(tripId, { ...payload, receivedAt: Date.now() });
      io.to(`trip:${tripId}`).emit("trip:sync", payload);
    }
    io.emit("trip:sync", payload);
  });

  socket.on("trip:resync_request", ({ tripId }) => {
    const last = tripState.get(tripId);
    socket.emit("trip:resync_state", last || { tripId, status: null });
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[socket] listening on http://127.0.0.1:${PORT}`);
});
