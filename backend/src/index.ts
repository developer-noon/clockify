import express, { Express, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import clientsRoutes from "./routes/clients";
import projectsRoutes from "./routes/projects";
import tasksRoutes from "./routes/tasks";
import timeEntriesRoutes from "./routes/timeEntries";
import reportsRoutes from "./routes/reports";
import { connectDb, ensureIndexes } from "./db";

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/time-entries", timeEntriesRoutes);
app.use("/api/reports", reportsRoutes);

// Health check
app.get("/health", (req, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();
    await ensureIndexes();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
