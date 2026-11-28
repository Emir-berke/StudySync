import { defineConfig } from 'cypress'
import { createRequire } from 'node:module'

const requireServer = createRequire(new URL('../server/package.json', import.meta.url))

export default defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 800,
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    setupNodeEvents(on, config) {
      on('task', {
        async seedAuthUsers() {
          // Fixtures may only touch an explicitly named, disposable local DB.
          // Never point the app or this test at Atlas/production.
          const uri = process.env.E2E_MONGO_URI
          if (!uri) throw new Error('Set E2E_MONGO_URI to a disposable local studysync_e2e database')
          const parsed = new URL(uri)
          if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)
            || parsed.pathname !== '/studysync_e2e'
            || new URL(config.baseUrl).hostname !== 'localhost') {
            throw new Error('Auth E2E fixtures require localhost and the studysync_e2e database')
          }
          const mongoose = requireServer('mongoose')
          const bcrypt = requireServer('bcryptjs')
          const connection = await mongoose.createConnection(uri).asPromise()
          try {
            const users = connection.collection('users')
            const passwordHash = await bcrypt.hash('E2ePassword123!', 10)
            const admin = await users.findOneAndUpdate(
              { email: 'scrum11-admin@example.test' },
              { $set: { name: 'E2E Admin', passwordHash, role: 'admin' } },
              { upsert: true, returnDocument: 'after' },
            )
            return { adminId: admin._id.toString() }
          } finally {
            await connection.close()
          }
        },
      })
      return config
    },
  },
})
