// src/socket.js
import { io } from "socket.io-client";
import { getAuthToken } from "./components/utils/auth";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"], // force websocket clearly
});

// Always dynamically update token before every connection
socket.on("connect_error", (error) => {
  console.error("Socket connect error:", error.message);
});

socket.on("connect", () => {
  console.log("Connected successfully:", socket.id);
});

const originalConnect = socket.connect;
socket.connect = () => {
  console.log("Connecting socket with token:", getAuthToken());
  socket.io.opts.query = { jwt: getAuthToken() };
  originalConnect.call(socket);
};

export default socket;
