const sampleSessions = (users) => [
  {
    title: 'Java Study Group',
    description: 'Practice Java programming together',
    createdBy: users[0]._id,
    participants: [users[0]._id, users[1]._id],
    scheduledAt: new Date('2027-01-15T15:00:00Z'),
    status: 'upcoming',
  },
  {
    title: 'Database Study Session',
    description: 'Review SQL queries and MongoDB',
    createdBy: users[1]._id,
    participants: [users[0]._id, users[1]._id],
    scheduledAt: new Date('2027-01-16T15:00:00Z'),
    status: 'upcoming',
  },
];

module.exports = sampleSessions;
