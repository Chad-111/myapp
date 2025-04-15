import { io } from "socket.io-client";
import { getAuthToken } from "./components/utils/auth";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  auth: {
    token: getAuthToken(),
  },
});

export default socket;
