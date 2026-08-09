import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Navbar() {
  const { user, userRole, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) { setPoints(0); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setPoints(snap.data()?.points || 0);
    });
  }, [user]);

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">DMSS</Link>

      <div className="nav-links">
        {user && <span className="nav-points">🎁 {points.toLocaleString()}P</span>}
        {user && (
          <Link to="/cart" className="nav-cart">
            🛒 {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </Link>
        )}
        {user && <Link to="/orders">주문내역</Link>}
        {(userRole === 'seller' || userRole === 'admin') && <Link to="/seller">상품관리</Link>}
        {userRole === 'admin' && <Link to="/admin">관리자</Link>}
        {user ? (
          <button className="nav-btn" onClick={handleLogout}>로그아웃</button>
        ) : (
          <Link to="/auth" className="nav-btn">로그인</Link>
        )}
      </div>
    </nav>
  );
}
