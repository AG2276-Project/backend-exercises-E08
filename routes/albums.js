import express from 'express'
import {
  getAllAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumsByGenre,
  getAlbumAge
} from '../controllers/albums.js'
import { protect, ownerOrAdmin } from '../middleware/auth.js'
import Album from '../models/albums.js'

const router = express.Router()

// Public routes
router.get('/',             getAllAlbums)
router.get('/genre/:genre', getAlbumsByGenre)
router.get('/:id',          getAlbumById)
router.get('/:id/age',      getAlbumAge)

// Protected routes
router.post('/',      protect, createAlbum)
router.put('/:id',    protect, ownerOrAdmin(Album), updateAlbum)
router.delete('/:id', protect, ownerOrAdmin(Album), deleteAlbum)

export default router