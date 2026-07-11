import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";
import { clientsAPI, projectsAPI, tasksAPI } from "../services/api";
import { Project, Task } from "../types/index";

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: "", client_id: "" });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
    } else {
      setProjectTasks([]);
    }
  }, [selectedProjectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clientsRes, projectsRes] = await Promise.all([
        clientsAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
      setSelectedProjectId((current) => current || projectsRes.data[0]?.id || "");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async (projectId: string) => {
    try {
      const res = await projectsAPI.getTasks(projectId);
      setProjectTasks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load tasks");
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProjectId) {
        await projectsAPI.update(editingProjectId, { name: projectFormData.name });
      } else {
        await projectsAPI.create(projectFormData);
      }
      setProjectFormData({ name: "", client_id: "" });
      setShowProjectForm(false);
      setEditingProjectId(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await projectsAPI.delete(id);
        if (selectedProjectId === id) {
          setSelectedProjectId("");
          setProjectTasks([]);
        }
        loadData();
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to delete project");
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectFormData({ name: project.name, client_id: project.client_id });
    setShowProjectForm(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Select a project first");
      return;
    }

    try {
      await tasksAPI.create(selectedProjectId, { name: taskName });
      setTaskName("");
      loadTasks(selectedProjectId);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await tasksAPI.delete(taskId);
      if (selectedProjectId) {
        loadTasks(selectedProjectId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete task");
    }
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || "Unknown";
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Projects</h1>
            <button
              onClick={() => {
                setShowProjectForm(!showProjectForm);
                if (showProjectForm) setEditingProjectId(null);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showProjectForm ? "Cancel" : "Add Project"}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}

          {showProjectForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <form onSubmit={handleProjectSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client</label>
                    <select
                      value={projectFormData.client_id}
                      onChange={(e) =>
                        setProjectFormData({
                          ...projectFormData,
                          client_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={projectFormData.name}
                      onChange={(e) =>
                        setProjectFormData({
                          ...projectFormData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingProjectId ? "Update" : "Create"} Project
                </button>
              </form>
            </div>
          )}

          {isLoading ? (
            <div>Loading...</div>
          ) : projects.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600 mb-6">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Client</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{project.name}</td>
                      <td className="px-6 py-3">{getClientName(project.client_id)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="text-blue-500 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Task Management</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCreateTask} className="mb-6">
                <label className="block text-sm font-medium mb-2">New Task</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Task name"
                    disabled={!selectedProjectId}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={!selectedProjectId}
                  >
                    Add
                  </button>
                </div>
              </form>

              {selectedProjectId ? (
                projectTasks.length === 0 ? (
                  <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-600">
                    No tasks yet for this project.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3"
                      >
                        <span>{task.name}</span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-600">
                  Select a project to manage its tasks.
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">What this covers</h2>
              <ul className="space-y-2 text-gray-700">
                <li>Project CRUD</li>
                <li>Task create and delete</li>
                <li>Task selection in time entries</li>
                <li>Per-project task organization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
