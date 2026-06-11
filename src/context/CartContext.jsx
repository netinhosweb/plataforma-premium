import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'labprime_cart_v1';

function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate shape: must have items array
    if (!Array.isArray(parsed?.items)) return null;
    return { items: parsed.items, isOpen: false }; // never reopen drawer on refresh
  } catch {
    return null;
  }
}

function persistCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // Ignore storage quota errors silently
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== id) };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    default:
      return state;
  }
}

// ─── Initial state factory (hydrates from localStorage) ───────────────────────
const baseState = { items: [], isOpen: false };

function initState() {
  return loadPersistedCart() ?? baseState;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initState);

  // ── Persist items whenever they change ────────────────────────────────────
  useEffect(() => {
    persistCart(state.items);
  }, [state.items]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    dispatch({ type: 'OPEN_CART' });
  }, []);

  const removeItem      = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', payload: id }), []);
  const updateQuantity  = useCallback((id, qty) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: qty } }), []);
  const clearCart       = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const openCart        = useCallback(() => dispatch({ type: 'OPEN_CART' }), []);
  const closeCart       = useCallback(() => dispatch({ type: 'CLOSE_CART' }), []);
  const toggleCart      = useCallback(() => dispatch({ type: 'TOGGLE_CART' }), []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const subtotal  = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        subtotal,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
