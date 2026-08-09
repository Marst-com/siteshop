import { useEffect, useState } from 'react';
import {
  collection, addDoc, getDocs, query, where,
  deleteDoc, doc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['쇼핑몰형', '포트폴리오형', '랜딩페이지', '예약시스템', '커뮤니티', '관리자대시보드', '게임', '기타'];

export default function SellerPage() {
  const { user, userRole } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('products'); // 'products' | 'refunds'
  const [products, setProducts] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '', category: '기타', imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userRole && userRole !== 'seller' && userRole !== 'admin') nav('/');
  }, [userRole]);

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    const fetchRefunds = async () => {
      const q = query(collection(db, 'refunds'), where('sellerId', '==', user.uid), where('status', '==', '대기중'));
      const snap = await getDocs(q);
      setRefunds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchProducts();
    fetchRefunds();
  }, [user]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || form.price === '') { setMsg('상품명과 가격은 필수예요.'); return; }
    setLoading(true);
    const price = Number(form.price);
    const discountPrice = form.discountPrice !== '' ? Number(form.discountPrice) : null;
    if (isNaN(price) || price < 0) { setMsg('가격을 올바르게 입력해주세요.'); setLoading(false); return; }
    if (discountPrice !== null && (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
      setMsg('할인가는 정가보다 낮아야 해요.'); setLoading(false); return;
    }
    const newDoc = await addDoc(collection(db, 'products'), {
      name: form.name,
      description: form.description,
      price,
      ...(discountPrice !== null && { discountPrice }),
      category: form.category,
      imageUrl: form.imageUrl,
      sellerId: user.uid,
      sellerName: user.displayName,
      salesCount: 0,
      createdAt: serverTimestamp(),
    });
    setProducts(p => [...p, { id: newDoc.id, ...form, price, discountPrice }]);
    setForm({ name: '', description: '', price: '', discountPrice: '', category: '기타', imageUrl: '' });
    setMsg('상품이 등록됐어요!');
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const remove = async (id) => {
    if (!confirm('삭제할까요?')) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts(p => p.filter(x => x.id !== id));
  };

  const handleRefund = async (refund, action) => {
    const status = action === 'approve' ? '승인' : '거절';
    await updateDoc(doc(db, 'refunds', refund.id), { status });

    // 환불 승인 시 주문 상태도 변경 + 포인트 차감
    if (action === 'approve') {
      await updateDoc(doc(db, 'orders', refund.orderId), { status: '환불완료' });
      // 포인트 차감 (적립됐던 포인트 회수)
      const userRef = doc(db, 'users', refund.userId);
      const userSnap = await getDocs(query(collection(db, 'users')));
      const userData = userSnap.docs.find(d => d.id === refund.userId)?.data();
      if (userData) {
        const deduct = Math.floor(refund.refundAmount / 100);
        await updateDoc(userRef, { points: Math.max(0, (userData.points || 0) - deduct) });
      }
    }
    setRefunds(r => r.filter(x => x.id !== refund.id));
  };

  return (
    <div className="page">
      <h2 className="page-title">판매자 관리</h2>

      <div className="seller-tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>상품 관리</button>
        <button className={tab === 'refunds' ? 'active' : ''} onClick={() => setTab('refunds')}>
          환불 요청 {refunds.length > 0 && <span className="badge">{refunds.length}</span>}
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="seller-form">
            <h3>새 상품 등록</h3>
            <input name="name" placeholder="사이트 이름" value={form.name} onChange={handle} />
            <textarea name="description" placeholder="사이트 설명" value={form.description} onChange={handle} />
            <input name="price" type="number" placeholder="정가 (0 = 무료)" value={form.price} onChange={handle} />
            <input name="discountPrice" type="number" placeholder="할인가 (선택)" value={form.discountPrice} onChange={handle} />
            <select name="category" value={form.category} onChange={handle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input name="imageUrl" placeholder="미리보기 이미지 URL (선택)" value={form.imageUrl} onChange={handle} />
            {msg && <p className="seller-msg">{msg}</p>}
            <button onClick={submit} disabled={loading}>{loading ? '등록 중...' : '등록하기'}</button>
          </div>

          <div className="seller-products">
            <h3>등록한 사이트 ({products.length}개)</h3>
            {products.map(p => (
              <div key={p.id} className="seller-product-row">
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.price === 0 ? ' · 무료' : ` · ${Number(p.price).toLocaleString()}원`}</span>
                  {p.discountPrice != null && <span className="discount-text"> → {Number(p.discountPrice).toLocaleString()}원</span>}
                  <span className="product-cat"> · {p.category}</span>
                  <span className="sales-count"> · {p.salesCount || 0}개 판매</span>
                </div>
                <button className="delete-btn" onClick={() => remove(p.id)}>삭제</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'refunds' && (
        <div className="refund-list">
          {refunds.length === 0 ? (
            <div className="empty">대기 중인 환불 요청이 없어요.</div>
          ) : refunds.map(r => (
            <div key={r.id} className="refund-card">
              <div className="refund-info">
                <strong>{r.productName}</strong>
                <span> · {r.refundAmount.toLocaleString()}원</span>
                <p className="refund-reason">사유: {r.reason}</p>
                <span className="refund-user">구매자: {r.userName}</span>
              </div>
              <div className="refund-actions">
                <button className="approve-btn" onClick={() => handleRefund(r, 'approve')}>승인</button>
                <button className="reject-btn" onClick={() => handleRefund(r, 'reject')}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
