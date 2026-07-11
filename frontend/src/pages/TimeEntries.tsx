import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";
import { clientsAPI, projectsAPI, timeEntriesAPI } from "../services/api";
import { Client, Project, Task, TimeEntry } from "../types/index";

type EntryFormState = {
  client_id: string;
  project_id: string;
  task_id: string;
  description: string;
  date: string;
  hours: string;
  price_per_hour: string;
  is_billable: boolean;
};

const emptyForm = (): EntryFormState => ({
  client_id: "",
  project_id: "",
  task_id: "",
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
  hours: "",
  price_per_hour: "",
  is_billable: true,
});

export default function TimeEntries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [entryProjects, setEntryProjects] = useState<Project[]>([]);
  const [filterProjects, setFilterProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [taskNames, setTaskNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editProjects, setEditProjects] = useState<Project[]>([]);
  const [editTasks, setEditTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<EntryFormState>(emptyForm());
  const [editFormData, setEditFormData] = useState<EntryFormState>(emptyForm());
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    clientId: "",
    projectId: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clientsRes, entriesRes] = await Promise.all([
        clientsAPI.getAll(),
        timeEntriesAPI.getAll(),
      ]);
      setClients(clientsRes.data);
      await populateEntries(entriesRes.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const populateEntries = async (entriesData: TimeEntry[]) => {
    const cNames: Record<string, string> = {};
    const pNames: Record<string, string> = {};
    const tNames: Record<string, string> = {};
    const taskCache: Record<string, Task[]> = {};

    for (const entry of entriesData) {
      if (!cNames[entry.client_id]) {
        const res = await clientsAPI.get(entry.client_id);
        cNames[entry.client_id] = res.data.name;
      }

      if (!pNames[entry.project_id]) {
        const res = await projectsAPI.get(entry.project_id);
        pNames[entry.project_id] = res.data.name;
      }

      if (!taskCache[entry.project_id]) {
        const res = await projectsAPI.getTasks(entry.project_id);
        taskCache[entry.project_id] = res.data;
        for (const task of res.data as Task[]) {
          tNames[task.id] = task.name;
        }
      }
    }

    setClientNames(cNames);
    setProjectNames(pNames);
    setTaskNames(tNames);
    setEntries(entriesData);
  };

  const loadEntries = async () => {
    try {
      const res = await timeEntriesAPI.getAll(filters);
      await populateEntries(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load entries");
    }
  };

  const loadProjectsForClient = async (clientId: string) => {
    if (!clientId) {
      setEntryProjects([]);
      setTasks([]);
      return;
    }

    const res = await projectsAPI.getAll(clientId);
    setEntryProjects(res.data);
    setTasks([]);
  };

  const loadEditProjects = async (clientId: string) => {
    if (!clientId) {
      setEditProjects([]);
      setEditTasks([]);
      return;
    }

    const res = await projectsAPI.getAll(clientId);
    setEditProjects(res.data);
    setEditTasks([]);
  };

  const loadTasksForProject = async (projectId: string) => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    const res = await projectsAPI.getTasks(projectId);
    setTasks(res.data);
  };

  const loadEditTasks = async (projectId: string) => {
    if (!projectId) {
      setEditTasks([]);
      return;
    }

    const res = await projectsAPI.getTasks(projectId);
    setEditTasks(res.data);
  };

  const resetCreateForm = () => {
    setFormData(emptyForm());
    setEntryProjects([]);
    setTasks([]);
  };

  const handleCreateClientChange = async (clientId: string) => {
    setFormData({ ...formData, client_id: clientId, project_id: "", task_id: "" });
    await loadProjectsForClient(clientId);
  };

  const handleCreateProjectChange = async (projectId: string) => {
    setFormData({ ...formData, project_id: projectId, task_id: "" });
    await loadTasksForProject(projectId);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !formData.client_id ||
        !formData.project_id ||
        !formData.date ||
        !formData.hours ||
        !formData.price_per_hour
      ) {
        setError("Please fill all required fields");
        return;
      }

      await timeEntriesAPI.create({
        ...formData,
        hours: parseFloat(formData.hours),
        price_per_hour: parseFloat(formData.price_per_hour),
        task_id: formData.task_id || null,
      });

      resetCreateForm();
      setSuccess("Time entry created!");
      loadData();
      window.setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create time entry");
    }
  };

  const startEdit = async (entry: TimeEntry) => {
    setError("");
    setEditingEntry(entry);
    setEditFormData({
      client_id: entry.client_id,
      project_id: entry.project_id,
      task_id: entry.task_id || "",
      description: entry.description || "",
      date: entry.date,
      hours: String(entry.hours),
      price_per_hour: String(entry.price_per_hour),
      is_billable: entry.is_billable,
    });

    const [projectsRes, tasksRes] = await Promise.all([
      projectsAPI.getAll(entry.client_id),
      projectsAPI.getTasks(entry.project_id),
    ]);
    setEditProjects(projectsRes.data);
    setEditTasks(tasksRes.data);
  };

  const handleEditClientChange = async (clientId: string) => {
    setEditFormData({
      ...editFormData,
      client_id: clientId,
      project_id: "",
      task_id: "",
    });
    await loadEditProjects(clientId);
  };

  const handleEditProjectChange = async (projectId: string) => {
    setEditFormData({ ...editFormData, project_id: projectId, task_id: "" });
    await loadEditTasks(projectId);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      await timeEntriesAPI.update(editingEntry.id, {
        ...editFormData,
        hours: parseFloat(editFormData.hours),
        price_per_hour: parseFloat(editFormData.price_per_hour),
        task_id: editFormData.task_id || null,
      });
      setEditingEntry(null);
      setEditProjects([]);
      setEditTasks([]);
      setSuccess("Time entry updated!");
      loadData();
      window.setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update time entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      await timeEntriesAPI.delete(id);
      await loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete entry");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const createTotal =
    formData.hours && formData.price_per_hour
      ? (parseFloat(formData.hours) * parseFloat(formData.price_per_hour)).toFixed(2)
      : "0.00";

  const editTotal =
    editFormData.hours && editFormData.price_per_hour
      ? (
          parseFloat(editFormData.hours) * parseFloat(editFormData.price_per_hour)
        ).toFixed(2)
      : "0.00";

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalAmount = entries.reduce(
    (sum, e) => sum + e.hours * e.price_per_hour,
    0,
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Time Entries</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Add Time Entry</h2>
              <form onSubmit={handleCreateSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Client *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => handleCreateClientChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Project *</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => handleCreateProjectChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={!formData.client_id}
                  >
                    <option value="">Select a project</option>
                    {entryProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Task</label>
                  <select
                    value={formData.task_id}
                    onChange={(e) =>
                      setFormData({ ...formData, task_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled={!formData.project_id}
                  >
                    <option value="">Select a task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hours *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData({ ...formData, hours: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rate per Hour *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_per_hour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_per_hour: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Total</label>
                    <input
                      type="text"
                      value={`$${createTotal}`}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_billable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_billable: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Billable</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600"
                >
                  Add Time Entry
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Client</label>
                  <select
                    value={filters.clientId}
                    onChange={async (e) => {
                      const clientId = e.target.value;
                      setFilters({ ...filters, clientId, projectId: "" });
                      if (clientId) {
                        const res = await projectsAPI.getAll(clientId);
                        setFilterProjects(res.data);
                      } else {
                        setFilterProjects([]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project</label>
                  <select
                    value={filters.projectId}
                    onChange={(e) =>
                      setFilters({ ...filters, projectId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!filters.clientId}
                  >
                    <option value="">All</option>
                    {filterProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadEntries}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Apply Filters
                </button>
                <button
                  onClick={async () => {
                    setFilters({
                      startDate: "",
                      endDate: "",
                      clientId: "",
                      projectId: "",
                    });
                    setFilterProjects([]);
                    await loadEntries();
                  }}
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
              No time entries. Start tracking!
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Task</th>
                      <th className="px-4 py-3 text-left">Billable</th>
                      <th className="px-4 py-3 text-right">Hours</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{entry.date}</td>
                        <td className="px-4 py-3">
                          {clientNames[entry.client_id] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {projectNames[entry.project_id] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {entry.task_id ? taskNames[entry.task_id] || "-" : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {entry.is_billable ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {entry.hours.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${entry.price_per_hour.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ${(entry.hours * entry.price_per_hour).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(entry)}
                            className="text-blue-500 hover:underline mr-4 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-end gap-8">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold">{totalHours.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Time Entry</h2>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Client *</label>
                <select
                  value={editFormData.client_id}
                  onChange={(e) => handleEditClientChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Project *</label>
                <select
                  value={editFormData.project_id}
                  onChange={(e) => handleEditProjectChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                  disabled={!editFormData.client_id}
                >
                  <option value="">Select a project</option>
                  {editProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Task</label>
                <select
                  value={editFormData.task_id}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, task_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!editFormData.project_id}
                >
                  <option value="">Select a task</option>
                  {editTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.hours}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, hours: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Rate per Hour *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price_per_hour}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price_per_hour: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total</label>
                  <input
                    type="text"
                    value={`$${editTotal}`}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.is_billable}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_billable: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Billable</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
