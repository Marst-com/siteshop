import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, userRole, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">DMSS</Link>

      <div className="nav-links">
        {user && (
          <Link to="/cart" className="nav-cart">
            🛒 {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </Link>
        )}
        {user && (
          <Link to="/orders">주문내역</Link>
        )}
        {(userRole === 'seller' || userRole === 'admin') && (
          <Link to="/seller">상품관리</Link>
        )}
        {user ? (
          <button className="nav-btn" onClick={handleLogout}>로그아웃</button>
        ) : (
          <Link to="/auth" className="nav-btn">로그인</Link>
        )}
      </div>
    </nav>
  );
}
