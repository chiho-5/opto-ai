const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' }); // Temporary folder to store uploaded files

// Serve the HTML page when accessing the root URL
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Video Upload with Progress</title>
      <style>
        /* Container Styles */
        .container {
          font-family: Arial, sans-serif;
          background: linear-gradient(180deg, #e9e4fc, #e0ebff);
          min-height: 100vh;
          padding: 20px;
          color: #333;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 20px;
        }

        .back-button,
        .settings-button {
          font-size: 20px;
          background: none;
          border: none;
          color: #333;
          cursor: pointer;
        }

        .title {
          font-size: 20px;
          font-weight: bold;
        }

        /* Progress Section Styles */
        .progress-section {
          width: 100%;
          text-align: center;
          margin-bottom: 20px;
        }

        .progress-text {
          font-size: 14px;
          color: #666;
        }

        .progress-bar {
          width: 100%;
          height: 5px;
          background-color: #ddd;
          border-radius: 5px;
          overflow: hidden;
          margin-top: 5px;
        }

        .progress-fill {
          height: 100%;
          background-color: #8a4baf;
        }

        /* Speaker Container Styles */
        .speaker-container {
          margin: 20px 0;
          width: 120px;
          height: 120px;
          background-color: #fff;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .speaker-button {
          font-size: 40px;
          color: #8a4baf;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* Sentence and Highlighted Text */
        .sentence {
          font-size: 24px;
          margin: 20px 0;
          text-align: center;
        }

        .highlighted-text {
          color: #8a4baf;
          font-weight: bold;
        }

        /* Word Info Section */
        .word-info {
          background-color: #fff;
          border-radius: 15px;
          padding: 15px;
          width: 100%;
          max-width: 300px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .word-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .word-details {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }

        .translation {
          font-size: 14px;
          color: #333;
        }

        /* Known Words Text */
        .known-words-text {
          font-size: 16px;
          color: #8a4baf;
          text-decoration: underline;
          cursor: pointer;
          margin-bottom: 20px;
        }

        /* Generate Button */
        .generate-button {
          background-color: #8a4baf;
          color: #fff;
          border: none;
          border-radius: 25px;
          padding: 15px 30px;
          font-size: 16px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <button class="back-button"></button>
          <h2 class="title">Genevieve</h2>
          <button class="settings-button"></button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-text">Progress: 0 / 100</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Speaker Icon -->
        <div class="speaker-container">
          <button class="speaker-button">🔊</button>
        </div>

        <!-- Sentence with Highlighted Word -->
        <div class="sentence">
          <span>The OPTO </span>
          <span class="highlighted-text">AI</span>
          <span> for Optometric Health</span>
        </div>

        <!-- Word Information Dropdown -->
        <div class="word-info">
          <p class="word-title">Opto</p>
          <div class="word-details">
            <span>your</span> | <span>Eye</span> | <span>Examination</span>
          </div>
          <p class="translation">Waiting for response...</p>
        </div>

        <!-- Known Words Text -->
        <p class="known-words-text">Project Description</p>
        
        <!-- File Input for video selection -->
        <input type="file" id="videoFile" accept="video/mp4" />

        <!-- Upload Button -->
        <button class="generate-button" onclick="uploadVideo()">Examine Eyes</button>
      </div>

      <script>
        const uploadVideo = () => {
          const videoFile = document.getElementById('videoFile').files[0]; // Get the selected file

          if (!videoFile) {
            alert("Please select a video file first.");
            return;
          }

          const formData = new FormData();
          formData.append('video', videoFile);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/submit-video', true);

          // Update progress bar
          xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100;
              document.querySelector('.progress-fill').style.width = percent + '%';
              document.querySelector('.progress-text').textContent = `Progress: ${Math.round(percent)} / 100`;
            }
          };

          // On complete, update word info with response
          xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            const wordInfo = document.querySelector('.word-info');
            wordInfo.querySelector('.translation').textContent = `Response: ${JSON.stringify(response)}`;
          };

          xhr.send(formData);
        };
      </script>
    </body>
    </html>
  `);
});

// Handle POST request for video upload
app.post('/submit-video', upload.single('video'), async (req, res) => {
  try {
    const videoPath = req.file.path; // Get the uploaded file path
    const videoStream = fs.createReadStream(videoPath); // Use stream for large files
    const formData = new FormData();
    formData.append('video', videoStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Axios configuration with progress tracking
    const response = await axios.post(
      'https://mvcloud--opto-ai-flask-app.modal.run/predict',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    // Cleanup the uploaded video file after processing
    fs.unlinkSync(videoPath);

    res.json(response.data); // Return Flask response
  } catch (error) {
    console.error('Error during video submission:', error);
    res.status(500).send({ error: 'Something went wrong' });
  }
});

// Start server
app.listen(3030, () => {
  console.log('Server running on port 3030');
});
