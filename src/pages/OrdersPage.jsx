import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  '주문완료': '#3b82f6',
  '배송중': '#f59e0b',
  '배송완료': '#10b981',
  '취소': '#ef4444',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="page"><div className="loading">불러오는 중...</div></div>;

  return (
    <div className="page">
      <h2 className="page-title">주문 내역</h2>
      {orders.length === 0 ? (
        <div className="empty">주문 내역이 없어요.</div>
      ) : (
        <div className="order-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-date">
                  {order.createdAt?.toDate().toLocaleDateString('ko-KR')}
                </span>
                <span className="order-status" style={{ color: STATUS_COLOR[order.status] }}>
                  {order.status}
                </span>
              </div>
              <div className="order-items">
                {order.items?.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                총 {order.total.toLocaleString()}원 · {order.paymentMethod}
              </div>
              <div className="order-addr">📦 {order.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
