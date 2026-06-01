import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import connectMongoDB from './db/mongodb.js'
import albumRoutes from './routes/albums.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import passport from './config/passport.js'

const app = express()

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/albums', albumRoutes)
app.use('/api', authRoutes)
app.use('/api/users', userRoutes)

// Export app for testing
export default app

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = 3000
  try {
    await connectMongoDB(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.log(error)
  }
}