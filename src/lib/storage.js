// src/lib/storage.js
const KEYS = {
  cart: 'cart',
  user: 'user',
  orders: 'orders',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] write error', e);
  }
}

function emit(name) {
  window.dispatchEvent(new Event(name));
}

const uid = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ============ CART ============ */
export const getCart = () => read(KEYS.cart, []);

export const setCart = (cart) => {
  write(KEYS.cart, cart);
  emit('cart:updated');
};

export const clearCart = () => setCart([]);

export const addToCart = (product) => {
  const cart = getCart();
  const existing = cart.find((i) => String(i.id) === String(product.id));
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency || '₽',
      image: product.images?.[0] ?? null,
      quantity: 1,
    });
  }
  setCart(cart);
};

/* ============ USER ============ */
export const getUser = () => read(KEYS.user, null);

export const setUser = (user) => {
  write(KEYS.user, user);
  emit('user:updated');
};

export const clearUser = () => {
  localStorage.removeItem(KEYS.user);
  emit('user:updated');
};

/* ============ ORDERS ============ */
export const getOrders = () => read(KEYS.orders, []);

export const getOrdersByUser = (userId) =>
  getOrders().filter((o) => String(o.userId) === String(userId));

export const createOrder = (payload) => {
  const orders = getOrders();
  const order = {
    id: uid(),
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    ...payload,
  };
  orders.unshift(order);
  write(KEYS.orders, orders);
  emit('orders:updated');
  return order;
};