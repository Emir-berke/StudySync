
const bcrypt = require("bcryptjs");

const sampleUsers = async () => [
  {
    name: "Test Student One",
    email: "student1@example.com",
    passwordHash: await bcrypt.hash("TestPassword123!", 10),
  },
  {
    name: "Test Student Two",
    email: "student2@example.com",
    passwordHash: await bcrypt.hash("TestPassword123!", 10),
  },
];

module.exports = sampleUsers;
