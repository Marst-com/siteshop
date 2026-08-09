import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // 토스 테스트 키 (교체 필요)

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveOrder = async (paymentKey = null, method = '무료') => {
    const ref = await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      userName: user.displayName,
      items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      total,
      address: form.address,
      phone: form.phone,
      receiverName: form.name,
      status: '주문완료',
      paymentKey,
      paymentMethod: method,
      createdAt: serverTimestamp(),
    });
    await clearCart();
    nav(`/orders`);
  };

  const handleCheckout = async () => {
    if (!form.name || !form.phone || !form.address) {
      alert('배송 정보를 모두 입력해주세요.');
      return;
    }
    setLoading(true);

    // 0원이면 PG 스킵
    if (total === 0) {
      await saveOrder(null, '무료');
      return;
    }

    // 토스페이먼츠 결제창
    try {
      const { loadTossPayments } = await import('@tosspayments/payment-sdk');
      const toss = await loadTossPayments(TOSS_CLIENT_KEY);
      await toss.requestPayment('카드', {
        amount: total,
        orderId: `DMSS-${Date.now()}`,
        orderName: cart.length === 1 ? cart[0].name : `${cart[0].name} 외 ${cart.length - 1}건`,
        customerName: form.name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e) {
      alert('결제 중 오류가 발생했어요: ' + e.message);
      setLoading(false);
    }
  };

  if (cart.length === 0) return (
    <div className="page"><div className="empty">장바구니가 비어있어요.</div></div>
  );

  return (
    <div className="page">
      <h2 className="page-title">결제하기</h2>

      <div className="checkout-wrap">
        <div className="checkout-section">
          <h3>배송 정보</h3>
          <input name="name" placeholder="받는 분 이름" value={form.name} onChange={handle} />
          <input name="phone" placeholder="연락처 (010-0000-0000)" value={form.phone} onChange={handle} />
          <input name="address" placeholder="배송 주소" value={form.address} onChange={handle} />
        </div>

        <div className="checkout-section">
          <h3>주문 상품</h3>
          {cart.map(item => (
            <div key={item.id} className="checkout-item">
              <span>{item.name} × {item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString()}원</span>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="cart-total">
            결제 금액: <strong>{total === 0 ? '무료' : `${total.toLocaleString()}원`}</strong>
          </div>
          <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
            {loading ? '처리 중...' : total === 0 ? '무료 주문하기' : '카드 결제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
