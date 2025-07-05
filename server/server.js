const express = require('express');
const http = require('http');
const http = require('helmet'); // for security headers
const { Server } = require('socket.io');

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('client/public'));  // serve your static frontend

// Sample dataset: an array of game rounds with image URLs and answers
const rounds = [
  {
    image: '/images/helmet_part1.jpg', // place images under client/public/images
    answer: 'Master Chief'
  },
  {
    image: '/images/visor_fragment.jpg',
    answer: 'Cortana'  // example; you can adjust based on available imagery
  }
  // Add more rounds as needed
];

// To store connected players and their scores
let players = {};

// Track current round index and if the round is open for guessing
let currentRoundIndex = 0;
let roundActive = false;

// Start a new round – send image to all players
function startRound() {
  if (currentRoundIndex >= rounds.length) currentRoundIndex = 0; // loop through rounds
  const currentRound = rounds[currentRoundIndex];

  roundActive = true;
  io.emit('roundStart', { image: currentRound.image });
  console.log(`Round started, answer is: ${currentRound.answer}`);
}

// Move to next round (after a guess or timeout)
function nextRound() {
  roundActive = false;
  currentRoundIndex++;
  setTimeout(startRound, 3000); // wait 3 seconds between rounds
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialize player's score
  if (!players[socket.id]) {
    players[socket.id] = { score: 0, name: socket.id }; // later you might allow custom names
  }

  // When a new player connects, optionally send the current score board
  socket.emit('scoreUpdate', players);

  // Handle player's guess
  socket.on('guess', (guess) => {
    const currentRound = rounds[currentRoundIndex];
    if (!roundActive) return; // ignore if round is closed

    // Compare guess (simple case-insensitive match)
    if (guess.trim().toLowerCase() === currentRound.answer.toLowerCase()) {
      players[socket.id].score += 10;  // award points for correct guess
      io.emit('roundResult', {
        winner: players[socket.id].name,
        correctAnswer: currentRound.answer,
        scores: players
      });
      nextRound();
    } else {
      // Optionally, you can broadcast wrong guess notifications or handle them differently
      socket.emit('wrongGuess', { message: 'Incorrect, try again!' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('scoreUpdate', players);
  });
});

// Start the first round when the server starts
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  startRound();
});