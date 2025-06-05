import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (variantId: string) => number;
}

// Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.variantId === action.payload.variantId
      );

      let updatedItems: CartItem[];
      
      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + 1,
          existingItem.maxStock
        );
        updatedItems = state.items.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          ...action.payload,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          quantity: 1,
        };
        updatedItems = [...state.items, newItem];
      }

      return calculateCartTotals(updatedItems);
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      return calculateCartTotals(updatedItems);
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        const updatedItems = state.items.filter(item => item.id !== itemId);
        return calculateCartTotals(updatedItems);
      }

      const updatedItems = state.items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      );
      return calculateCartTotals(updatedItems);
    }

    case 'CLEAR_CART': {
      return { items: [], total: 0, itemCount: 0 };
    }

    case 'LOAD_CART': {
      return calculateCartTotals(action.payload);
    }

    default:
      return state;
  }
}

// Helper function
function calculateCartTotals(items: CartItem[]): CartState {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { items, total, itemCount };
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dressforp-cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dressforp-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (variantId: string) => {
    const item = state.items.find(item => item.variantId === variantId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
