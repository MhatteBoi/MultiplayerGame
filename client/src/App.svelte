<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

let name = 'No name yet.';
let errorMsg = '';
let showModal = true;

function submitName() {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    errorMsg = 'Name cannot be empty.';
    return;
  }

  if (trimmed.length > 20) {
    errorMsg = 'Name must be 20 characters max.';
    return;
  }

  if (["shit", "fuck", "bitch"].some(word => trimmed.toLowerCase().includes(word))) {
    errorMsg = 'Please choose a more appropriate name.';
    return;
  }

  socket.emit('setName', trimmed);
  showModal = false;
}

  let socket;
  let image = '';
  let guess = '';
  let messages = [];
  let scores = {};
  let zoom = 18.5; // Start zoomed in
  let countdown = null;


  onMount(() => {
    // Connect to the server
    socket = io("http://localhost:3000");
    
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('nextRoundIn', (seconds) => {
    countdown = seconds;
  });

    socket.on('zoomUpdate', ({ zoomLevel }) => {
    zoom = zoomLevel;
    });

    // Listen for events from the server
  socket.on('roundStart', (data) => {
    console.log('Received roundStart:', data); // Should show the image URL
    image = data.image;
    messages = [];
    zoom = 18.5;
  });

    socket.on('roundResult', (data) => {
      messages = [`${data.winner} guessed correctly! Answer: ${data.correctAnswer}`];
      scores = data.scores;
    });

    socket.on('scoreUpdate', (data) => {
      scores = data;
    });

    socket.on('wrongGuess', (data) => {
      // Optionally display a small notification for wrong guesses
      messages = [data.message];
    });
    socket.emit('setName', name);

  });

  function submitGuess() {
    if (guess.trim()) {
      socket.emit('guess', guess);
      guess = '';
    }
  }

</script>
<!-- add the modal to create a user name and then its testing time! -->
<main>
  <div class="game-container">
    {#if showModal}
    <div id="nameModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Enter your name</h2>
          <input type="text" bind:value={name} maxlength="20" placeholder="Your name" />
          <p class="error">{errorMsg}</p>
          <button on:click={submitName}>Join</button>
      </div>
    </div>
    {/if}
    <div class="sidebar">
    <h3>Players</h3>
    <ul>
      {#each Object.entries(scores) as [id, player]}
        <li>{player.name}: {player.score}</li>
      {/each}
    </ul>
  </div>
  <div class="main-content">
  {#if countdown !== null}
  <div class="countdown">Next round in: {countdown}</div>
{/if}
  <h1>Guess the Character!</h1>

{#if image}

  <div class="image-wrapper">
    <img src={image} alt="Guess!" style="transform: scale({zoom});" />
  </div>
{:else}
  <p>Loading image...</p>
{/if}
  
  <div>
    <input bind:value={guess} placeholder="Your guess" on:keydown={(e) => e.key === 'Enter' && submitGuess()} />
    <button on:click={submitGuess}>Submit</button>
  </div>

  {#if messages.length}
    <div class="win-lose-message">
      {#each messages as message}
        <p>{message}</p>
      {/each}
    </div>
  {/if}

  </div>

</div>
</main>

<style>

.win-lose-message{
  font-size: 1.4rem;
  color: #ffb347;
  text-shadow: 2px 2px 8px #232526, 0 0 10px #ffb34755;
  margin: 1rem 0;
  padding: 1rem 1rem;
  border-radius: 14px;
  background: rgb(41, 40, 40, 0.85);
  font-weight: bold;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 12px #ffb34722;
  
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgb(85, 84, 84);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: sans-serif;
  color: #ef940a;
}

.error {
  color: red;
  font-size: 0.9rem;
}
.game-container {
  width: 60svw;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  justify-items: center;
}

/* make a count down that is a bit fun and fits a gaming guessing game */
.countdown {
  font-size: 2rem;
  color: #ffb347;
  text-shadow: 2px 2px 8px #232526, 0 0 10px #ffb34755;
  margin-bottom: 1.2rem;
  padding: 1rem 2rem;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(20, 89, 66, 0.85), rgba(15, 82, 98, 0.65));
  animation: pulse 1s infinite alternate;
  font-weight: bold;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 12px #ffb34722;
  border: 1.5px solid #ffb34755;
  transition: box-shadow 0.2s, background 0.2s;
}

@keyframes pulse {
  from { box-shadow: 0 0 10px #ffb34755; }
  to   { box-shadow: 0 0 24px #ffb347cc; }
}

@media (max-width: 600px) {
  .countdown {
    font-size: 1.3rem;
    padding: 0.5rem 0.7rem;
    border-radius: 10px;
  }
}
.main-content {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  justify-content: space-between;
  align-items: center;
  flex: 2;
}

ul{
  list-style: none;
  padding: 0;
  margin: 0;
  text-decoration: underline ;
}
.sidebar {
  flex: 1;
  align-self: left;
  flex-direction: column;
  height: 420px;
  max-width: 240px;
  min-width: 140px;
  border-radius: 14px;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(120deg, rgba(42, 72, 63, 0.7), rgba(82, 72, 57, 0.53) 80%, rgba(30,30,60,0.5));
  border-right: 2px solid #ffb34755;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  padding: 1.2rem 1rem;
  margin-bottom: 1rem;
  color: #ffb347;
}
.sidebar h3 {
  color: #ffb347;
  margin-bottom: 1rem;
  font-size: 1.1em;
  letter-spacing: 0.04em;
}
.sidebar ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
.sidebar li {
  margin-bottom: 0.7em;
  padding: 0.4em 0.6em;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
}
.sidebar li:hover {
  background: rgba(255,179,71,0.13);
  color: #ffb347;
}
  .image-wrapper {
    width: 100%;
    max-width: 420px;
    height: 420px;
    overflow: hidden;
    margin: 1.5rem auto 1rem auto;
    border-radius: 18px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.22);
    background: linear-gradient(120deg, #232526 0%, #414345 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.3s, background 0.3s;
  }
  .image-wrapper:hover {
    box-shadow: 0 8px 32px #ffb34733, 0 4px 24px rgba(0,0,0,0.22);
    
  }

  img {
    transition: transform 0.5s cubic-bezier(.4,2,.3,1), box-shadow 0.3s;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(255,179,71,0.08);
  }

  main {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    width: 100%;
    margin: auto;
    text-align: center;
    font-family: sans-serif;
  }
  h1 {
    font-size: clamp(1.1rem, 1vw + 1.2rem, 3rem);
    color: #fff;
    margin-bottom: 1rem;
  }

  input {
    margin-top: 2rem;
    padding: 1em;
    margin-right: 0.5em;
    color: aqua;
    border-radius: 10px;
  }

  input[type="text"]{
  margin-top: 1.2rem;
  padding: 1em;
  margin-right: 0.5em;
  border-radius: 18px;
  border: none;
  background: #232526;
  color: #ffb347;
  font-size: 1.1em;
  outline: 2px solid #ffb34733;
  transition: outline 0.2s, box-shadow 0.2s;
  width: 220px;
  max-width: 80vw;
  box-shadow: 0 2px 8px #ffb34722;
}
input[type="text"]:focus {
  outline: 2px solid #ffb347;
  box-shadow: 0 4px 16px #ffb34755;
  border-radius: 15px;
}

button {
  background: linear-gradient(90deg, #232526 30%, #ffb347 170%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7em 2em;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px #ffb34733;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  margin-left: 0.5em;
}
button:hover {
  
  
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px #ffb34755;
}

  @media (max-width: 600px) {
  .image-wrapper {
    max-width: 95vw;
    border-radius: 10px;
  }
}
</style>