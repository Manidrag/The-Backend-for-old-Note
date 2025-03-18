//ramramji
//This file is used to create schema for the database and connect to the database

const mongoose = require('mongoose');
const { buffer } = require('stream/consumers');
const Schema = mongoose.Schema;

mongoose.connect(process.env.THEMONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  profile:{
    type:String,
    required:false,

  }
});

const noteSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: false
  },
  transcription: {
    type: String,
    ref: 'User'
  },
  favourite: {
    type: Boolean,
    default: false
  },
  image: {
    type: Buffer, // Use Buffer to store binary data
    required: false
  },
  audio: {
    type: Buffer, // Use Buffer to store binary data
    required: false
  },
  update: {
    type: Date,
    default: Date.now
  },
  created: {
    type: Date,
    default: Date.now
  },
  user:{
    type: String,
    ref: 'User'
  }
});

const User = mongoose.model('User', userSchema);
const Note = mongoose.model('Note', noteSchema);

module.exports = { User, Note };
