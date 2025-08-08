import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/useAuth";

const api = import.meta.env.VITE_API_BASE_URL;

const Reports = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    reportType: "project_summary",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
    format: "json"
  });

  const reportTypes = [
    {
      value: "project_summary",
      label: "Project Summary",
      description: "Overview of all projects with status, progress, and budget information"
    },
    {
      value: "team_performance",
      label: "Team Performance",
      description: "Team productivity, task completion rates, and performance metrics"
    },
    {
      value: "financial_summary",
      label: "Financial Summary",
      description: "Budget vs actual costs, financial variance, and cost analysis"
    }
  ];

  const fetchReport = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: filters.format
      });

      const response = await fetch(`${api}/api/analytics/reports?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      setReportData(data);
      setSelectedReport(filters.reportType);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  const downloadReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: "csv"
      });

      const response = await fetch(`${api}/api/analytics/reports?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filters.reportType}_${filters.startDate}_${filters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProjectSummary = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400">Total Projects</h3>
            <p className="text-3xl font-bold text-white">{reportData.totalProjects}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400">Completed</h3>
            <p className="text-3xl font-bold text-white">{reportData.completedProjects}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400">Active</h3>
            <p className="text-3xl font-bold text-white">{reportData.activeProjects}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-400">Total Budget</h3>
            <p className="text-3xl font-bold text-white">${reportData.totalBudget?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Project Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Project Name</th>
                  <th className="px-4 py-2 text-gray-300">Status</th>
                  <th className="px-4 py-2 text-gray-300">Progress</th>
                  <th className="px-4 py-2 text-gray-300">Budget</th>
                  <th className="px-4 py-2 text-gray-300">Actual Cost</th>
                  <th className="px-4 py-2 text-gray-300">Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {reportData.projects?.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-700">
                    <td className="px-4 py-2 text-white">{project.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === "Completed" ? "bg-green-500 text-white" :
                        project.status === "In Progress" ? "bg-yellow-500 text-white" :
                        "bg-gray-500 text-white"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-white">{project.progress || 0}%</td>
                    <td className="px-4 py-2 text-white">${project.budget?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-white">${project.actualCost?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-white">
                      {project.manager?.firstName && project.manager?.lastName 
                        ? `${project.manager.firstName} ${project.manager.lastName}`
                        : project.manager?.username || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamPerformance = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400">Total Team Members</h3>
            <p className="text-3xl font-bold text-white">{reportData.totalMembers || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400">Average Productivity</h3>
            <p className="text-3xl font-bold text-white">{reportData.averageProductivity || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400">Tasks Completed</h3>
            <p className="text-3xl font-bold text-white">{reportData.completedTasks || 0}</p>
          </div>
        </div>

        {reportData.teamMembers && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Team Member Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-gray-300">Member</th>
                    <th className="px-4 py-2 text-gray-300">Tasks Assigned</th>
                    <th className="px-4 py-2 text-gray-300">Tasks Completed</th>
                    <th className="px-4 py-2 text-gray-300">Completion Rate</th>
                    <th className="px-4 py-2 text-gray-300">Average Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-700">
                      <td className="px-4 py-2 text-white">
                        {member.firstName && member.lastName 
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </td>
                      <td className="px-4 py-2 text-white">{member.tasksAssigned || 0}</td>
                      <td className="px-4 py-2 text-white">{member.tasksCompleted || 0}</td>
                      <td className="px-4 py-2 text-white">
                        {member.completionRate ? `${member.completionRate}%` : "N/A"}
                      </td>
                      <td className="px-4 py-2 text-white">
                        {member.averageTime ? `${member.averageTime} days` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinancialSummary = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400">Total Budget</h3>
            <p className="text-3xl font-bold text-white">${reportData.totalBudget?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400">Actual Cost</h3>
            <p className="text-3xl font-bold text-white">${reportData.totalActualCost?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400">Variance</h3>
            <p className={`text-3xl font-bold ${reportData.totalVariance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {reportData.totalVariance ? `${reportData.totalVariance.toFixed(1)}%` : "0%"}
            </p>
          </div>
        </div>

        {reportData.projects && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Project Financial Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-gray-300">Project Name</th>
                    <th className="px-4 py-2 text-gray-300">Budget</th>
                    <th className="px-4 py-2 text-gray-300">Actual Cost</th>
                    <th className="px-4 py-2 text-gray-300">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.projects.map((project, index) => (
                    <tr key={index} className="hover:bg-gray-700">
                      <td className="px-4 py-2 text-white">{project.name}</td>
                      <td className="px-4 py-2 text-white">${project.budget?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2 text-white">${project.actualCost?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2 text-white">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.variance >= 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {project.variance ? `${project.variance.toFixed(1)}%` : "0%"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case "project_summary":
        return renderProjectSummary();
      case "team_performance":
        return renderTeamPerformance();
      case "financial_summary":
        return renderFinancialSummary();
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Select a report type and generate to view data</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Report Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Generate Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Report Type</label>
              <select
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Format</label>
              <select
                value={filters.format}
                onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
            <button
              onClick={downloadReport}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Downloading..." : "Download CSV"}
            </button>
          </div>
        </div>

        {/* Report Content */}
        {reportData && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {reportTypes.find(t => t.value === selectedReport)?.label} Report
              </h2>
              <p className="text-gray-400">
                {filters.startDate} to {filters.endDate}
              </p>
            </div>
            {renderReportContent()}
          </div>
        )}

        {/* Report Types Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {reportTypes.map((type) => (
            <div key={type.value} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">{type.label}</h3>
              <p className="text-gray-300">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
