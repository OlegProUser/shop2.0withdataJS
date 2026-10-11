// src/lib/storage.js
import { supabase } from './supabase'
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
// TODO(DB): заменить на GET /api/cart (по userId)
export const getCart = () => read(KEYS.cart, []);

// TODO(DB): PATCH /api/cart
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
// TODO(DB): GET /api/auth/me (httpOnly cookie)
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data.user
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

/* ============ ORDERS ============ */
// TODO(DB): GET /api/orders (для админа — все, для юзера — свои)
export const getOrders = () => read(KEYS.orders, []);

export const getOrdersByUser = (userId) =>
  getOrders().filter((o) => String(o.userId) === String(userId));

// TODO(DB): POST /api/orders  — там же создастся отправление в Почте России
export const createOrder = (payload) => {
  const orders = getOrders();
  const order = {
    id: uid(),
    status: 'CREATED', // CREATED | PAID | SENT | DELIVERED | CANCELLED
    createdAt: new Date().toISOString(),
    ...payload,
  };
  orders.unshift(order);
  write(KEYS.orders, orders);
  emit('orders:updated');
  return order;
};