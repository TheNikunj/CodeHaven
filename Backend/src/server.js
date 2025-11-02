// Load environment variables first
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { createSocketServer } from "./SocketIo/SocketIo.js";

// ✅ Check if Mongo URI is loaded properly
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env file!");
  process.exit(1);
}

console.log("✅ Loaded Mongo URI: Found");

// Create socket + express server
const appServer = createSocketServer();

// ✅ Always use the Render-provided port (never hardcode)
const PORT = process.env.PORT || 10000;

connectDB()
  .then(() => {
    appServer.listen(PORT, () => {
      console.log(`🚀 Server is running and listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // stop app if DB fails
  });
