import React from "react";

const managers = [
  { id: 1, name: "Alice Johnson", role: "Manager" },
  { id: 2, name: "Bob Smith", role: "Manager" },
];

const employees = [
  { id: 3, name: "Charlie Brown", role: "Employee" },
  { id: 4, name: "Daisy Miller", role: "Employee" },
  { id: 5, name: "Ethan Lee", role: "Employee" },
  { id: 6, name: "Fiona Clark", role: "Employee" },
  { id: 7, name: "George Harris", role: "Employee" },
  { id: 8, name: "Hannah Wilson", role: "Employee" },
  { id: 9, name: "Ian Martinez", role: "Employee" },
  { id: 10, name: "Julia Kim", role: "Employee" },
  { id: 11, name: "Kevin Turner", role: "Employee" },
  { id: 12, name: "Laura Scott", role: "Employee" },
  { id: 13, name: "Michael Evans", role: "Employee" },
  { id: 14, name: "Nina Patel", role: "Employee" },
  { id: 15, name: "Oscar Reed", role: "Employee" },
  { id: 16, name: "Priya Singh", role: "Employee" },
  { id: 17, name: "Quentin Wright", role: "Employee" },
  { id: 18, name: "Rachel Adams", role: "Employee" },
  { id: 19, name: "Samir Gupta", role: "Employee" },
  { id: 20, name: "Tina Baker", role: "Employee" },
  { id: 21, name: "Uma Shah", role: "Employee" },
  { id: 22, name: "Victor Lin", role: "Employee" },
];

const projects = [
  { id: 1, name: "Website Redesign", status: "In Progress" },
  { id: 2, name: "Mobile App Launch", status: "Completed" },
  { id: 3, name: "Marketing Campaign", status: "Pending" },
];

const AdminPage = () => {
  return (
    <div className="flex h-[90vh] bg-gray-900 p-8 gap-8 border border-transparent mt-12  scrollbar-hidden">
      {/* Left Section: Managers & Employees */}
      <div className="min-w-[20rem] bg-gray-800 rounded-lg shadow-lg p-6 max-h-[85vh]  flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">Managers</h2>
        <ul className="mb-6">
          {managers.map((manager) => (
            <li key={manager.id} className="text-green-500 py-1 pl-2">
              {manager.name}
            </li>
          ))}
        </ul>
        <hr className="text-gray-500" />
        <h2 className="text-xl font-bold text-white mb-4 pt-8">Employees</h2>
        <div className="overflow-y-auto flex-1 pr-2">
          <ul>
            {employees.map((employee) => (
              <li key={employee.id} className="text-blue-500 py-1 pl-2">
                {employee.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Right Section: Projects */}
      <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">All Projects</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="text-gray-300 pb-2">Project Name</th>
              <th className="text-gray-300 pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-gray-700">
                <td className="py-2 text-white">{project.name}</td>
                <td className="py-2">
                  <span
                    className={
                      project.status === "Completed"
                        ? "text-green-400"
                        : project.status === "In Progress"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;
