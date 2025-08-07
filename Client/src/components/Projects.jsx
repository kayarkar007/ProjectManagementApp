import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const Projects = () => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    startDate: "",
    endDate: "",
    budget: "",
    tags: "",
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchProjects();
    // eslint-disable-next-line
  }, [token]);

  const fetchProjects = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      await fetchProjects();
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        status: "Planning",
        priority: "Medium",
        startDate: "",
        endDate: "",
        budget: "",
        tags: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await fetch(
        `http://localhost:5000/api/projects/${editingProject._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            budget: parseFloat(formData.budget) || 0,
            tags: formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      await fetchProjects();
      setShowEditModal(false);
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        status: "Planning",
        priority: "Medium",
        startDate: "",
        endDate: "",
        budget: "",
        tags: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      setError("");
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }

      await fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "Planning",
      priority: project.priority || "Medium",
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().split("T")[0]
        : "",
      budget: project.budget?.toString() || "",
      tags: project.tags ? project.tags.join(", ") : "",
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-yellow-500";
      case "On Hold":
        return "bg-orange-500";
      case "Cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">
              Manage your projects and track their progress
            </p>
          </div>
          {(user?.role === "admin" || user?.role === "manager") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Create Project
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-gray-800 rounded-lg p-6 shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{project.name}</h3>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      project.priority
                    )}`}
                  >
                    {project.priority}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Start Date:</span>
                  <span className="text-white">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">End Date:</span>
                  <span className="text-white">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Budget:</span>
                  <span className="text-white">
                    ${project.budget?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white">
                      {project.status === "Completed"
                        ? 100
                        : project.progress || 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
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
                </div>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Manager: {project.manager?.firstName}{" "}
                  {project.manager?.lastName}
                </div>
                <div className="flex gap-2">
                  {(user?.role === "admin" ||
                    project.manager?._id === user?._id) && (
                    <>
                      <button
                        onClick={() => openEditModal(project)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No projects found</p>
            {(user?.role === "admin" || user?.role === "manager") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Create Your First Project
              </button>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">
                Create New Project
              </h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">
                Edit Project
              </h2>
              <form onSubmit={handleEditProject} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Update Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProject(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </div>
    </div>
  );
};

export default Projects;