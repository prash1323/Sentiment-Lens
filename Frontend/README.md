# SentimentLens

SentimentLens is a web application for analyzing the sentiment and emotional tone of text.

The idea behind the project is pretty simple: you give it a piece of text, and SentimentLens tries to make the tone behind it easier to understand. Along with the sentiment, the application also presents the detected emotion and the model's confidence in its prediction.

The project is being built from scratch, with the frontend first and the backend, database, and NLP components being added step by step.

## Current Progress

The frontend is currently complete.

It includes:

- Landing page
- Text analysis workspace
- Sentiment and emotion result view
- Insight Board
- Analysis Archive
- Search and filtering
- Local storage for analysis history
- Responsive design

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Planned Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### NLP / Machine Learning
- Python
- NLP and machine learning libraries
- Sentiment classification
- Emotion detection

## Project Structure

```text
SentimentLens/
│
├── index.html
├── analyze.html
├── insights.html
├── archive.html
│
├── css/
│   ├── style.css
│   ├── analyze.css
│   ├── insights.css
│   └── archive.css
│
├── js/
│   ├── script.js
│   ├── analyze.js
│   ├── insights.js
│   ├── archive.js
│   └── storage.js
│
└── README.md