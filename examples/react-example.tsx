/**
 * React Example - Better State
 *
 * This example demonstrates how to use Better State with React
 */

import React from "react";
import { use, useResource } from "@elnatan/better-state/react";
import { state, derived, resource } from "@elnatan/better-state";

// Create global state
const count = state(0);
const multiplier = state(2);

// Create derived state
const result = derived(() => count.value * multiplier.value);

// Create async resource
const userData = resource(async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/users/1");
  return response.json();
});

// Counter component
function Counter() {
  const currentCount = use(count);
  const currentMultiplier = use(multiplier);
  const currentResult = use(result);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Counter Example</h2>
      <div>
        <p>Count: {currentCount}</p>
        <p>Multiplier: {currentMultiplier}</p>
        <p>Result: {currentResult}</p>
      </div>
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => count.value++}>Increment Count</button>
        <button onClick={() => count.value--} style={{ marginLeft: "10px" }}>
          Decrement Count
        </button>
        <button
          onClick={() => multiplier.value++}
          style={{ marginLeft: "10px" }}
        >
          Increase Multiplier
        </button>
      </div>
    </div>
  );
}

// User profile component with async resource
function UserProfile() {
  const { data, loading, error, refresh } = useResource(userData);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading user data...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: {error.message}
        <button onClick={refresh} style={{ marginLeft: "10px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>User Profile</h2>
      <div>
        <p>
          <strong>Name:</strong> {data?.name}
        </p>
        <p>
          <strong>Email:</strong> {data?.email}
        </p>
        <p>
          <strong>Username:</strong> {data?.username}
        </p>
      </div>
      <button onClick={refresh}>Refresh Data</button>
    </div>
  );
}

// Main app
export function App() {
  return (
    <div>
      <h1 style={{ padding: "20px", fontFamily: "sans-serif" }}>
        Better State - React Example
      </h1>
      <Counter />
      <hr />
      <UserProfile />
    </div>
  );
}

export default App;
