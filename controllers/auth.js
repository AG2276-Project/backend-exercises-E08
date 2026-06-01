import User from '../models/User.js'
import passport from 'passport'

// POST /register
export const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        error: 'Please provide name, email, password and password confirmation'
      })
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        error: 'Passwords do not match'
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists. Please use a different email'
      })
    }

    const user = await User.create({ name, email, password })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /login
export const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err)

    if (!user) {
      return res.status(401).json({
        error: info.message || 'Invalid email or password'
      })
    }

    // Log in user and create session
    req.logIn(user, (err) => {
      if (err) return next(err)

      res.status(200).json({
        message: 'Login successful',
        user: {
          id:    user._id,
          name:  user.name,
          email: user.email
        }
      })
    })
  })(req, res, next)
}

// POST /logout
export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    req.session.destroy()
    res.status(200).json({ message: 'Logged out successfully' })
  })
}