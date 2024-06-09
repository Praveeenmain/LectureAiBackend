const express = require("express");
const axios = require("axios");
const cors = require('cors');
const multer = require("multer");
const { connectToDb, getDb } = require('./db');
const { ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

let db;

connectToDb((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  db = getDb();
  app.listen(3002, () => {
    console.log(`App is listening on port 3002`);
  });
});

app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const audioData = {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    data: req.file.buffer,
    uploadDate: new Date()
  };

  try {
    const result = await db.collection('Audio').insertOne(audioData);
    res.status(201).send({ message: 'Audio file uploaded successfully.', id: result.insertedId });
  } catch (error) {
    res.status(500).send({ message: 'Error uploading audio file.', error: error.message });
  }
});

app.post('/process-audio-gpt', async (req, res) => {
  try {
    const transcript = req.body.transcript;

    const gpt40Response = await axios.post('https://api.openai.com/v1/gpt-4o', {
      prompt: `Lecture transcript: ${transcript}`
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Access API key from environment variable
      }
    });

    res.status(200).send(gpt40Response.data);
  } catch (error) {
    res.status(500).send({ message: 'Error processing audio with GPT-4o.', error: error.message });
  }
});

app.post('/generate-images-dalle', async (req, res) => {
  try {
    const transcript = req.body.transcript;

    const dalleResponse = await axios.post('https://api.openai.com/v1/dalle', {
      prompt: `Create images for: ${transcript}`
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Access API key from environment variable
      }
    });

    res.status(200).send(dalleResponse.data);
  } catch (error) {
    res.status(500).send({ message: 'Error generating images with DALL-E.', error: error.message });
  }
});

app.get('/audio-files', async (req, res) => {
  try {
    const audioFiles = await db.collection('Audio').find().toArray();
    res.status(200).send(audioFiles);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching audio files.', error: error.message });
  }
});

app.get('/audio-files/:id', async (req, res) => {
  try {
    const audioId = req.params.id;

    const audioFile = await db.collection('Audio').findOne({ _id: new ObjectId(audioId) });

    if (!audioFile) {
      return res.status(404).send({ message: 'Audio file not found.' });
    }

    res.status(200).send(audioFile);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching audio file.', error: error.message });
  }
});
