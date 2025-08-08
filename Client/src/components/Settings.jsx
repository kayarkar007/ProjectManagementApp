import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/useAuth";

const api = import.meta.env.VITE_API_BASE_URL;

const Settings = () => {
  const { user, token, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.username || "",
    department: user?.department || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: true,
    language: "en",
    timezone: "UTC",
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(profileData);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${api}/api/users/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update preferences");
      }

      setSuccess("Preferences updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Profile Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) =>
                  setProfileData({ ...profileData, username: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Department</label>
              <select
                value={profileData.department}
                onChange={(e) =>
                  setProfileData({ ...profileData, department: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              rows="3"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Two-Factor Authentication</h4>
              <p className="text-gray-400 text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
              Enable 2FA
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Login Sessions</h4>
              <p className="text-gray-400 text-sm">
                Manage your active login sessions
              </p>
            </div>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors">
              View Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Application Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Dark Mode</h4>
              <p className="text-gray-400 text-sm">
                Use dark theme for the application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={(e) =>
                  setPreferences({ ...preferences, darkMode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ ...preferences, timezone: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="CST">Central Time</option>
              <option value="MST">Mountain Time</option>
              <option value="PST">Pacific Time</option>
            </select>
          </div>
          <button
            onClick={handlePreferencesUpdate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Email Notifications</h4>
              <p className="text-gray-400 text-sm">
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    emailNotifications: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Push Notifications</h4>
              <p className="text-gray-400 text-sm">
                Receive push notifications in browser
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    pushNotifications: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Notification Types</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="task-assignments"
              className="rounded border-gray-600 bg-gray-600 text-blue-500 focus:ring-blue-500"
              defaultChecked
            />
            <label htmlFor="task-assignments" className="ml-2 text-white">
              Task assignments and updates
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="project-updates"
              className="rounded border-gray-600 bg-gray-600 text-blue-500 focus:ring-blue-500"
              defaultChecked
            />
            <label htmlFor="project-updates" className="ml-2 text-white">
              Project status changes
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="deadline-reminders"
              className="rounded border-gray-600 bg-gray-600 text-blue-500 focus:ring-blue-500"
              defaultChecked
            />
            <label htmlFor="deadline-reminders" className="ml-2 text-white">
              Deadline reminders
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="team-mentions"
              className="rounded border-gray-600 bg-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="team-mentions" className="ml-2 text-white">
              Team mentions and comments
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "security":
        return renderSecurityTab();
      case "preferences":
        return renderPreferencesTab();
      case "notifications":
        return renderNotificationsTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
