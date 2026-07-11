import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";
import { clientsAPI } from "../services/api";
import { Client } from "../types/index";

export default function Clients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadClients();
  }, [user, navigate]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const res = await clientsAPI.getAll();
      setClients(res.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await clientsAPI.update(editingId, formData);
      } else {
        await clientsAPI.create(formData);
      }
      setFormData({ name: "", email: "" });
      setShowForm(false);
      setEditingId(null);
      loadClients();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save client");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await clientsAPI.delete(id);
        loadClients();
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to delete client");
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({ name: client.name, email: client.email || "" });
    setShowForm(true);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Clients</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) setEditingId(null);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showForm ? "Cancel" : "Add Client"}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingId ? "Update" : "Create"} Client
                </button>
              </form>
            </div>
          )}

          {isLoading ? (
            <div>Loading...</div>
          ) : clients.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
              No clients yet. Create one to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{client.name}</td>
                      <td className="px-6 py-3">{client.email || "-"}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-500 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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
        </div>
      </div>
    </div>
  );
}
