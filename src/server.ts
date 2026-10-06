import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import { initializeSocket } from "./config/socket.js";

const PORT = Number(process.env.PORT) || 5001;

const httpServer = http.createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});