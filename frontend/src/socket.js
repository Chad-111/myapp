import { io } from "socket.io-client";
import { getAuthToken } from "./components/utils/auth";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  query: {
    token: getAuthToken(), // This might be null on initial load
  },
});

// Add reconnection logic
socket.on("connect_error", (error) => {
  if (error.message === "jwt expired") {
    const token = getAuthToken(); // Get fresh token
    socket.auth = { token };
    socket.connect();
  }
});

export default socket;
