import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import User from '../models/User.js'

// Configure passport to use local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' })
      }

      return done(null, user)
    } catch (error) {
      return done(error)
    }
  }
))

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user._id)
})

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})

export default passport