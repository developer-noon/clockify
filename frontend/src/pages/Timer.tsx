import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";
import {
  clientsAPI,
  projectsAPI,
  timeEntriesAPI,
} from "../services/api";
import { Client, Project, Task } from "../types/index";
import { format } from "date-fns";

export default function Timer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerStartRef = useRef<number | null>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    task_id: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    price_per_hour: "",
    is_billable: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      if (timerStartRef.current !== null) {
        setElapsedSeconds(
          Math.floor((Date.now() - timerStartRef.current) / 1000),
        );
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (isTimerRunning) {
      setFormData((current) => ({
        ...current,
        hours: (elapsedSeconds / 3600).toFixed(2),
      }));
    }
  }, [elapsedSeconds, isTimerRunning]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const clientsRes = await clientsAPI.getAll();
      setClients(clientsRes.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    if (isTimerRunning) {
      setError("Stop the timer before changing the client.");
      return;
    }

    setFormData({
      ...formData,
      client_id: clientId,
      project_id: "",
      task_id: "",
    });
    try {
      const res = await projectsAPI.getAll(clientId);
      setProjects(res.data);
      setTasks([]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load projects");
    }
  };

  const handleProjectChange = async (projectId: string) => {
    if (isTimerRunning) {
      setError("Stop the timer before changing the project.");
      return;
    }

    setFormData({ ...formData, project_id: projectId, task_id: "" });
    try {
      const res = await projectsAPI.getTasks(projectId);
      setTasks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load tasks");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isTimerRunning) {
        setError("Stop the timer before saving the entry.");
        return;
      }

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

      setFormData({
        client_id: "",
        project_id: "",
        task_id: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        hours: "",
        price_per_hour: "",
        is_billable: true,
      });
      setProjects([]);
      setTasks([]);
      setSuccess("Time entry created!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create time entry");
    }
  };

  const startTimer = () => {
    if (!formData.client_id || !formData.project_id) {
      setError("Select a client and project before starting the timer.");
      return;
    }

    timerStartRef.current =
      Date.now() - Math.round(elapsedSeconds * 1000);
    setIsTimerRunning(true);
    setError("");
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setFormData((current) => ({
      ...current,
      hours: (elapsedSeconds / 3600).toFixed(2),
    }));
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    timerStartRef.current = null;
    setElapsedSeconds(0);
    setFormData((current) => ({
      ...current,
      hours: "",
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const total =
    formData.hours && formData.price_per_hour
      ? (
          parseFloat(formData.hours) * parseFloat(formData.price_per_hour)
        ).toFixed(2)
      : "0.00";
  const timerHours = (elapsedSeconds / 3600).toFixed(2);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Add Time Entry</h1>

          <div className="max-w-2xl bg-gray-900 text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300">Timer</p>
                <p className="text-4xl font-bold tabular-nums">{timerHours}h</p>
                <p className="text-sm text-gray-400 mt-1">
                  {isTimerRunning ? "Running" : "Stopped"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startTimer}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600"
                >
                  {isTimerRunning ? "Resume" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={stopTimer}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600"
                  disabled={!isTimerRunning}
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

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

          <div className="max-w-2xl bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                  disabled={isTimerRunning}
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
                <label className="block text-sm font-medium mb-2">
                  Project *
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                  disabled={!formData.client_id || isTimerRunning}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
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
                  disabled={!formData.project_id || isTimerRunning}
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
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  disabled={isTimerRunning}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isTimerRunning}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hours *
                  </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData({ ...formData, hours: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      readOnly={isTimerRunning}
                    />
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rate per Hour *
                  </label>
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
                      disabled={isTimerRunning}
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total
                  </label>
                  <input
                    type="text"
                    value={`$${total}`}
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
                    disabled={isTimerRunning}
                  />
                  <span className="text-sm font-medium">Billable</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600"
                disabled={isTimerRunning}
              >
                Add Time Entry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
