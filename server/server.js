const fs = require('fs');
const path = require('path');

const express = require('express');
const http = require('http');
const helmet = require('helmet'); // for security headers
const { Server } = require('socket.io');

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    //add 2 origin servers to allow CORS
    // this is for development; adjust for production
    origin: [
    "https://multiplayergame-1-epqg.onrender.com",
    "https://your-frontend-name.onrender.com",
    "http://localhost:5173" // for dev
  ],
    // match your Vite dev server
    methods: ["GET", "POST" ],
    allowedHeaders: ["Content-Type"],
    credentials: true

  }
});

const rounds = JSON.parse(fs.readFileSync('./data/rounds.json', 'utf8'));

const getRandomRound = () => {
  const index = Math.floor(Math.random() * rounds.length);
  return { round: rounds[index], index };
};

app.use(express.static('client/public'));  // serve your static frontend

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com"
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      }
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    hidePoweredBy: true,
  })
);

// To store connected players and their scores
let players = {};
const badWords = ['badword1', 'shit', 'fuck', 'bitch'];
// Track current round index and if the round is open for guessing
let currentRoundIndex = 0;
let roundActive = false;
let zoomInterval;
let currentRound = rounds[0]; // Start with the first round
let currentImage = null;

// Move to next round (after a guess or timeout)
function nextRound() {
  roundActive = false;
  let countdown = 3;
  const countdownInterval = setInterval(() => {
    io.emit('nextRoundIn', countdown);
    countdown--;
    if (countdown < 0) clearInterval(countdownInterval);
  }, 1000);

  const { round } = getRandomRound();
  currentRound = round;

  setTimeout(startRound, 4000); // wait before starting new round
}

// Start a new round – send image to all players
function startRound() {
  roundActive = true;
  currentImage = Array.isArray(currentRound.images)
    ? currentRound.images[Math.floor(Math.random() * currentRound.images.length)]
    : currentRound.image;
  io.emit('roundStart', { image: currentImage });
  // console.log(`Round started, answer is: ${currentRound.answers?.[0] || currentRound.answer}`);

  // Reset and start zoom effect
  zoomLevel = 18.5;
  if (zoomInterval) clearInterval(zoomInterval);
  zoomInterval = setInterval(() => {
    if (zoomLevel > 1) {
      zoomLevel -= 0.3;
      io.emit('zoomUpdate', { zoomLevel });
    } else {
      clearInterval(zoomInterval);
    }
  }, 200);
}




io.on('connection', (socket) => {

  //console.log('A user connected:', socket.id);
  // Initialize player's score
  if (!players[socket.id]) {
    players[socket.id] = { score: 0, name: "Anonymous" };
  }
socket.on('setName', (name) => {
  const cleanName = name.trim();

  if (
    cleanName.length === 0 ||
    cleanName.length > 20 ||
    badWords.some(word => cleanName.toLowerCase().includes(word))
  ) {
    socket.emit('invalidName', 'Invalid or inappropriate name.');
    return;
  }

  players[socket.id].name = cleanName;
  io.emit('scoreUpdate', players);
});

  // Send current image to new client if a round is active
if (roundActive && currentRound) {
  socket.emit('roundStart', { image: currentImage, zoomLevel });
}

  // Handle player's guess
socket.on('guess', (guess) => {
  if (!roundActive || !currentRound) return;

  const acceptedAnswers = currentRound.answers || [currentRound.answer];

const matchedAnswer = acceptedAnswers.find(answer =>
  guess.trim().toLowerCase() === answer.toLowerCase()
);

const isCorrect = Boolean(matchedAnswer);

  if (isCorrect) {
    players[socket.id].score += 10;

    io.emit('roundResult', {
      winner: players[socket.id].name,
      correctAnswer: matchedAnswer,
      scores: players
    });

    nextRound();
  } else {
    socket.emit('wrongGuess', { message: 'Incorrect, try again!' });
  }
});


  // Disconnect handling
  socket.on('disconnect', () => {
    //console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('scoreUpdate', players);
  });
});



// Start the first round when the server starts
server.listen(3000, () => {
 // console.log('Server running on http://localhost:3000');
    const { round } = getRandomRound();
  currentRound = round;
  startRound();
});