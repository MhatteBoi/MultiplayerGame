<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  let socket;
  let image = '';
  let guess = '';
  let messages = [];
  let scores = {};
  let zoom = 18.5; // Start zoomed in

  

  onMount(() => {
    // Connect to the server
    socket = io("http://localhost:3000");
    
    socket.on('connect', () => {
      console.log('Connected to server');
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


  });

  function submitGuess() {
    if (guess.trim()) {
      socket.emit('guess', guess);
      guess = '';
    }
  }

</script>

<main>
  <h1>Guess the Character Part! Krille med sin pille, johan sitter på toan</h1>
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

  <h2>Scores</h2>
  <ul>
    {#each Object.entries(scores) as [id, player]}
      <li>{player.name}: {player.score}</li>
    {/each}
  </ul>
</main>

<style>

  .image-wrapper {
    width: 400px;
    height: 400px;
    overflow: hidden;
    margin: auto;
  }

  img {
    transition: transform 0.5s ease-out;
    width: 100%;
    height: auto;
  }

  main {
    max-width: 600px;
    margin: auto;
    text-align: center;
    font-family: sans-serif;
  }

  img {
    margin-bottom: 20px;
  }

  input {
    padding: 0.5em;
    margin-right: 0.5em;
  }
</style>