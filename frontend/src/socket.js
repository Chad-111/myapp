import { io } from "socket.io-client";
import { getAuthToken } from "./utils/auth"; // Adjust if your path differs

const socket = io("http://localhost:5000", {
  autoConnect: false,
  auth: {
    token: getAuthToken(), // Uses your token utility
  },
});

export default socket;
