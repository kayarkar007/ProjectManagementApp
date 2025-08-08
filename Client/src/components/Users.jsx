import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
const api = import.meta.env.VITE_API_BASE_URL;
const Users = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [token, user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${api}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`${api}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePromoteUser = async (userId) => {
    if (
      !window.confirm("Are you sure you want to promote this user to manager?")
    ) {
      return;
    }

    try {
      const response = await fetch(`${api}/api/users/${userId}/promote`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to promote user");
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to demote this manager to employee?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${api}/api/users/${userId}/demote`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to demote user");
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "manager":
        return "bg-blue-500";
      case "employee":
        return "bg-green-500";
      case "client":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={userItem.avatar || "./download (1).jpg"}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {userItem.firstName && userItem.lastName
                              ? `${userItem.firstName} ${userItem.lastName}`
                              : userItem.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                          userItem.role
                        )} text-white`}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {userItem.department || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userItem.isActive
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {userItem.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {userItem.role === "employee" && (
                          <button
                            onClick={() => handlePromoteUser(userItem._id)}
                            className="text-blue-400 hover:text-blue-300 bg-blue-900 hover:bg-blue-800 px-3 py-1 rounded text-xs transition-colors"
                          >
                            Promote to Manager
                          </button>
                        )}
                        {userItem.role === "manager" && (
                          <button
                            onClick={() => handleDemoteUser(userItem._id)}
                            className="text-yellow-400 hover:text-yellow-300 bg-yellow-900 hover:bg-yellow-800 px-3 py-1 rounded text-xs transition-colors"
                          >
                            Demote to Employee
                          </button>
                        )}
                        {userItem._id !== user._id && (
                          <button
                            onClick={() => handleDeleteUser(userItem._id)}
                            className="text-red-400 hover:text-red-300 bg-red-900 hover:bg-red-800 px-3 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
