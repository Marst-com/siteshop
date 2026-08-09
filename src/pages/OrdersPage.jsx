import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  '주문완료': '#3b82f6',
  '배송중': '#f59e0b',
  '배송완료': '#10b981',
  '환불완료': '#10b981',
  '취소': '#ef4444',
  '환불대기': '#f59e0b',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState(null); // { order, item }
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const submitRefund = async () => {
    if (!refundReason.trim()) { alert('환불 사유를 입력해주세요.'); return; }
    setSubmitting(true);
    const { order, item } = refundModal;
    await addDoc(collection(db, 'refunds'), {
      orderId: order.id,
      userId: user.uid,
      userName: user.displayName || user.email,
      sellerId: item.sellerId || '',
      productName: item.name,
      refundAmount: item.price * item.quantity,
      reason: refundReason,
      status: '대기중',
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    setRefundModal(null);
    setRefundReason('');
    alert('환불 신청이 완료됐어요. 판매자 승인 후 처리돼요.');
  };

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
                    <div>
                      <span>{item.name} × {item.quantity}</span>
                      <span> · {(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                    {order.status === '주문완료' && (
                      <button className="refund-req-btn" onClick={() => setRefundModal({ order, item })}>
                        환불신청
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="order-total">
                총 {order.total.toLocaleString()}원 · {order.paymentMethod}
              </div>
              <div className="order-point">🎁 적립 포인트: {Math.floor(order.total / 100)}P</div>
              {order.address && <div className="order-addr">📦 {order.address}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 환불 모달 */}
      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>환불 신청</h3>
            <p className="modal-product">{refundModal.item.name}</p>
            <p className="modal-amount">환불 금액: {(refundModal.item.price * refundModal.item.quantity).toLocaleString()}원</p>
            <textarea
              placeholder="환불 사유를 입력해주세요..."
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
            />
            <div className="modal-btns">
              <button onClick={() => setRefundModal(null)}>취소</button>
              <button className="approve-btn" onClick={submitRefund} disabled={submitting}>
                {submitting ? '신청 중...' : '신청하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
