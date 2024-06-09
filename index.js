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
    process.exit(1); // Exit the process if unable to connect to the database
  }
  db = getDb();
  app.listen(3002, () => {
    console.log(`App is listening on port 3002`);
  });
});

app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const audioData = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadDate: new Date()
    };

    // Insert the audio data into the database
    const result = await db.collection('Audio').insertOne(audioData);
    
    // Make a request to Whisper.ai Speech-to-Text API
    const whisperApiKey = process.env.WHISPER_API_KEY; 
    if (!whisperApiKey) {
      throw new Error('WHISPER_API_KEY not found in environment variables.');
    }
    const whisperUrl = 'https://api.whisper.ai/speech-to-text';

    const config = {
      headers: {
        'Content-Type': req.file.mimetype, // Use the uploaded file's content type
        'x-api-key': whisperApiKey
      }
    };

    const response = await axios.post(whisperUrl, req.file.buffer, config);

    // Get transcription from the response
    const transcription = response.data.transcription;

    // Send back the transcription along with audio file ID
    res.status(200).send({ 
      message: 'Audio file uploaded and transcribed successfully.',
      audioId: result.insertedId,
      transcription: transcription
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle AxiosError
      console.error('Axios error:', error.response ? error.response.data : error.message);
      res.status(500).send({ message: 'Error making HTTP request.', error: error.message });
    } else {
      // Handle other errors
      console.error('Error uploading or transcribing audio file:', error);
      res.status(500).send({ message: 'Error uploading or transcribing audio file.', error: error.message });
    }
  }
});

app.get('/audio-files', async (req, res) => {
  try {
    const audioFiles = await db.collection('Audio').find().toArray();
    res.status(200).send(audioFiles);
  } catch (error) {
    console.error('Error fetching audio files:', error);
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
    console.error('Error fetching audio file:', error);
    res.status(500).send({ message: 'Error fetching audio file.', error: error.message });
  }
});
