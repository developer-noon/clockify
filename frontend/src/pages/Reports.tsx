import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";
import { clientsAPI, projectsAPI, reportsAPI } from "../services/api";
import { Client, Project, ReportSummary, TimeEntry } from "../types/index";

type DetailedReportRow = TimeEntry & {
  client_name: string;
  project_name: string;
  task_name: string | null;
};

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [detailed, setDetailed] = useState<DetailedReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    clientId: "",
    projectId: "",
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareToken, setShareToken] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadClients();
  }, [user, navigate]);

  useEffect(() => {
    if (filters.startDate || filters.endDate || filters.clientId || filters.projectId) {
      loadReport();
    } else {
      setSummary(null);
      setDetailed([]);
    }
  }, [filters]);

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll();
      setClients(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load clients");
    }
  };

  const loadProjectsForClient = async (clientId: string) => {
    if (!clientId) {
      setProjects([]);
      return;
    }

    try {
      const res = await projectsAPI.getAll(clientId);
      setProjects(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load projects");
    }
  };

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, detailedRes] = await Promise.all([
        reportsAPI.getSummary(filters),
        reportsAPI.getDetailed(filters),
      ]);
      setSummary(summaryRes.data);
      setDetailed(detailedRes.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await reportsAPI.getPDF(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const nameParts = ["report", filters.startDate || "all", filters.endDate || "all"];
      link.setAttribute("download", `${nameParts.join("-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to export PDF");
    }
  };

  const handleShare = async () => {
    try {
      if (!filters.clientId) {
        setError("Please select a client to share");
        return;
      }
      const res = await reportsAPI.createShareLink({
        client_id: filters.clientId,
        start_date: filters.startDate,
        end_date: filters.endDate,
      });
      setShareUrl(res.data.share_url);
      setShareToken(res.data.share_token);
      setShowShareModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create share link");
    }
  };

  const handleRevokeShare = async () => {
    try {
      if (!shareToken) return;
      await reportsAPI.revokeShareLink(shareToken);
      setShowShareModal(false);
      setShareUrl("");
      setShareToken("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to revoke share link");
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Reports</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    await loadProjectsForClient(clientId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Clients</option>
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
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadReport}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Load Report
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Export PDF
              </button>
              <button
                onClick={handleShare}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Share with Client
              </button>
            </div>
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-600 text-sm">Total Hours</p>
                      <p className="text-3xl font-bold">
                        {summary.total_hours.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Amount</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${summary.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">By Client</h3>
                  <div className="space-y-2">
                    {summary.by_client.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">By Project</h3>
                  <div className="space-y-2">
                    {summary.by_project.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detailed Entries</h3>
                  <span className="text-sm text-gray-500">{detailed.length} rows</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Client</th>
                        <th className="px-4 py-3 text-left">Project</th>
                        <th className="px-4 py-3 text-left">Task</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-right">Hours</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailed.map((entry) => (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{entry.date}</td>
                          <td className="px-4 py-3">{entry.client_name}</td>
                          <td className="px-4 py-3">{entry.project_name}</td>
                          <td className="px-4 py-3">{entry.task_name || "-"}</td>
                          <td className="px-4 py-3">{entry.description || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            {entry.hours.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${entry.price_per_hour.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            ${(entry.hours * entry.price_per_hour).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
              Select filters and load a report to view results
            </div>
          )}

          {showShareModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Share Link</h3>
                <div className="bg-gray-100 p-4 rounded mb-4 break-all">
                  <p className="text-sm text-gray-600">{shareUrl}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Link copied!");
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-2"
                >
                  Copy Link
                </button>
                <button
                  onClick={handleRevokeShare}
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mb-2"
                >
                  Revoke Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
