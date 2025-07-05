<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  let socket;
  let image = '';
  let guess = '';
  let messages = [];
  let scores = {};

  onMount(() => {
    // Connect to the server
    socket = io();

    // Listen for events from the server
    socket.on('roundStart', (data) => {
      image = data.image;
      messages = [];  // clear previous messages
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
  <h1>Guess the Character Part!</h1>
  {#if image}
    <img src={image} alt="Guess the character" style="max-width: 300px;"/>
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