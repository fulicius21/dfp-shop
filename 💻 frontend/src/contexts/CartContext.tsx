import React, { createContext, useContext, useReducer, useEffect } from 'react';

// -- Types --
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
  maxStock: number;
}

type NewCartItem = Omit<CartItem, 'id'>;

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

interface CartContextType extends CartState {
  addItem: (item: NewCartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  syncWithBackend: () => Promise<void>;
}

// -- Actions --
type CartAction =
  | { type: 'ADD_ITEM'; payload: NewCartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// -- Local Storage Key --
const CART_STORAGE_KEY = 'dressforp-cart';

// -- Helper functions --
function generateCartItemId(item: NewCartItem): string {
  return `${item.productId}-${item.size}-${item.color}`;
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to save cart to localStorage:', error);
  }
}

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load cart from localStorage:', error);
    return [];
  }
}

// -- Reducer --
function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartItem[];
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemId = generateCartItemId(action.payload);
      const existingItem = state.items.find(item => item.id === itemId);

      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, item.maxStock) }
            : item
        );
      } else {
        const newItem: CartItem = { ...action.payload, id: itemId };
        newItems = [...state.items, newItem];
      }
      saveCartToStorage(newItems);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    case 'REMOVE_ITEM': {
      newItems = state.items.filter(item => item.id !== action.payload);
      saveCartToStorage(newItems);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        newItems = state.items.filter(item => item.id !== itemId);
      } else {
        newItems = state.items.map(item =>
          item.id === itemId ? { ...item, quantity: Math.min(quantity, item.maxStock) } : item
        );
      }
      saveCartToStorage(newItems);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    case 'CLEAR_CART': {
      saveCartToStorage([]);
      return { ...state, items: [], total: 0, itemCount: 0 };
    }
    case 'LOAD_CART': {
      const items = action.payload;
      return {
        ...state,
        items,
        total: calculateTotal(items),
        itemCount: calculateItemCount(items),
      };
    }
    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.payload };
    }
    default:
      return state;
  }
}

// -- Initial State --
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

// -- Context & Provider --
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedItems = loadCartFromStorage();
    if (storedItems.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: storedItems });
    }
  }, []);

  // Backend sync placeholder
  const syncWithBackend = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      // Backend code hier einfügen (optional)
      // ...
      console.log('Cart sync with backend (placeholder - requires authentication)');
    } catch (error) {
      console.warn('Failed to sync cart with backend:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Synchronisierung fehlgeschlagen' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Actions
  const addItem = (item: NewCartItem) => dispatch({ type: 'ADD_ITEM', payload: item });
  const removeItem = (itemId: string) => dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  const updateQuantity = (itemId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const getItemQuantity = (itemId: string) =>
    state.items.find(item => item.id === itemId)?.quantity ?? 0;

  const contextValue: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    syncWithBackend,
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

// -- Custom Hook --
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
