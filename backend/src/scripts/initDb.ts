import { ensureIndexes, closeDb } from "../db";

const initializeDatabase = async () => {
  try {
    console.log("Initializing MongoDB indexes...");
    await ensureIndexes();
    console.log("MongoDB initialized successfully!");
    await closeDb();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing MongoDB:", error);
    process.exit(1);
  }
};

initializeDatabase();
