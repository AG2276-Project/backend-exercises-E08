import { Schema, model } from 'mongoose'

const albumSchema = new Schema({
  artist: {
    type: String,
    required: [true, 'Artist name is required'],
    minlength: [3, 'Artist name must be at least 3 characters'],
    maxlength: [50, 'Artist name cannot exceed 50 characters'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Album title is required'],
    minlength: [3, 'Album title must be at least 3 characters'],
    maxlength: [50, 'Album title cannot exceed 50 characters'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1900, 'Release year must be after 1900'],
    validate: {
      validator: function(value) {
        return value <= new Date().getFullYear()
      },
      message: props => `${props.value} is not a valid release year - cannot be in the future`
    }
  },
  genre: {
    type: String,
    enum: {
      values: ['Pop', 'Rock', 'Jazz', 'Jazz Rock', 'Progressive Rock', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'Blues', 'Soft Rock', 'Alternative'],
      message: '{VALUE} is not a valid genre'
    }
  },
  tracks: {
    type: Number,
    min: [1, 'Track count must be greater than 0'],
    max: [100, 'Track count cannot exceed 100']
  },
  artistTitle: {
    type: String,
    validate: {
      validator: async function(value) {
        const existing = await this.constructor.findOne({ artistTitle: value })
        if (existing && existing._id.toString() !== this._id.toString()) {
          return false
        }
        return true
      },
      message: 'An album with this artist and title already exists'
    }
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})

// Virtual property
albumSchema.virtual('ageInYears').get(function() {
  return new Date().getFullYear() - this.year
})

// Instance method
albumSchema.methods.isClassic = function() {
  return this.ageInYears > 25
}

// Static method
albumSchema.statics.findByGenre = function(genre) {
  return this.find({ genre: genre })
}

// Pre-save hook
albumSchema.pre('save', async function() {
  if (this.artist && this.title) {
    this.artistTitle = `${this.artist}-${this.title}`.toLowerCase()
  }
})

export default model('Album', albumSchema)