const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { connectToDb, getDb } = require('./db');
const { ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

// Set up multer storage
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
