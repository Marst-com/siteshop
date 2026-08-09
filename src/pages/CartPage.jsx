import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, total } = useCart();
  const nav = useNavigate();

  if (cart.length === 0) return (
    <div className="page">
      <div className="empty">장바구니가 비어있어요.</div>
    </div>
  );

  return (
    <div className="page">
      <h2 className="page-title">장바구니</h2>
      <div className="cart-list">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-img">
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} />
                : <div className="no-img">🛍️</div>
              }
            </div>
            <div className="cart-info">
              <h4>{item.name}</h4>
              <span>{item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}</span>
            </div>
            <div className="cart-qty">
              <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
            </div>
            <button className="cart-remove" onClick={() => removeFromCart(item.id)}>삭제</button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          총 금액: <strong>{total.toLocaleString()}원</strong>
        </div>
        <button className="checkout-btn" onClick={() => nav('/checkout')}>
          결제하기
        </button>
      </div>
    </div>
  );
}
