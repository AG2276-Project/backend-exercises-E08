// Middleware to check if user is logged in
export const protect = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({
    error: 'Access denied. Please login first'
  })
}

// Middleware to check if user is admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  res.status(403).json({
    error: 'Access denied. Admin only'
  })
}

// Middleware to check ownership or admin
export const ownerOrAdmin = (model) => async (req, res, next) => {
  try {
    const resource = await model.findById(req.params.id)
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }

    // Admin can do anything
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if user owns the resource
    if (resource.owner && resource.owner.toString() === req.user._id.toString()) {
      return next()
    }

    res.status(403).json({
      error: 'Access denied. You can only modify your own resources'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}