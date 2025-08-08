const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const moment = require("moment");

// AI-Powered Project Completion Prediction
const predictProjectCompletion = (project, tasks) => {
  const completedTasks = tasks.filter((task) => task.status === "Completed");
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress");
  const remainingTasks = tasks.filter(
    (task) => !["Completed", "Cancelled"].includes(task.status)
  );

  if (remainingTasks.length === 0) return project.endDate;

  // Calculate average task completion time
  const completedTaskDurations = completedTasks
    .map((task) => {
      if (task.startDate && task.completedDate) {
        return moment(task.completedDate).diff(moment(task.startDate), "days");
      }
      return 0;
    })
    .filter((duration) => duration > 0);

  const avgTaskDuration =
    completedTaskDurations.length > 0
      ? completedTaskDurations.reduce((a, b) => a + b, 0) /
        completedTaskDurations.length
      : 3; // Default 3 days if no completed tasks

  // Calculate team velocity (tasks completed per day)
  const projectStartDate = moment(project.startDate);
  const daysSinceStart = moment().diff(projectStartDate, "days");
  const velocity =
    daysSinceStart > 0 ? completedTasks.length / daysSinceStart : 0.5;

  // Predict completion date
  const estimatedDaysToComplete =
    remainingTasks.length / Math.max(velocity, 0.1);
  const predictedCompletion = moment().add(estimatedDaysToComplete, "days");

  return predictedCompletion.toDate();
};

// Risk Assessment Algorithm
const assessProjectRisk = (project, tasks) => {
  let riskScore = 0;
  const riskFactors = [];

  // Budget overrun risk
  if (project.budget > 0) {
    const budgetUtilization = (project.actualCost / project.budget) * 100;
    if (budgetUtilization > 80) {
      riskScore += 25;
      riskFactors.push(
        `Budget utilization at ${budgetUtilization.toFixed(1)}%`
      );
    }
  }

  // Schedule risk
  const daysUntilDeadline = moment(project.endDate).diff(moment(), "days");
  const progress = project.progress || 0;
  const expectedProgress = 100 - (daysUntilDeadline / project.duration) * 100;

  if (progress < expectedProgress - 10) {
    riskScore += 30;
    riskFactors.push(
      `Behind schedule: ${progress}% vs expected ${expectedProgress.toFixed(
        1
      )}%`
    );
  }

  // Team workload risk
  const teamMembers = project.team.length;
  const activeTasks = tasks.filter(
    (task) => !["Completed", "Cancelled"].includes(task.status)
  );
  const avgTasksPerMember =
    teamMembers > 0 ? activeTasks.length / teamMembers : 0;

  if (avgTasksPerMember > 5) {
    riskScore += 20;
    riskFactors.push(
      `High workload: ${avgTasksPerMember.toFixed(1)} tasks per team member`
    );
  }

  // Quality risk
  const tasksWithBugs = tasks.filter((task) => task.quality?.bugsFound > 0);
  const bugRate = tasks.length > 0 ? tasksWithBugs.length / tasks.length : 0;

  if (bugRate > 0.3) {
    riskScore += 15;
    riskFactors.push(
      `High bug rate: ${(bugRate * 100).toFixed(1)}% of tasks have bugs`
    );
  }

  // Dependencies risk
  const blockedTasks = tasks.filter((task) => task.dependencies.length > 0);
  if (blockedTasks.length > tasks.length * 0.4) {
    riskScore += 10;
    riskFactors.push(
      `High dependency risk: ${(
        (blockedTasks.length / tasks.length) *
        100
      ).toFixed(1)}% tasks have dependencies`
    );
  }

  return {
    score: Math.min(riskScore, 100),
    level:
      riskScore >= 70
        ? "Critical"
        : riskScore >= 50
        ? "High"
        : riskScore >= 30
        ? "Medium"
        : "Low",
    factors: riskFactors,
  };
};

// Resource Optimization Recommendations
const generateResourceRecommendations = (project, tasks) => {
  const recommendations = [];

  // Analyze team allocation
  const teamAllocation = {};
  project.team.forEach((member) => {
    const memberTasks = tasks.filter((task) =>
      task.assignedTo.some(
        (assignment) => assignment.user.toString() === member.user.toString()
      )
    );
    teamAllocation[member.user] = {
      tasks: memberTasks.length,
      hours: memberTasks.reduce(
        (sum, task) => sum + (task.actualHours || 0),
        0
      ),
      allocation: member.allocation,
    };
  });

  // Find over/under allocated team members
  const avgTasks =
    Object.values(teamAllocation).reduce((sum, data) => sum + data.tasks, 0) /
    Object.keys(teamAllocation).length;

  Object.entries(teamAllocation).forEach(([userId, data]) => {
    if (data.tasks > avgTasks * 1.5) {
      recommendations.push({
        type: "workload_reduction",
        priority: "high",
        message: `Consider reducing workload for team member (${
          data.tasks
        } tasks vs avg ${avgTasks.toFixed(1)})`,
        userId,
      });
    } else if (data.tasks < avgTasks * 0.5) {
      recommendations.push({
        type: "workload_increase",
        priority: "medium",
        message: `Consider increasing workload for team member (${
          data.tasks
        } tasks vs avg ${avgTasks.toFixed(1)})`,
        userId,
      });
    }
  });

  // Skill gap analysis
  const requiredSkills = project.resources?.requiredSkills || [];
  const teamSkills = new Set();
  project.team.forEach((member) => {
    // This would need to be populated from user skills
    // For now, we'll provide a generic recommendation
  });

  if (requiredSkills.length > 0) {
    recommendations.push({
      type: "skill_gap",
      priority: "medium",
      message: `Consider adding team members with skills: ${requiredSkills.join(
        ", "
      )}`,
    });
  }

  return recommendations;
};

// GET /api/analytics/dashboard
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get user's projects
    const userProjects = await Project.find({
      $or: [{ manager: userId }, { "team.user": userId }],
    }).populate("team.user", "username firstName lastName");

    const projectIds = userProjects.map((p) => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });

    // Calculate key metrics
    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter((p) =>
      ["Planning", "In Progress"].includes(p.status)
    ).length;
    const completedProjects = userProjects.filter(
      (p) => p.status === "Completed"
    ).length;
    const overdueProjects = userProjects.filter((p) => p.isOverdue).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const overdueTasks = tasks.filter((t) => t.isOverdue).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "In Progress"
    ).length;

    // Calculate productivity metrics
    const userTasks = tasks.filter((t) =>
      t.assignedTo.some((a) => a.user.toString() === userId.toString())
    );
    const userCompletedTasks = userTasks.filter(
      (t) => t.status === "Completed"
    ).length;
    const userProductivity =
      totalTasks > 0 ? (userCompletedTasks / totalTasks) * 100 : 0;

    // Calculate financial metrics
    const totalBudget = userProjects.reduce(
      (sum, p) => sum + (p.budget || 0),
      0
    );
    const totalActualCost = userProjects.reduce(
      (sum, p) => sum + (p.actualCost || 0),
      0
    );
    const budgetVariance =
      totalBudget > 0
        ? ((totalActualCost - totalBudget) / totalBudget) * 100
        : 0;

    // Generate AI insights for each project
    const projectInsights = await Promise.all(
      userProjects.map(async (project) => {
        const projectTasks = tasks.filter(
          (t) => t.project.toString() === project._id.toString()
        );
        const completionPrediction = predictProjectCompletion(
          project,
          projectTasks
        );
        const riskAssessment = assessProjectRisk(project, projectTasks);
        const resourceRecommendations = generateResourceRecommendations(
          project,
          projectTasks
        );

        return {
          projectId: project._id,
          projectName: project.name,
          completionPrediction,
          riskAssessment,
          resourceRecommendations: resourceRecommendations.slice(0, 3), // Top 3 recommendations
          progress: project.progress,
          status: project.status,
        };
      })
    );

    // Calculate trends
    const lastMonth = moment().subtract(30, "days");
    const recentTasks = tasks.filter((t) =>
      moment(t.createdAt).isAfter(lastMonth)
    );
    const recentCompletedTasks = recentTasks.filter(
      (t) => t.status === "Completed"
    ).length;
    const completionTrend =
      recentTasks.length > 0
        ? (recentCompletedTasks / recentTasks.length) * 100
        : 0;

    res.json({
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
      },
      productivity: {
        userProductivity: Math.round(userProductivity),
        completionTrend: Math.round(completionTrend),
        tasksCompletedThisMonth: recentCompletedTasks,
      },
      financial: {
        totalBudget,
        totalActualCost,
        budgetVariance: Math.round(budgetVariance * 100) / 100,
        currency: "USD",
      },
      insights: {
        highRiskProjects: projectInsights.filter(
          (p) =>
            p.riskAssessment.level === "Critical" ||
            p.riskAssessment.level === "High"
        ),
        upcomingDeadlines: userProjects
          .filter((p) => !["Completed", "Cancelled"].includes(p.status))
          .sort((a, b) => moment(a.endDate).diff(moment(b.endDate)))
          .slice(0, 5)
          .map((p) => ({
            id: p._id,
            name: p.name,
            endDate: p.endDate,
            progress: p.progress,
            daysRemaining: moment(p.endDate).diff(moment(), "days"),
          })),
        teamPerformance: projectInsights
          .filter((p) => p.resourceRecommendations.length > 0)
          .slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ error: "Failed to generate dashboard analytics" });
  }
};

// GET /api/analytics/project/:projectId
exports.getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate("team.user", "username firstName lastName")
      .populate("manager", "username firstName lastName");

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tasks = await Task.find({ project: projectId }).populate(
      "assignedTo.user",
      "username firstName lastName"
    );

    // Calculate detailed metrics
    const taskMetrics = {
      total: tasks.length,
      byStatus: {
        backlog: tasks.filter((t) => t.status === "Backlog").length,
        todo: tasks.filter((t) => t.status === "To Do").length,
        inProgress: tasks.filter((t) => t.status === "In Progress").length,
        review: tasks.filter((t) => t.status === "Review").length,
        testing: tasks.filter((t) => t.status === "Testing").length,
        completed: tasks.filter((t) => t.status === "Completed").length,
        cancelled: tasks.filter((t) => t.status === "Cancelled").length,
        blocked: tasks.filter((t) => t.status === "Blocked").length,
      },
      byPriority: {
        low: tasks.filter((t) => t.priority === "Low").length,
        medium: tasks.filter((t) => t.priority === "Medium").length,
        high: tasks.filter((t) => t.priority === "High").length,
        critical: tasks.filter((t) => t.priority === "Critical").length,
        urgent: tasks.filter((t) => t.priority === "Urgent").length,
      },
      byType: {
        feature: tasks.filter((t) => t.type === "Feature").length,
        bug: tasks.filter((t) => t.type === "Bug").length,
        improvement: tasks.filter((t) => t.type === "Improvement").length,
        documentation: tasks.filter((t) => t.type === "Documentation").length,
        research: tasks.filter((t) => t.type === "Research").length,
        design: tasks.filter((t) => t.type === "Design").length,
        testing: tasks.filter((t) => t.type === "Testing").length,
        deployment: tasks.filter((t) => t.type === "Deployment").length,
        maintenance: tasks.filter((t) => t.type === "Maintenance").length,
      },
    };

    // Time tracking analytics
    const timeTracking = {
      totalLogged: tasks.reduce(
        (sum, t) => sum + (t.timeTracking?.totalLogged || 0),
        0
      ),
      billableHours: tasks.reduce(
        (sum, t) => sum + (t.timeTracking?.billableHours || 0),
        0
      ),
      nonBillableHours: tasks.reduce(
        (sum, t) => sum + (t.timeTracking?.nonBillableHours || 0),
        0
      ),
      averageTaskTime:
        tasks.length > 0
          ? tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) /
            tasks.length
          : 0,
    };

    // Quality metrics
    const qualityMetrics = {
      totalBugs: tasks.reduce((sum, t) => sum + (t.quality?.bugsFound || 0), 0),
      fixedBugs: tasks.reduce((sum, t) => sum + (t.quality?.bugsFixed || 0), 0),
      averageTestCoverage:
        tasks.length > 0
          ? tasks.reduce((sum, t) => sum + (t.quality?.testCoverage || 0), 0) /
            tasks.length
          : 0,
      averageCodeQuality:
        tasks.length > 0
          ? tasks.reduce(
              (sum, t) => sum + (t.quality?.codeQualityScore || 0),
              0
            ) / tasks.length
          : 0,
    };

    // Team performance
    const teamPerformance = project.team.map((member) => {
      const memberTasks = tasks.filter((t) =>
        t.assignedTo.some(
          (a) => a.user._id.toString() === member.user._id.toString()
        )
      );
      const completedTasks = memberTasks.filter(
        (t) => t.status === "Completed"
      ).length;
      const totalHours = memberTasks.reduce(
        (sum, t) => sum + (t.actualHours || 0),
        0
      );

      return {
        userId: member.user._id,
        username: member.user.username,
        fullName: `${member.user.firstName} ${member.user.lastName}`,
        role: member.role,
        allocation: member.allocation,
        tasksAssigned: memberTasks.length,
        tasksCompleted: completedTasks,
        completionRate:
          memberTasks.length > 0
            ? (completedTasks / memberTasks.length) * 100
            : 0,
        totalHours,
        averageHoursPerTask:
          memberTasks.length > 0 ? totalHours / memberTasks.length : 0,
      };
    });

    // Generate AI insights
    const completionPrediction = predictProjectCompletion(project, tasks);
    const riskAssessment = assessProjectRisk(project, tasks);
    const resourceRecommendations = generateResourceRecommendations(
      project,
      tasks
    );

    // Burndown chart data
    const burndownData = project.analytics?.burndownData || [];

    // Velocity calculation
    const completedTasksWithDates = tasks.filter(
      (t) => t.startDate && t.completedDate
    );
    const velocity =
      completedTasksWithDates.length > 0
        ? completedTasksWithDates.length /
          Math.max(moment().diff(moment(project.startDate), "days"), 1)
        : 0;

    res.json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        actualCost: project.actualCost,
        manager: project.manager,
      },
      metrics: {
        tasks: taskMetrics,
        timeTracking,
        quality: qualityMetrics,
        velocity: Math.round(velocity * 100) / 100,
      },
      team: teamPerformance,
      insights: {
        completionPrediction,
        riskAssessment,
        resourceRecommendations,
        burndownData,
      },
    });
  } catch (error) {
    console.error("Project analytics error:", error);
    res.status(500).json({ error: "Failed to generate project analytics" });
  }
};

// GET /api/analytics/team
exports.getTeamAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let query = { isActive: true };
    if (department) {
      query.department = department;
    }

    const users = await User.find(query);
    const userIds = users.map((u) => u._id);

    // Get tasks for the team members
    let taskQuery = {
      "assignedTo.user": { $in: userIds },
    };

    if (startDate && endDate) {
      taskQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const tasks = await Task.find(taskQuery)
      .populate("assignedTo.user", "username firstName lastName department")
      .populate("project", "name");

    // Calculate individual performance
    const teamPerformance = users.map((user) => {
      const userTasks = tasks.filter((t) =>
        t.assignedTo.some((a) => a.user._id.toString() === user._id.toString())
      );

      const completedTasks = userTasks.filter((t) => t.status === "Completed");
      const overdueTasks = userTasks.filter((t) => t.isOverdue);
      const totalHours = userTasks.reduce(
        (sum, t) => sum + (t.actualHours || 0),
        0
      );
      const estimatedHours = userTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 0),
        0
      );

      const efficiency =
        estimatedHours > 0 ? (estimatedHours / totalHours) * 100 : 0;
      const onTimeCompletion = completedTasks.filter(
        (t) =>
          t.completedDate && moment(t.completedDate).isBefore(moment(t.dueDate))
      ).length;

      return {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
        metrics: {
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          completionRate:
            userTasks.length > 0
              ? (completedTasks.length / userTasks.length) * 100
              : 0,
          onTimeRate:
            completedTasks.length > 0
              ? (onTimeCompletion / completedTasks.length) * 100
              : 0,
          totalHours,
          averageHoursPerTask:
            userTasks.length > 0 ? totalHours / userTasks.length : 0,
          efficiency: Math.round(efficiency * 100) / 100,
          productivityScore: user.performance?.productivityScore || 0,
        },
        recentActivity: {
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity,
          totalLogins: user.activity?.totalLogins || 0,
        },
      };
    });

    // Calculate team averages
    const teamAverages = {
      averageCompletionRate:
        teamPerformance.length > 0
          ? teamPerformance.reduce(
              (sum, member) => sum + member.metrics.completionRate,
              0
            ) / teamPerformance.length
          : 0,
      averageEfficiency:
        teamPerformance.length > 0
          ? teamPerformance.reduce(
              (sum, member) => sum + member.metrics.efficiency,
              0
            ) / teamPerformance.length
          : 0,
      totalTasks: teamPerformance.reduce(
        (sum, member) => sum + member.metrics.totalTasks,
        0
      ),
      totalCompletedTasks: teamPerformance.reduce(
        (sum, member) => sum + member.metrics.completedTasks,
        0
      ),
      totalHours: teamPerformance.reduce(
        (sum, member) => sum + member.metrics.totalHours,
        0
      ),
    };

    // Department breakdown
    const departmentStats = {};
    teamPerformance.forEach((member) => {
      const dept = member.department || "Unassigned";
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          memberCount: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalHours: 0,
        };
      }
      departmentStats[dept].memberCount++;
      departmentStats[dept].totalTasks += member.metrics.totalTasks;
      departmentStats[dept].completedTasks += member.metrics.completedTasks;
      departmentStats[dept].totalHours += member.metrics.totalHours;
    });

    res.json({
      teamPerformance,
      teamAverages,
      departmentStats,
      totalMembers: teamPerformance.length,
      period: {
        startDate: startDate || moment().subtract(30, "days").toDate(),
        endDate: endDate || new Date(),
      },
    });
  } catch (error) {
    console.error("Team analytics error:", error);
    res.status(500).json({ error: "Failed to generate team analytics" });
  }
};

// GET /api/analytics/reports
exports.generateReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate, format = "json" } = req.query;

    let reportData = {};

    switch (reportType) {
      case "project_summary":
        const projects = await Project.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).populate("manager", "username firstName lastName");

        reportData = {
          totalProjects: projects.length,
          completedProjects: projects.filter((p) => p.status === "Completed")
            .length,
          activeProjects: projects.filter((p) =>
            ["Planning", "In Progress"].includes(p.status)
          ).length,
          totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
          totalActualCost: projects.reduce(
            (sum, p) => sum + (p.actualCost || 0),
            0
          ),
          projects: projects.map((p) => ({
            id: p._id,
            name: p.name,
            status: p.status,
            progress: p.progress,
            budget: p.budget,
            actualCost: p.actualCost,
            manager: p.manager,
          })),
        };
        break;

      case "team_performance":
        // Get team performance data
        const users = await User.find({ role: { $in: ["employee", "manager"] } });
        const allTasks = await Task.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        const teamMembers = users.map(user => {
          const userTasks = allTasks.filter(task => 
            task.assignedTo.some(assigned => assigned.toString() === user._id.toString())
          );
          const completedTasks = userTasks.filter(task => task.status === "Completed");
          
          return {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            tasksAssigned: userTasks.length,
            tasksCompleted: completedTasks.length,
            completionRate: userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0,
            averageTime: completedTasks.length > 0 ? 
              completedTasks.reduce((sum, task) => {
                if (task.startDate && task.completedDate) {
                  return sum + moment(task.completedDate).diff(moment(task.startDate), "days");
                }
                return sum;
              }, 0) / completedTasks.length : 0
          };
        });

        reportData = {
          totalMembers: teamMembers.length,
          completedTasks: allTasks.filter(task => task.status === "Completed").length,
          averageProductivity: teamMembers.length > 0 ? 
            teamMembers.reduce((sum, member) => sum + member.completionRate, 0) / teamMembers.length : 0,
          teamMembers: teamMembers
        };
        break;

      case "financial_summary":
        const financialProjects = await Project.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        const financialData = financialProjects.reduce(
          (acc, project) => {
            acc.totalBudget += project.budget || 0;
            acc.totalActualCost += project.actualCost || 0;
            acc.projects.push({
              name: project.name,
              budget: project.budget,
              actualCost: project.actualCost,
              variance:
                project.budget > 0
                  ? ((project.actualCost - project.budget) / project.budget) *
                    100
                  : 0,
            });
            return acc;
          },
          { totalBudget: 0, totalActualCost: 0, projects: [] }
        );

        reportData = {
          ...financialData,
          totalVariance:
            financialData.totalBudget > 0
              ? ((financialData.totalActualCost - financialData.totalBudget) /
                  financialData.totalBudget) *
                100
              : 0,
        };
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(reportData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${reportType}_${startDate}_${endDate}.csv"`
      );
      return res.send(csv);
    }

    res.json(reportData);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  // Implementation would depend on the data structure
  // This is a simplified version
  return JSON.stringify(data);
};
