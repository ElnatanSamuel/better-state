<script lang="ts">
  import { state, derived, resource, toStore, resourceToStore } from 'better-state/svelte';

  // Create global state
  const countState = state(0);
  const multiplierState = state(2);

  // Create derived state
  const resultState = derived(() => countState.value * multiplierState.value);

  // Create async resource
  const userDataResource = resource(async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
    return response.json();
  });

  // Convert to Svelte stores
  const count = toStore(countState);
  const multiplier = toStore(multiplierState);
  const result = toStore(resultState);
  const user = resourceToStore(userDataResource);
</script>

<main>
  <h1>Better State - Svelte Example</h1>

  <!-- Counter Example -->
  <div class="section">
    <h2>Counter Example</h2>
    <div>
      <p>Count: {$count}</p>
      <p>Multiplier: {$multiplier}</p>
      <p>Result: {$result}</p>
    </div>
    <div class="buttons">
      <button on:click={() => countState.value++}>Increment Count</button>
      <button on:click={() => countState.value--}>Decrement Count</button>
      <button on:click={() => multiplierState.value++}>Increase Multiplier</button>
    </div>
  </div>

  <hr />

  <!-- User Profile Example -->
  <div class="section">
    <h2>User Profile</h2>
    {#if $user.loading}
      <div>Loading user data...</div>
    {:else if $user.error}
      <div class="error">
        Error: {$user.error.message}
        <button on:click={$user.refresh}>Retry</button>
      </div>
    {:else}
      <div>
        <p><strong>Name:</strong> {$user.data?.name}</p>
        <p><strong>Email:</strong> {$user.data?.email}</p>
        <p><strong>Username:</strong> {$user.data?.username}</p>
        <button on:click={$user.refresh}>Refresh Data</button>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    font-family: sans-serif;
  }

  h1 {
    padding: 20px;
  }

  .section {
    padding: 20px;
  }

  .buttons {
    margin-top: 10px;
  }

  button {
    padding: 8px 16px;
    margin-right: 10px;
    cursor: pointer;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
  }

  button:hover {
    background-color: #45a049;
  }

  .error {
    color: red;
  }

  hr {
    margin: 20px;
    border: none;
    border-top: 1px solid #ccc;
  }
</style>
