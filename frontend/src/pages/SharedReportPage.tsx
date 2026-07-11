import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { reportsAPI } from "../services/api";
import { SharedReport as SharedReportType } from "../types/index";

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<SharedReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      loadReport();
    }
  }, [token]);

  const loadReport = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await reportsAPI.getSharedReport(token);
      setReport(res.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Report not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Time Tracking Report</h1>
          <p className="text-gray-600 mb-6">Client: {report.client_name}</p>
          {(report.start_date || report.end_date) && (
            <p className="text-gray-500 mb-6 text-sm">
              Range: {report.start_date || "All time"} to {report.end_date || "All time"}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Total Hours</p>
                  <p className="text-3xl font-bold">
                    {report.total_hours.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${report.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">By Project</h2>
              <div className="space-y-2">
                {report.by_project.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="font-semibold">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Detailed Entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Task</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{entry.date}</td>
                    <td className="px-4 py-3">{entry.project}</td>
                    <td className="px-4 py-3">{entry.task || "-"}</td>
                    <td className="px-4 py-3">{entry.description || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.hours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      ${entry.rate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${entry.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
