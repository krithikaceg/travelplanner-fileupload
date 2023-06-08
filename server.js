const format = require('util').format;
const express = require('express');
const cors = require('cors');
const Multer = require('multer');
const helmet = require('helmet');
const path = require('path');
const bodyParser = require('body-parser');
const Storage = require('@google-cloud/storage');
const storage = Storage();
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));
app.use(cors());


const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // no larger than 100mb, you can change as needed.
  }
});

// A bucket is a container for objects (files).
const bucket = storage.bucket('customer-map-data');

// Process the file upload and upload to Google Cloud Storage.
app.post('/upload', multer.single('file'), (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept, Origin, Authorization")
  res.set("Cache-Control", null)
  res.set("X-Requested-With", null)
  res.set("Content-Type", 'multipart/form-data')

  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(`https://storage.cloud.google.com/customer-map-data/${blob.name}`);
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});