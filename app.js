const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary folder to store uploaded files

// Serve the HTML page when accessing the root URL
// The updated HTML structure with CSS for the blinking eye animation

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Video Upload with Progress</title>
      <style>
        .container { font-family: Arial, sans-serif; background: linear-gradient(180deg, #e9e4fc, #e0ebff); min-height: 100vh; padding: 20px; color: #333; display: flex; flex-direction: column; align-items: center; }
        .header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 20px; }
        .back-button, .settings-button { font-size: 20px; background: none; border: none; color: #333; cursor: pointer; }
        .title { font-size: 20px; font-weight: bold; }
        .progress-section { width: 100%; text-align: center; margin-bottom: 20px; }
        .progress-text { font-size: 14px; color: #666; }
        .progress-bar { width: 100%; height: 5px; background-color: #ddd; border-radius: 5px; overflow: hidden; margin-top: 5px; }
        .progress-fill { height: 100%; background-color: #8a4baf; }
        
        /* Blinking Eye Animation */
        .eye-container { margin: 20px 0; width: 120px; height: 120px; background-color: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        .eye { width: 50px; height: 25px; background-color: #8a4baf; border-radius: 50%; position: relative; animation: blink 3s infinite; }
        .eye::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background-color: #fff; border-radius: 50%; }
        
        @keyframes blink {
          0%, 20%, 40%, 60%, 80%, 100% { height: 25px; }
          10%, 30%, 50%, 70%, 90% { height: 5px; }
        }
        
        .sentence { font-size: 24px; margin: 20px 0; text-align: center; }
        .highlighted-text { color: #8a4baf; font-weight: bold; }
        .word-info { background-color: #fff; border-radius: 15px; padding: 15px; width: 100%; max-width: 300px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin-bottom: 20px; }
        .word-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .word-details { font-size: 14px; color: #666; margin-bottom: 10px; }
        .translation { font-size: 14px; color: #333; }
        .known-words-text { font-size: 16px; color: #8a4baf; text-decoration: underline; cursor: pointer; margin-bottom: 20px; }
        .generate-button, .file-input { background-color: #8a4baf; color: #fff; border: none; border-radius: 25px; padding: 15px 30px; font-size: 16px; cursor: pointer; }
        .file-input-container { display: flex; align-items: center; margin-bottom: 20px; }
        .file-input-label { font-size: 16px; margin-right: 10px; color: #333; }
        .file-input { padding: 8px 16px; font-size: 14px; color: #fff; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <button class="back-button"></button>
          <h2 class="title">Genevieve</h2>
          <button class="settings-button"></button>
        </div>
        <div class="progress-section">
          <p class="progress-text">Progress: 0 / 100</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%;"></div>
          </div>
        </div>
        <div class="eye-container">
          <div class="eye"></div>
        </div>
        <div class="sentence">
          <span>The OPTO </span>
          <span class="highlighted-text">AI</span>
          <span> for Optometric Health</span>
        </div>
        <div class="word-info">
          <p class="word-title">Opto</p>
          <div class="word-details">
            <span>your</span> | <span>Eye</span> | <span>Examination</span>
          </div>
          <p class="translation" id="status">Opto is ready</p>
        </div>
        <p class="known-words-text">Project Description</p>
        <div class="file-input-container">
          <label class="file-input-label" for="videoFile">Choose Video File:</label>
          <input type="file" id="videoFile" accept="video/mp4" class="file-input" />
        </div>
        <button class="generate-button" onclick="uploadVideo()">Examine Eyes</button>
      </div>
      <script>
        const uploadVideo = () => {
          const videoFile = document.getElementById('videoFile').files[0];
          if (!videoFile) {
            alert("Please select a video file first.");
            return;
          }
          document.getElementById('status').textContent = "Opto is examining...";
          
          const formData = new FormData();
          formData.append('video', videoFile);
          
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/submit-video', true);
          
          xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100;
              document.querySelector('.progress-fill').style.width = percent + '%';
              document.querySelector('.progress-text').textContent = \`Progress: \${Math.round(percent)} / 100\`;
            }
          };
          
          xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            document.getElementById('status').textContent = \`Response: \${JSON.stringify(response)}\`;
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
    const videoPath = req.file.path;
    const videoStream = fs.createReadStream(videoPath);
    const formData = new FormData();
    formData.append('video', videoStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(
      'https://mvcloud--opto-ai-flask-app.modal.run/predict',
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    fs.unlinkSync(videoPath);
    res.json(response.data);
  } catch (error) {
    console.error('Error during video submission:', error);
    res.status(500).send({ error: 'Something went wrong' });
  }
});

// Start server
app.listen(3030, () => {
  console.log('Server running on port 3030');
});
