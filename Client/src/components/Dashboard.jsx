import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
const api = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalUsers: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setError("");
      setLoading(true);

      const [
        projectsResponse,
        tasksResponse,
        recentProjectsResponse,
        recentTasksResponse,
      ] = await Promise.all([
        fetch(`${api}/api/projects/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${api}/api/tasks/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${api}/api/projects?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${api}/api/tasks?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!projectsResponse.ok)
        throw new Error("Failed to fetch project stats");
      if (!tasksResponse.ok) throw new Error("Failed to fetch task stats");
      if (!recentProjectsResponse.ok)
        throw new Error("Failed to fetch recent projects");
      if (!recentTasksResponse.ok)
        throw new Error("Failed to fetch recent tasks");

      const projectsStats = await projectsResponse.json();
      const tasksStats = await tasksResponse.json();
      const recentProjectsData = await recentProjectsResponse.json();
      const recentTasksData = await recentTasksResponse.json();

      setStats({
        totalProjects: projectsStats.totalProjects || 0,
        totalTasks: tasksStats.totalTasks || 0,
        completedTasks: tasksStats.completedTasks || 0,
        inProgressTasks: tasksStats.inProgressTasks || 0,
        totalUsers: projectsStats.totalUsers || 0,
      });

      setRecentProjects(recentProjectsData.projects || []);
      setRecentTasks(recentTasksData.tasks || []);
    } catch (err) {
      setError(
        err.message || "An error occurred while loading dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500 text-white";
      case "In Progress":
        return "bg-yellow-500 text-white";
      case "Review":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500 text-white";
      case "In Progress":
        return "bg-yellow-500 text-white";
      case "Planning":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-20">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Total Projects
                </p>
                <p className="text-2xl font-semibold text-white">
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.inProgressTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-20">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Team Members
                </p>
                <p className="text-2xl font-semibold text-white">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recent Projects</h2>
              <a
                href="/projects"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All
              </a>
            </div>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">
                        {project.description
                          ? `${project.description.substring(0, 50)}${
                              project.description.length > 50 ? "..." : ""
                            }`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                      <div className="mt-2 w-20 bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            project.status === "Completed"
                              ? "bg-green-500"
                              : project.progress >= 75
                              ? "bg-green-400"
                              : project.progress >= 50
                              ? "bg-yellow-500"
                              : project.progress >= 25
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${
                              project.status === "Completed"
                                ? 100
                                : project.progress || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 mt-1">
                        {project.status === "Completed"
                          ? 100
                          : project.progress || 0}
                        %
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No projects found
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
              <a
                href="/tasks"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All
              </a>
            </div>
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <p className="text-sm text-gray-400">
                        {task.project?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                      <div className="mt-2 w-20 bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            task.status === "Completed"
                              ? "bg-green-500"
                              : task.progress >= 75
                              ? "bg-green-400"
                              : task.progress >= 50
                              ? "bg-yellow-500"
                              : task.progress >= 25
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${
                              task.status === "Completed"
                                ? 100
                                : task.progress || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 mt-1">
                        {task.status === "Completed" ? 100 : task.progress || 0}
                        %
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No tasks found</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/projects"
              className="flex items-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-white mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="text-white font-medium">Create Project</span>
            </a>
            <a
              href="/tasks"
              className="flex items-center p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-white mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="text-white font-medium">Create Task</span>
            </a>
            <a
              href="/users"
              className="flex items-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-white mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span className="text-white font-medium">Manage Users</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
