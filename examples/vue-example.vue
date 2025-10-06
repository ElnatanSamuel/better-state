<template>
  <div>
    <h1 style="padding: 20px; font-family: sans-serif">
      Better State - Vue Example
    </h1>

    <!-- Counter Example -->
    <div style="padding: 20px; font-family: sans-serif">
      <h2>Counter Example</h2>
      <div>
        <p>Count: {{ count }}</p>
        <p>Multiplier: {{ multiplier }}</p>
        <p>Result: {{ result }}</p>
      </div>
      <div style="margin-top: 10px">
        <button @click="countState.value++">Increment Count</button>
        <button @click="countState.value--" style="margin-left: 10px">
          Decrement Count
        </button>
        <button @click="multiplierState.value++" style="margin-left: 10px">
          Increase Multiplier
        </button>
      </div>
    </div>

    <hr />

    <!-- User Profile Example -->
    <div style="padding: 20px; font-family: sans-serif">
      <h2>User Profile</h2>
      <div v-if="user.loading">Loading user data...</div>
      <div v-else-if="user.error" style="color: red">
        Error: {{ user.error.message }}
        <button @click="user.refresh" style="margin-left: 10px">Retry</button>
      </div>
      <div v-else>
        <p><strong>Name:</strong> {{ user.data?.name }}</p>
        <p><strong>Email:</strong> {{ user.data?.email }}</p>
        <p><strong>Username:</strong> {{ user.data?.username }}</p>
        <button @click="user.refresh">Refresh Data</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useState, useResource } from 'better-state/vue';
import { state, derived, resource } from 'better-state';

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

// Use in Vue
const count = useState(countState);
const multiplier = useState(multiplierState);
const result = useState(resultState);
const user = useResource(userDataResource);
</script>

<style scoped>
button {
  padding: 8px 16px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}

hr {
  margin: 20px;
  border: none;
  border-top: 1px solid #ccc;
}
</style>
