import dotenv from "dotenv";
import { Collection, Db, MongoClient } from "mongodb";

dotenv.config();

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL;

if (!mongoUri) {
  throw new Error(
    "MONGODB_URI is missing. Set it to a MongoDB connection string.",
  );
}

if (!/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
  throw new Error(
    "MONGODB_URI must be a MongoDB connection string.",
  );
}

const dbName =
  process.env.MONGODB_DB ||
  process.env.MONGO_DB ||
  new URL(mongoUri).pathname.replace(/^\//, "") ||
  "clockify";

const client = new MongoClient(mongoUri);
let connectPromise: Promise<MongoClient> | null = null;

export const connectDb = async () => {
  if (!connectPromise) {
    connectPromise = client.connect();
  }

  return connectPromise;
};

export const getDb = async (): Promise<Db> => {
  const connectedClient = await connectDb();
  return connectedClient.db(dbName);
};

type CollectionNames =
  | "users"
  | "clients"
  | "projects"
  | "tasks"
  | "time_entries"
  | "shared_reports";

export const getCollections = async () => {
  const db = await getDb();

  return {
    users: db.collection("users" as CollectionNames),
    clients: db.collection("clients" as CollectionNames),
    projects: db.collection("projects" as CollectionNames),
    tasks: db.collection("tasks" as CollectionNames),
    timeEntries: db.collection("time_entries" as CollectionNames),
    sharedReports: db.collection("shared_reports" as CollectionNames),
  } as {
    users: Collection;
    clients: Collection;
    projects: Collection;
    tasks: Collection;
    timeEntries: Collection;
    sharedReports: Collection;
  };
};

export const ensureIndexes = async () => {
  const { clients, projects, tasks, timeEntries, sharedReports } =
    await getCollections();

  await Promise.all([
    clients.createIndex({ user_id: 1 }),
    projects.createIndex({ user_id: 1 }),
    projects.createIndex({ client_id: 1 }),
    tasks.createIndex({ project_id: 1 }),
    timeEntries.createIndex({ user_id: 1 }),
    timeEntries.createIndex({ client_id: 1 }),
    timeEntries.createIndex({ project_id: 1 }),
    timeEntries.createIndex({ date: -1 }),
    sharedReports.createIndex({ user_id: 1 }),
    sharedReports.createIndex({ share_token: 1 }, { unique: true }),
  ]);
};

export const closeDb = async () => {
  if (connectPromise) {
    const connectedClient = await connectPromise;
    await connectedClient.close();
    connectPromise = null;
  }
};
