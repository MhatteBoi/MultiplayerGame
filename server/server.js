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
    origin: ["http://localhost:5173", "http://localhost:5174"],
    // match your Vite dev server
    methods: ["GET", "POST" ],
    allowedHeaders: ["Content-Type"],
    credentials: true

  }
});

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
    hidePoweredBy: false,
  })
);

// Override or add custom headers
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Multiplayer Game Server'); // override Helmet's default
  next();
});

// Sample dataset: an array of game rounds with image URLs and answers
const rounds = [
  {
    image: 'https://res.cloudinary.com/dm3vmtten/image/upload/v1751732186/00mXdkKDA8ubAKiLTL4v4BO-1_yfcxdr.webp', // place images under client/public/images
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
let zoomInterval;

// Start a new round – send image to all players
function startRound() {
  if (currentRoundIndex >= rounds.length) currentRoundIndex = 0;
  const currentRound = rounds[currentRoundIndex];

  roundActive = true;
  io.emit('roundStart', { image: currentRound.image });
  console.log(`Round started, answer is: ${currentRound.answer}, image: ${currentRound.image}`); // <-- Add image here

  // Reset and start zoom effect for each round
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
    players[socket.id] = { score: 0, name: socket.id };
  }
  socket.emit('scoreUpdate', players);

  // Send current image to new client if a round is active
  if (roundActive) {
    const currentRound = rounds[currentRoundIndex];
    socket.emit('roundStart', { image: currentRound.image });
  }

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