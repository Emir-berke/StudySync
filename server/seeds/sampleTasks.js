
const sampleTasks = (users, sessions) => [
  {
    title: "Review Java OOP",
    description: "Practice inheritance and polymorphism",
    session: sessions[0]._id,
    assignedTo: users[0]._id,
    status: "todo",
    priority: "medium",
  },
  {
    title: "Practice SQL Queries",
    description: "Review joins and subqueries",
    session: sessions[1]._id,
    assignedTo: users[1]._id,
    status: "in-progress",
    priority: "high",
  },
];

module.exports = sampleTasks;
