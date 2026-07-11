import { useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../hooks/useNavigate";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.name}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
              <p className="text-gray-600">
                Start by adding a client, then create projects and tasks to
                track your time.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate("/clients")}
                    className="text-blue-500 hover:underline"
                  >
                    Manage Clients
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/timer")}
                    className="text-blue-500 hover:underline"
                  >
                    Track Time
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/reports")}
                    className="text-blue-500 hover:underline"
                  >
                    View Reports
                  </button>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">Features</h2>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Timer & manual entry</li>
                <li>✓ Detailed reports</li>
                <li>✓ PDF export</li>
                <li>✓ Share with clients</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
