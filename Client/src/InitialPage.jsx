import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Project Management",
    description:
      "Create, edit, and manage projects with deadlines, priorities, budgets, and tags. Track project progress and status in real-time.",
    icon: "📁",
  },
  {
    title: "Task Tracking",
    description:
      "Assign tasks to team members, set due dates, priorities, and monitor completion. Visualize task status and progress easily.",
    icon: "✅",
  },
  {
    title: "User Roles & Permissions",
    description:
      "Role-based access for Admins, Managers, and Employees. Promote, demote, or remove users and manage permissions securely.",
    icon: "🛡️",
  },
  {
    title: "Dashboard & Analytics",
    description:
      "Get a bird's-eye view of your organization with project, task, and user statistics. Recent activity and progress at a glance.",
    icon: "📊",
  },
  {
    title: "Collaboration",
    description:
      "Team members can collaborate on projects and tasks, ensuring everyone stays on the same page.",
    icon: "🤝",
  },
  {
    title: "Secure Authentication",
    description:
      "Modern authentication system to keep your data safe and accessible only to authorized users.",
    icon: "🔒",
  },
];

const Navbar = () => (
  <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow">
    <div className="flex items-center space-x-2">
      <span className="text-2xl font-bold text-blue-400">
        ProjectFlow Management System
      </span>
    </div>
    <div className="space-x-6">
      <a href="#features" className="hover:text-blue-400 transition">
        Features
      </a>
      <a href="#about" className="hover:text-blue-400 transition">
        About
      </a>
      <Link
        to="/login"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
      >
        Login
      </Link>
    </div>
  </nav>
);

const InitialPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <Navbar />
      <header className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-400">
          Welcome to ProjectFlow Management System
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
          The all-in-one project management solution for teams of any size.
          Organize, track, and deliver your projects efficiently with powerful
          features and a user-friendly interface.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition"
        >
          Get Started
        </Link>
      </header>

      <section id="features" className="py-12 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-300">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-blue-200">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">
            About ProjectFlow Management System
          </h2>
          <p className="text-gray-300 mb-4">
            ProjectFlow Management System is designed to streamline your
            workflow, boost productivity, and foster collaboration. Whether
            you're a startup, a growing business, or a large enterprise, our
            platform adapts to your needs.
          </p>
          <p className="text-gray-400">
            Ready to take your project management to the next level?{" "}
            <Link to="/login" className="text-blue-400 underline">
              Sign in
            </Link>{" "}
            and get started today!
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-500 text-center py-6 mt-8 border-t border-gray-800">
        &copy; {new Date().getFullYear()} ProjectFlow Management System. All
        rights reserved.
      </footer>
    </div>
  );
};

export default InitialPage;
