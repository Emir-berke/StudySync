import { ApiError, tokenStore } from './client'

// In-browser stand-in for the sessions and tasks endpoints. Data is kept in
// localStorage so it survives a refresh. It exists only so the UI can be built
// and demonstrated before the real endpoints are merged.

const DB_KEY = 'studysync_mock_db_v1'
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

// The signed-in user's id comes from the real JWT (`sub` claim).
function currentUserId() {
  try {
    const payload = tokenStore.get().split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).sub
  } catch {
    throw new ApiError('Authentication token is required', 401)
  }
}

function seed() {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  return {
    sessions: [
      {
        id: 'mock-s1',
        title: 'COMP229 Midterm Review',
        description: 'Go over Express routing, Mongoose models and JWT auth.',
        createdBy: 'mock-other-user',
        participants: ['mock-other-user'],
        scheduledAt: new Date(now + 2 * day).toISOString(),
        status: 'upcoming',
      },
      {
        id: 'mock-s2',
        title: 'REST API Testing Workshop',
        description: 'Jest and Supertest practice for CRUD endpoints.',
        createdBy: 'mock-other-user',
        participants: ['mock-other-user'],
        scheduledAt: new Date(now + 5 * day).toISOString(),
        status: 'upcoming',
      },
    ],
    tasks: [
      { id: 'mock-t1', session: 'mock-s1', title: 'Summarise routing notes', description: '', assignedTo: null, status: 'todo', priority: 'medium', dueDate: null },
      { id: 'mock-t2', session: 'mock-s1', title: 'Write 5 practice questions', description: '', assignedTo: null, status: 'in-progress', priority: 'high', dueDate: null },
      { id: 'mock-t3', session: 'mock-s1', title: 'Book the study room', description: '', assignedTo: null, status: 'done', priority: 'low', dueDate: null },
    ],
  }
}

function read() {
  try {
    const stored = localStorage.getItem(DB_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Fall through to a fresh seed.
  }
  return seed()
}

function write(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Storage unavailable: changes last for this page view only.
  }
}

const newId = () => `mock-${crypto.randomUUID()}`

function findSession(db, id) {
  const session = db.sessions.find((item) => item.id === id)
  if (!session) throw new ApiError('Session not found', 404)
  return session
}

function requireOwner(session, userId) {
  if (session.createdBy !== userId) {
    throw new ApiError('Only the session creator can do this', 403)
  }
}

export const mockSessions = {
  async list() {
    await delay()
    return read().sessions
  },

  async get(id) {
    await delay()
    return findSession(read(), id)
  },

  async create(body) {
    await delay()
    const userId = currentUserId()
    const db = read()
    const session = {
      id: newId(),
      description: '',
      status: 'upcoming',
      ...body,
      createdBy: userId,
      participants: [userId],
    }
    db.sessions.unshift(session)
    write(db)
    return session
  },

  async update(id, body) {
    await delay()
    const db = read()
    const session = findSession(db, id)
    requireOwner(session, currentUserId())
    Object.assign(session, body)
    write(db)
    return session
  },

  async remove(id) {
    await delay()
    const db = read()
    requireOwner(findSession(db, id), currentUserId())
    db.sessions = db.sessions.filter((item) => item.id !== id)
    db.tasks = db.tasks.filter((task) => task.session !== id)
    write(db)
    return { success: true }
  },

  async join(id) {
    await delay()
    const userId = currentUserId()
    const db = read()
    const session = findSession(db, id)
    if (!session.participants.includes(userId)) session.participants.push(userId)
    write(db)
    return session
  },

  async leave(id) {
    await delay()
    const userId = currentUserId()
    const db = read()
    const session = findSession(db, id)
    session.participants = session.participants.filter((p) => p !== userId)
    write(db)
    return session
  },
}

export const mockTasks = {
  async listForSession(sessionId) {
    await delay()
    return read().tasks.filter((task) => task.session === sessionId)
  },

  async create(sessionId, body) {
    await delay()
    const db = read()
    findSession(db, sessionId)
    const task = {
      id: newId(),
      description: '',
      assignedTo: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      ...body,
      session: sessionId,
    }
    db.tasks.push(task)
    write(db)
    return task
  },

  async update(id, body) {
    await delay()
    const db = read()
    const task = db.tasks.find((item) => item.id === id)
    if (!task) throw new ApiError('Task not found', 404)
    Object.assign(task, body)
    write(db)
    return task
  },

  async remove(id) {
    await delay()
    const db = read()
    if (!db.tasks.some((task) => task.id === id)) throw new ApiError('Task not found', 404)
    db.tasks = db.tasks.filter((task) => task.id !== id)
    write(db)
    return { success: true }
  },
}
