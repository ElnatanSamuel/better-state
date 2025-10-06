/**
 * Vanilla JavaScript/TypeScript Example - Better State
 * 
 * This example demonstrates how to use Better State without any framework
 */

import { state, derived, resource, transaction } from 'better-state';

// Create state
const count = state(0);
const multiplier = state(2);

// Create derived state
const result = derived(() => count.value * multiplier.value);

// Subscribe to changes
console.log('Initial count:', count.value);
console.log('Initial result:', result.value);

count.subscribe((value) => {
  console.log('Count changed to:', value);
});

result.subscribe((value) => {
  console.log('Result changed to:', value);
});

// Update values
count.value = 5;
multiplier.value = 3;

// Use transactions to batch updates
transaction(() => {
  count.value = 10;
  multiplier.value = 5;
});
// Only one notification will be sent

// Create async resource
const userData = resource(async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
  return response.json();
});

// Subscribe to resource changes
userData.subscribe(({ data, loading, error }) => {
  if (loading) {
    console.log('Loading user data...');
  } else if (error) {
    console.error('Error loading user:', error);
  } else {
    console.log('User data loaded:', data);
  }
});

// Refresh resource after 5 seconds
setTimeout(() => {
  console.log('Refreshing user data...');
  userData.refresh();
}, 5000);

// Example: Shopping cart
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const cartItems = state<CartItem[]>([]);
const discountPercent = state(0);

const subtotal = derived(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const discount = derived(() => {
  return subtotal.value * (discountPercent.value / 100);
});

const total = derived(() => {
  return subtotal.value - discount.value;
});

// Subscribe to total changes
total.subscribe((value) => {
  console.log('Cart total:', value.toFixed(2));
});

// Add items to cart
cartItems.value = [
  { id: 1, name: 'Widget', price: 10, quantity: 2 },
  { id: 2, name: 'Gadget', price: 15, quantity: 1 },
];

// Apply discount
discountPercent.value = 10;

// Update quantity using transaction
transaction(() => {
  const items = [...cartItems.value];
  items[0].quantity = 3;
  cartItems.value = items;
});

export { count, multiplier, result, userData, cartItems, total };
