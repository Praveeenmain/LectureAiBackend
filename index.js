const express = require("express");
const axios = require("axios");
const cors = require('cors');
const multer = require("multer");
const { connectToDb, getDb } = require('./db');
const { ObjectId } = require("mongodb");



const OpenAI = require("openai");

const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});






const upload = multer({ storage });

let db;


 const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const audioFun = async (audioBuffer) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1"
    });
    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error; 
  }
};

const chatGPTFun = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: text }]
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error; 
  }
};
 

const dalleAi = async (text) => {
  const imageSize="1024x1024"
  const numberofimages=1
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      size: imageSize,
      n:numberofimages
    });
    console.log("Generated image URL:",response);
    return response.data[0].url;
  } catch (error) {
    console.error("Error generating image with DALL-E:", error);
    throw error; 
  }
};

connectToDb((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  db = getDb();
  app.listen(3002, () => {
    console.log(`App is listening on port 3001`);
  });
});

app.post('/upload-transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const audioReadStream = fs.createReadStream(req.file.path);

    const transcriptionText = await audioFun(audioReadStream);
    if (!transcriptionText) {
      return res.status(500).send('Error in transcription.');
    }

    const chatResponse = await chatGPTFun(transcriptionText);

    const imageurl = await dalleAi(transcriptionText);

 
    const audioBuffer = fs.readFileSync(req.file.path);
    const currentDate = new Date();

  
    const result = await db.collection('Audio').insertOne({
      transcription: transcriptionText,
      chatResponse: chatResponse,
      image: imageurl,
      audio: audioBuffer,
      date: currentDate
    });

    console.log('Inserted document ID:', result.insertedId);

    
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      transcription: transcriptionText,
      chatResponse: chatResponse,
      image: imageurl,
      date: currentDate
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request.');
  }
});

app.get('/audios', async (req, res) => {
  try {
    const audioCollection = db.collection('Audio');
    const audios = await audioCollection.find({}).toArray();
    res.status(200).json(audios);
  } catch (error) {
    console.error('Error retrieving audio documents:', error);
    res.status(500).send('Error retrieving audio documents.');
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

app.delete('/audio-files/:id', async (req, res) => {
  try {
    const audioId = req.params.id;

    const result = await db.collection('Audio').deleteOne({ _id: new ObjectId(audioId) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Audio file not found.' });
    }

    res.status(200).send({ message: 'Audio file deleted successfully.' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).send({ message: 'Error deleting audio file.', error: error.message });
  }
});
