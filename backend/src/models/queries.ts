import { ObjectId } from "mongodb";
import { getCollections } from "../db";

type QueryResult<T> = Promise<{ rows: T[] }>;

type MongoDoc = {
  _id: ObjectId;
  created_at?: Date;
};

type UserDoc = MongoDoc & {
  email: string;
  password_hash: string;
  name: string;
};

type ClientDoc = MongoDoc & {
  user_id: string;
  name: string;
  email?: string | null;
};

type ProjectDoc = MongoDoc & {
  user_id: string;
  client_id: string;
  name: string;
};

type TaskDoc = MongoDoc & {
  project_id: string;
  name: string;
};

type TimeEntryDoc = MongoDoc & {
  user_id: string;
  client_id: string;
  project_id: string;
  task_id?: string | null;
  description?: string | null;
  date: string;
  hours: number;
  price_per_hour: number;
  is_billable: boolean;
};

type SharedReportDoc = MongoDoc & {
  user_id: string;
  client_id: string;
  start_date?: string | null;
  end_date?: string | null;
  share_token: string;
  is_active: boolean;
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

type AuthUser = PublicUser & {
  password_hash: string;
};

type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
};

type TimeEntryRow = {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  task_id: string | null;
  description: string | null;
  date: string;
  hours: number;
  price_per_hour: number;
  is_billable: boolean;
  created_at: string;
};

type SharedReportRow = {
  id: string;
  user_id: string;
  client_id: string;
  start_date: string | null;
  end_date: string | null;
  share_token: string;
  is_active: boolean;
  created_at: string;
};

type SummaryRow = {
  total_hours: number;
  total_amount: number;
  client_id: string;
  project_id: string;
};

const now = () => new Date();

const toObjectId = (id: string) => {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
};

const toIsoString = (value?: Date | string) => {
  if (!value) {
    return now().toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const serializeUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
  email: doc.email,
  name: doc.name,
  created_at: toIsoString(doc.created_at),
});

const serializeAuthUser = (doc: UserDoc): AuthUser => ({
  ...serializeUser(doc),
  password_hash: doc.password_hash,
});

const serializeClient = (doc: ClientDoc): ClientRow => ({
  id: doc._id.toString(),
  user_id: doc.user_id,
  name: doc.name,
  email: doc.email ?? null,
  created_at: toIsoString(doc.created_at),
});

const serializeProject = (doc: ProjectDoc): ProjectRow => ({
  id: doc._id.toString(),
  user_id: doc.user_id,
  client_id: doc.client_id,
  name: doc.name,
  created_at: toIsoString(doc.created_at),
});

const serializeTask = (doc: TaskDoc): TaskRow => ({
  id: doc._id.toString(),
  project_id: doc.project_id,
  name: doc.name,
  created_at: toIsoString(doc.created_at),
});

const serializeTimeEntry = (doc: TimeEntryDoc): TimeEntryRow => ({
  id: doc._id.toString(),
  user_id: doc.user_id,
  client_id: doc.client_id,
  project_id: doc.project_id,
  task_id: doc.task_id ?? null,
  description: doc.description ?? null,
  date: doc.date,
  hours: Number(doc.hours),
  price_per_hour: Number(doc.price_per_hour),
  is_billable: Boolean(doc.is_billable),
  created_at: toIsoString(doc.created_at),
});

const serializeSharedReport = (doc: SharedReportDoc): SharedReportRow => ({
  id: doc._id.toString(),
  user_id: doc.user_id,
  client_id: doc.client_id,
  start_date: doc.start_date ?? null,
  end_date: doc.end_date ?? null,
  share_token: doc.share_token,
  is_active: doc.is_active,
  created_at: toIsoString(doc.created_at),
});

const buildTimeEntryFilter = (
  userId: string,
  startDate?: string,
  endDate?: string,
  clientId?: string,
  projectId?: string,
  billableOnly = false,
) => {
  const filter: Record<string, unknown> = { user_id: userId };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      (filter.date as Record<string, string>).$gte = startDate;
    }
    if (endDate) {
      (filter.date as Record<string, string>).$lte = endDate;
    }
  }

  if (clientId) {
    filter.client_id = clientId;
  }

  if (projectId) {
    filter.project_id = projectId;
  }

  if (billableOnly) {
    filter.is_billable = true;
  }

  return filter;
};

const cascadeDeleteProjects = async (projectIds: string[]) => {
  if (projectIds.length === 0) {
    return;
  }

  const { tasks, timeEntries, projects } = await getCollections();
  await tasks.deleteMany({ project_id: { $in: projectIds } });
  await timeEntries.deleteMany({ project_id: { $in: projectIds } });
  await projects.deleteMany({ _id: { $in: projectIds.map((id) => new ObjectId(id)) } });
};

// User queries
export const createUser = async (
  email: string,
  passwordHash: string,
  name: string,
): QueryResult<PublicUser> => {
  const { users } = await getCollections();
  const result = await users.insertOne({
    email,
    password_hash: passwordHash,
    name,
    created_at: now(),
  });

  const user = await users.findOne({ _id: result.insertedId });
  return { rows: user ? [serializeUser(user as UserDoc)] : [] };
};

export const getUserByEmail = async (email: string): QueryResult<AuthUser> => {
  const { users } = await getCollections();
  const user = await users.findOne({ email });
  return { rows: user ? [serializeAuthUser(user as UserDoc)] : [] };
};

export const getUserById = async (id: string): QueryResult<PublicUser> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { users } = await getCollections();
  const user = await users.findOne({ _id: objectId });
  return { rows: user ? [serializeUser(user as UserDoc)] : [] };
};

// Client queries
export const createClient = async (
  userId: string,
  name: string,
  email?: string,
): QueryResult<ClientRow> => {
  const { clients } = await getCollections();
  const result = await clients.insertOne({
    user_id: userId,
    name,
    email: email || null,
    created_at: now(),
  });

  const client = await clients.findOne({ _id: result.insertedId });
  return { rows: client ? [serializeClient(client as ClientDoc)] : [] };
};

export const getClients = async (userId: string): QueryResult<ClientRow> => {
  const { clients } = await getCollections();
  const rows = await clients
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  return { rows: rows.map((client) => serializeClient(client as ClientDoc)) };
};

export const getClientById = async (id: string): QueryResult<ClientRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { clients } = await getCollections();
  const client = await clients.findOne({ _id: objectId });
  return { rows: client ? [serializeClient(client as ClientDoc)] : [] };
};

export const updateClient = async (
  id: string,
  name: string,
  email?: string,
): QueryResult<ClientRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { clients } = await getCollections();
  await clients.updateOne(
    { _id: objectId },
    { $set: { name, email: email || null } },
  );
  const client = await clients.findOne({ _id: objectId });
  return { rows: client ? [serializeClient(client as ClientDoc)] : [] };
};

export const deleteClient = async (id: string) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return;
  }

  const { clients, projects, sharedReports, timeEntries } = await getCollections();
  const projectDocs = await projects.find({ client_id: id }).toArray();
  const projectIds = projectDocs.map((project) => project._id.toString());

  await sharedReports.deleteMany({ client_id: id });
  await timeEntries.deleteMany({ client_id: id });
  await cascadeDeleteProjects(projectIds);
  await clients.deleteOne({ _id: objectId });
};

// Project queries
export const createProject = async (
  userId: string,
  clientId: string,
  name: string,
): QueryResult<ProjectRow> => {
  const { projects } = await getCollections();
  const result = await projects.insertOne({
    user_id: userId,
    client_id: clientId,
    name,
    created_at: now(),
  });

  const project = await projects.findOne({ _id: result.insertedId });
  return { rows: project ? [serializeProject(project as ProjectDoc)] : [] };
};

export const getProjects = async (
  userId: string,
  clientId?: string,
): QueryResult<ProjectRow> => {
  const { projects } = await getCollections();
  const filter: Record<string, unknown> = { user_id: userId };
  if (clientId) {
    filter.client_id = clientId;
  }

  const rows = await projects
    .find(filter)
    .sort({ created_at: -1 })
    .toArray();

  return { rows: rows.map((project) => serializeProject(project as ProjectDoc)) };
};

export const getProjectById = async (id: string): QueryResult<ProjectRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { projects } = await getCollections();
  const project = await projects.findOne({ _id: objectId });
  return { rows: project ? [serializeProject(project as ProjectDoc)] : [] };
};

export const updateProject = async (
  id: string,
  name: string,
): QueryResult<ProjectRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { projects } = await getCollections();
  await projects.updateOne({ _id: objectId }, { $set: { name } });
  const project = await projects.findOne({ _id: objectId });
  return { rows: project ? [serializeProject(project as ProjectDoc)] : [] };
};

export const deleteProject = async (id: string) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return;
  }

  const { projects, tasks, timeEntries } = await getCollections();
  const taskDocs = await tasks.find({ project_id: id }).toArray();
  const taskIds = taskDocs.map((task) => task._id.toString());

  await timeEntries.deleteMany({ project_id: id });
  await tasks.deleteMany({ project_id: id });
  await projects.deleteOne({ _id: objectId });
  if (taskIds.length > 0) {
    await timeEntries.updateMany(
      { task_id: { $in: taskIds } },
      { $set: { task_id: null } },
    );
  }
};

// Task queries
export const createTask = async (
  projectId: string,
  name: string,
): QueryResult<TaskRow> => {
  const { tasks } = await getCollections();
  const result = await tasks.insertOne({
    project_id: projectId,
    name,
    created_at: now(),
  });

  const task = await tasks.findOne({ _id: result.insertedId });
  return { rows: task ? [serializeTask(task as TaskDoc)] : [] };
};

export const getTasks = async (projectId: string): QueryResult<TaskRow> => {
  const { tasks } = await getCollections();
  const rows = await tasks
    .find({ project_id: projectId })
    .sort({ created_at: -1 })
    .toArray();

  return { rows: rows.map((task) => serializeTask(task as TaskDoc)) };
};

export const getTaskById = async (id: string): QueryResult<TaskRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { tasks } = await getCollections();
  const task = await tasks.findOne({ _id: objectId });
  return { rows: task ? [serializeTask(task as TaskDoc)] : [] };
};

export const deleteTask = async (id: string) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return;
  }

  const { timeEntries, tasks } = await getCollections();
  await timeEntries.updateMany(
    { task_id: id },
    { $set: { task_id: null } },
  );
  await tasks.deleteOne({ _id: objectId });
};

// Time entry queries
export const createTimeEntry = async (
  userId: string,
  clientId: string,
  projectId: string,
  taskId: string | null,
  description: string | null,
  date: string,
  hours: number,
  pricePerHour: number,
  isBillable: boolean,
): QueryResult<TimeEntryRow> => {
  const { timeEntries } = await getCollections();
  const result = await timeEntries.insertOne({
    user_id: userId,
    client_id: clientId,
    project_id: projectId,
    task_id: taskId,
    description,
    date,
    hours,
    price_per_hour: pricePerHour,
    is_billable: isBillable,
    created_at: now(),
  });

  const entry = await timeEntries.findOne({ _id: result.insertedId });
  return { rows: entry ? [serializeTimeEntry(entry as TimeEntryDoc)] : [] };
};

export const getTimeEntries = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  clientId?: string,
  projectId?: string,
  billableOnly = false,
): QueryResult<TimeEntryRow> => {
  const { timeEntries } = await getCollections();
  const rows = await timeEntries
    .find(
      buildTimeEntryFilter(
        userId,
        startDate,
        endDate,
        clientId,
        projectId,
        billableOnly,
      ),
    )
    .sort({ date: -1, created_at: -1 })
    .toArray();

  return {
    rows: rows.map((entry) => serializeTimeEntry(entry as TimeEntryDoc)),
  };
};

export const getTimeEntryById = async (id: string): QueryResult<TimeEntryRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { timeEntries } = await getCollections();
  const entry = await timeEntries.findOne({ _id: objectId });
  return { rows: entry ? [serializeTimeEntry(entry as TimeEntryDoc)] : [] };
};

export const updateTimeEntry = async (
  id: string,
  clientId: string,
  projectId: string,
  taskId: string | null,
  description: string | null,
  date: string,
  hours: number,
  pricePerHour: number,
  isBillable: boolean,
): QueryResult<TimeEntryRow> => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return { rows: [] };
  }

  const { timeEntries } = await getCollections();
  await timeEntries.updateOne(
    { _id: objectId },
    {
      $set: {
        client_id: clientId,
        project_id: projectId,
        task_id: taskId,
        description,
        date,
        hours,
        price_per_hour: pricePerHour,
        is_billable: isBillable,
      },
    },
  );

  const entry = await timeEntries.findOne({ _id: objectId });
  return { rows: entry ? [serializeTimeEntry(entry as TimeEntryDoc)] : [] };
};

export const deleteTimeEntry = async (id: string) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    return;
  }

  const { timeEntries } = await getCollections();
  await timeEntries.deleteOne({ _id: objectId });
};

// Report queries
export const getReportSummary = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  clientId?: string,
  projectId?: string,
) => {
  const entriesResult = await getTimeEntries(
    userId,
    startDate,
    endDate,
    clientId,
    projectId,
    true,
  );

  const summaryByKey = {
    byClient: new Map<string, { name: string; hours: number; amount: number }>(),
    byProject: new Map<string, { name: string; hours: number; amount: number }>(),
  };

  let totalHours = 0;
  let totalAmount = 0;

  const { clients, projects } = await getCollections();

  for (const entry of entriesResult.rows) {
    const amount = entry.hours * entry.price_per_hour;
    totalHours += entry.hours;
    totalAmount += amount;

    if (!summaryByKey.byClient.has(entry.client_id)) {
      const client = await clients.findOne({ _id: new ObjectId(entry.client_id) });
      summaryByKey.byClient.set(entry.client_id, {
        name: client ? (client as ClientDoc).name : "Unknown",
        hours: 0,
        amount: 0,
      });
    }

    if (!summaryByKey.byProject.has(entry.project_id)) {
      const project = await projects.findOne({
        _id: new ObjectId(entry.project_id),
      });
      summaryByKey.byProject.set(entry.project_id, {
        name: project ? (project as ProjectDoc).name : "Unknown",
        hours: 0,
        amount: 0,
      });
    }

    const clientBucket = summaryByKey.byClient.get(entry.client_id)!;
    clientBucket.hours += entry.hours;
    clientBucket.amount += amount;

    const projectBucket = summaryByKey.byProject.get(entry.project_id)!;
    projectBucket.hours += entry.hours;
    projectBucket.amount += amount;
  }

  const summary = {
    total_hours: totalHours,
    total_amount: totalAmount,
    by_client: Array.from(summaryByKey.byClient.entries()).map(([id, data]) => ({
      id,
      ...data,
    })),
    by_project: Array.from(summaryByKey.byProject.entries()).map(([id, data]) => ({
      id,
      ...data,
    })),
  };

  return { rows: [summary] };
};

// Shared reports queries
export const createSharedReport = async (
  userId: string,
  clientId: string,
  startDate: string | null,
  endDate: string | null,
  shareToken: string,
): QueryResult<SharedReportRow> => {
  const { sharedReports } = await getCollections();
  const result = await sharedReports.insertOne({
    user_id: userId,
    client_id: clientId,
    start_date: startDate,
    end_date: endDate,
    share_token: shareToken,
    is_active: true,
    created_at: now(),
  });

  const shared = await sharedReports.findOne({ _id: result.insertedId });
  return { rows: shared ? [serializeSharedReport(shared as SharedReportDoc)] : [] };
};

export const getSharedReportByToken = async (
  token: string,
): QueryResult<SharedReportRow> => {
  const { sharedReports } = await getCollections();
  const shared = await sharedReports.findOne({
    share_token: token,
    is_active: true,
  });
  return { rows: shared ? [serializeSharedReport(shared as SharedReportDoc)] : [] };
};

export const deleteSharedReport = async (token: string) => {
  const { sharedReports } = await getCollections();
  await sharedReports.updateOne(
    { share_token: token },
    { $set: { is_active: false } },
  );
};
