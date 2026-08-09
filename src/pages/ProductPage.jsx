import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp, updateDoc, increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const pSnap = await getDoc(doc(db, 'products', id));
      if (!pSnap.exists()) { nav('/'); return; }
      const p = { id: pSnap.id, ...pSnap.data() };
      setProduct(p);

      // 판매자 정보
      const sSnap = await getDoc(doc(db, 'users', p.sellerId));
      if (sSnap.exists()) setSeller({ id: sSnap.id, ...sSnap.data() });

      // 댓글
      const cSnap = await getDocs(query(collection(db, 'products', id, 'comments'), orderBy('createdAt', 'desc')));
      setComments(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleAddToCart = () => {
    if (!user) { nav('/auth'); return; }
    const price = product.discountPrice != null ? product.discountPrice : product.price;
    addToCart({ ...product, price });
    alert('장바구니에 담겼어요!');
  };

  const handleBuyNow = () => {
    if (!user) { nav('/auth'); return; }
    const price = product.discountPrice != null ? product.discountPrice : product.price;
    addToCart({ ...product, price });
    nav('/checkout');
  };

  const submitComment = async () => {
    if (!user) { nav('/auth'); return; }
    if (!commentText.trim()) return;
    const newComment = {
      userId: user.uid,
      userName: user.displayName || user.email,
      text: commentText,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'products', id, 'comments'), newComment);
    setComments(prev => [{ id: ref.id, ...newComment, createdAt: { toDate: () => new Date() } }, ...prev]);
    setCommentText('');
  };

  if (loading) return <div className="page"><div className="loading">불러오는 중...</div></div>;
  if (!product) return null;

  const displayPrice = product.discountPrice != null ? product.discountPrice : product.price;
  const discountRate = product.discountPrice != null
    ? Math.round((1 - product.discountPrice / product.price) * 100) : null;

  return (
    <div className="page">
      <div className="product-detail">
        {/* 이미지 */}
        <div className="detail-img">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} />
            : <div className="no-img-large">미리보기 없음</div>
          }
          {discountRate && <span className="discount-badge-lg">{discountRate}% OFF</span>}
        </div>

        {/* 상품 정보 */}
        <div className="detail-info">
          <span className="product-cat">{product.category}</span>
          <h1 className="detail-title">{product.name}</h1>

          {/* 판매자 */}
          <div className="detail-seller">
            <span>판매자: <strong>{seller?.name || '알 수 없음'}</strong></span>
            {seller?.verified && <span className="verified-badge">✓ 인증</span>}
          </div>

          {/* 가격 */}
          <div className="detail-price-wrap">
            {discountRate && (
              <div className="detail-original">{product.price.toLocaleString()}원</div>
            )}
            <div className="detail-price">
              {displayPrice === 0 ? '무료' : `${displayPrice.toLocaleString()}원`}
              {discountRate && <span className="detail-discount-rate"> {discountRate}% 할인</span>}
            </div>
            {displayPrice > 0 && (
              <div className="detail-point">
                적립 포인트: {Math.floor(displayPrice / 100).toLocaleString()}P
              </div>
            )}
          </div>

          {/* 판매량 */}
          <div className="detail-sales">🔥 {product.salesCount || 0}개 판매됨</div>

          {/* 버튼 */}
          <div className="detail-btns">
            <button className="cart-btn" onClick={handleAddToCart}>장바구니 담기</button>
            <button className="buy-btn" onClick={handleBuyNow}>바로 구매</button>
          </div>

          {/* 설명 */}
          <div className="detail-desc">
            <h3>상품 설명</h3>
            <p>{product.description || '설명이 없어요.'}</p>
          </div>
        </div>
      </div>

      {/* 댓글 */}
      <div className="comment-section">
        <h3>댓글 ({comments.length})</h3>

        {user ? (
          <div className="comment-input-wrap">
            <input
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
            />
            <button onClick={submitComment}>등록</button>
          </div>
        ) : (
          <p className="comment-login-msg" onClick={() => nav('/auth')}>
            댓글을 달려면 <span>로그인</span>이 필요해요.
          </p>
        )}

        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="empty">아직 댓글이 없어요.</div>
          ) : comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <strong>{c.userName}</strong>
                <span>{c.createdAt?.toDate?.().toLocaleDateString('ko-KR')}</span>
              </div>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
