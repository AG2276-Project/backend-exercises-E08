import mongoose from 'mongoose'

const connectMongoDB = (url) => {
  return mongoose.connect(url)
}

export default connectMongoDB