<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  let socket;
  let image = '';
  let guess = '';
  let messages = [];
  let scores = {};
  let zoom = 18.5; // Start zoomed in
  let name = "Enter your name";
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
    <div>
      {#each messages as message}
        <p>{message}</p>
      {/each}
    </div>
  {/if}

  </div>

</div>
</main>

<style>


.game-container {
  width: 80svw;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

/* make a count down that is a bit fun and fits a gaming guessing game */
.countdown{
  font-size: 2rem;
  color: rgb(204, 106, 20);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 10px;
  background-color: rgba(20, 89, 66, 0.651);
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
  padding: 1rem;
  min-height: 500px;
  overflow-y: auto;
  background: rgba(4, 65, 48, 0.5);
  border-right: 2px solid #ccc;
}
  .image-wrapper {
    width: 500px;
    height: 500px;
    overflow: hidden;
    margin: auto;
  }

  img {
    transition: transform 0.5s ease-out;
    width: 100%;
    height: auto;
    margin-bottom: 20px;
  }

  main {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-width: 100%;
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
  }
</style>