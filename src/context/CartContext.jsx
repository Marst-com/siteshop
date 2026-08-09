import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  doc, setDoc, deleteDoc, onSnapshot, collection
} from 'firebase/firestore';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (!user) { setCart([]); return; }
    const ref = collection(db, 'cart', user.uid, 'items');
    const unsub = onSnapshot(ref, snap => {
      setCart(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const addToCart = async (product) => {
    if (!user) return;
    const ref = doc(db, 'cart', user.uid, 'items', product.id);
    const existing = cart.find(c => c.id === product.id);
    await setDoc(ref, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      quantity: (existing?.quantity || 0) + 1,
    });
  };

  const removeFromCart = async (productId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'cart', user.uid, 'items', productId));
  };

  const updateQty = async (productId, qty) => {
    if (!user || qty < 1) return;
    const ref = doc(db, 'cart', user.uid, 'items', productId);
    const item = cart.find(c => c.id === productId);
    if (item) await setDoc(ref, { ...item, quantity: qty });
  };

  const clearCart = async () => {
    if (!user) return;
    await Promise.all(cart.map(item =>
      deleteDoc(doc(db, 'cart', user.uid, 'items', item.id))
    ));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
