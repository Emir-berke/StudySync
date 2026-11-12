const mongoose = require('mongoose');

const Session = require('../models/Session');

describe('Session model', () => {
  test('accepts the session fields and exposes its related tasks', async () => {
    const creator = new mongoose.Types.ObjectId();
    const participant = new mongoose.Types.ObjectId();
    const session = new Session({
      title: 'Biology review',
      description: 'Review cell structure.',
      createdBy: creator,
      participants: [creator, participant],
      scheduledAt: new Date('2027-05-10T18:30:00.000Z'),
      status: 'upcoming',
    });

    await expect(session.validate()).resolves.toBeUndefined();
    expect(session.toObject()).toMatchObject({
      title: 'Biology review',
      description: 'Review cell structure.',
      createdBy: creator,
      participants: [creator, participant],
      status: 'upcoming',
    });
    expect(Session.schema.virtuals.tasks.options).toMatchObject({
      ref: 'Task',
      localField: '_id',
      foreignField: 'session',
    });
    expect(Session.schema.path('location')).toBeUndefined();
  });

  test('requires a title, creator, and scheduled date', async () => {
    const error = await new Session({})
      .validate()
      .catch((validationError) => validationError);

    expect(Object.keys(error.errors).sort()).toEqual(
      ['createdBy', 'scheduledAt', 'title'].sort(),
    );
  });
});
