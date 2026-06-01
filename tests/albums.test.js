import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import Album from '../models/albums.js'
import User from '../models/User.js'
import testData from './data.json' assert { type: 'json' }

let agent
let testUser

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URI)
})

beforeEach(async () => {
  await Album.deleteMany({})
  await User.deleteMany({})

  // Create test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  })

  // Create test albums WITH owner set to test user
  await Album.create(testData.albums.map(album => ({
    ...album,
    artistTitle: `${album.artist}-${album.title}`.toLowerCase(),
    owner: testUser._id
  })))

  // Login
  agent = request.agent(app)
  await agent
    .post('/api/login')
    .send({ email: 'test@example.com', password: 'password123' })
})

afterAll(async () => {
  await Album.deleteMany({})
  await User.deleteMany({})
  await mongoose.connection.close()
})

// Task 1 - GET tests
describe('GET /api/albums', () => {
  it('should return all albums', async () => {
    const response = await request(app)
      .get('/api/albums')
      .expect(200)
    expect(response.body.data).toHaveLength(testData.albums.length)
  })

  it('should return correct number of albums', async () => {
    const response = await request(app)
      .get('/api/albums')
      .expect(200)
    expect(response.body.metadata.total).toBe(testData.albums.length)
  })
})

// Task 2 - POST tests
describe('POST /api/albums', () => {
  it('should add a new album successfully', async () => {
    const newAlbum = {
      artist: 'Led Zeppelin',
      title: 'Led Zeppelin IV',
      year: 1971,
      genre: 'Rock',
      tracks: 8
    }
    const response = await agent
      .post('/api/albums')
      .send(newAlbum)
      .expect(201)
    expect(response.body.artist).toBe(newAlbum.artist)
    expect(response.body.title).toBe(newAlbum.title)
    expect(response.body.year).toBe(newAlbum.year)
    expect(response.body.genre).toBe(newAlbum.genre)
    expect(response.body.tracks).toBe(newAlbum.tracks)
  })

  it('should increase album count by one after adding', async () => {
    const beforeResponse = await request(app)
      .get('/api/albums')
      .expect(200)
    const countBefore = beforeResponse.body.metadata.total

    await agent
      .post('/api/albums')
      .send({
        artist: 'Led Zeppelin',
        title: 'Led Zeppelin IV',
        year: 1971,
        genre: 'Rock',
        tracks: 8
      })
      .expect(201)

    const afterResponse = await request(app)
      .get('/api/albums')
      .expect(200)
    const countAfter = afterResponse.body.metadata.total

    expect(countAfter).toBe(countBefore + 1)
  })

  it('should return 401 when adding album without login', async () => {
    await request(app)
      .post('/api/albums')
      .send({
        artist: 'Led Zeppelin',
        title: 'Led Zeppelin IV',
        year: 1971,
        genre: 'Rock',
        tracks: 8
      })
      .expect(401)
  })
})

// Task 3 - DELETE tests
describe('DELETE /api/albums/:id', () => {
  it('should delete an album successfully', async () => {
    const allAlbums = await request(app)
      .get('/api/albums')
      .expect(200)
    const albumToDelete = allAlbums.body.data[0]

    const response = await agent
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(200)

    expect(response.body.message).toBe('Album deleted')
  })

  it('should decrease album count by one after deleting', async () => {
    const beforeResponse = await request(app)
      .get('/api/albums')
      .expect(200)
    const countBefore = beforeResponse.body.metadata.total
    const albumToDelete = beforeResponse.body.data[0]

    await agent
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(200)

    const afterResponse = await request(app)
      .get('/api/albums')
      .expect(200)
    const countAfter = afterResponse.body.metadata.total

    expect(countAfter).toBe(countBefore - 1)
  })

  it('should not find deleted album anymore', async () => {
    const allAlbums = await request(app)
      .get('/api/albums')
      .expect(200)
    const albumToDelete = allAlbums.body.data[0]

    await agent
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(200)

    await request(app)
      .get(`/api/albums/${albumToDelete._id}`)
      .expect(404)
  })

  it('should handle deleting non-existent album gracefully', async () => {
    const fakeId = '507f1f77bcf86cd799439011'

    const response = await agent
      .delete(`/api/albums/${fakeId}`)
      .expect(404)

    expect(response.body.error).toBe('Resource not found')
  })

  it('should return 401 when deleting without login', async () => {
    const allAlbums = await request(app)
      .get('/api/albums')
      .expect(200)
    const albumToDelete = allAlbums.body.data[0]

    await request(app)
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(401)
  })
})