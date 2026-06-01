import Album from '../models/albums.js'

export const getAllAlbums = async (req, res) => {
  try {
    const { sort, fields, search, startYear, endYear, page, limit } = req.query
    const filter = {}

    if (req.query['year[gte]']) filter.year = { ...filter.year, $gte: parseInt(req.query['year[gte]']) }
    if (req.query['year[lte]']) filter.year = { ...filter.year, $lte: parseInt(req.query['year[lte]']) }
    if (req.query['year[gt]'])  filter.year = { ...filter.year, $gt:  parseInt(req.query['year[gt]']) }
    if (req.query['year[lt]'])  filter.year = { ...filter.year, $lt:  parseInt(req.query['year[lt]']) }
    if (req.query.year && !req.query['year[gte]'] && !req.query['year[lte]']) filter.year = parseInt(req.query.year)

    if (search) {
      filter.$or = [
        { artist: { $regex: search, $options: 'i' } },
        { title:  { $regex: search, $options: 'i' } }
      ]
    }

    if (startYear || endYear) {
      filter.year = {}
      if (startYear) filter.year.$gte = parseInt(startYear)
      if (endYear)   filter.year.$lte = parseInt(endYear)
    }

    const pageNum  = parseInt(page)  || 1
    const limitNum = parseInt(limit) || 10
    const skip     = (pageNum - 1) * limitNum

    const total      = await Album.countDocuments(filter)
    const totalPages = Math.ceil(total / limitNum)

    let query = Album.find(filter)
    if (fields) query = query.select(fields.split(',').join(' '))
    if (sort)   query = query.sort(sort.split(',').join(' '))
    query = query.skip(skip).limit(limitNum)

    const albums = await query.exec()

    res.status(200).json({
      metadata: {
        total,
        page:        pageNum,
        limit:       limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      data: albums
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).exec()
    if (!album) return res.status(404).json({ error: 'Album not found' })
    res.status(200).json(album)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createAlbum = async (req, res) => {
  try {
    const artistTitle = `${req.body.artist}-${req.body.title}`.toLowerCase()
    const existing = await Album.findOne({ artistTitle })
    if (existing) {
      return res.status(400).json({
        error: 'An album with this artist and title already exists'
      })
    }
    // Save owner as the logged in user
    const album = await Album.create({
      ...req.body,
      artistTitle,
      owner: req.user._id
    })
    res.status(201).json(album)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    ).exec()
    if (!album) return res.status(404).json({ error: 'Album not found' })
    res.status(200).json(album)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id).exec()
    if (!album) return res.status(404).json({ error: 'Album not found' })
    res.status(200).json({ message: 'Album deleted', album })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAlbumsByGenre = async (req, res) => {
  try {
    const albums = await Album.findByGenre(req.params.genre)
    res.status(200).json(albums)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAlbumAge = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).exec()
    if (!album) return res.status(404).json({ error: 'Album not found' })
    res.status(200).json({
      title:      album.title,
      artist:     album.artist,
      year:       album.year,
      ageInYears: album.ageInYears,
      isClassic:  album.isClassic()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}