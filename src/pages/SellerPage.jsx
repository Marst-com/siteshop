import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['식품', '의류', '전자기기', '생활용품', '도서', '기타'];

export default function SellerPage() {
  const { user, userRole } = useAuth();
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '기타', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userRole && userRole !== 'seller' && userRole !== 'admin') {
      nav('/');
    }
  }, [userRole]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, [user]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.price) { setMsg('상품명과 가격은 필수예요.'); return; }
    setLoading(true);
    const price = Number(form.price);
    if (isNaN(price) || price < 0) { setMsg('가격을 올바르게 입력해주세요.'); setLoading(false); return; }

    const newDoc = await addDoc(collection(db, 'products'), {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      imageUrl: form.imageUrl,
      sellerId: user.uid,
      sellerName: user.displayName,
      createdAt: serverTimestamp(),
    });
    setProducts(p => [...p, { id: newDoc.id, ...form, price }]);
    setForm({ name: '', description: '', price: '', category: '기타', imageUrl: '' });
    setMsg('상품이 등록됐어요!');
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const remove = async (id) => {
    if (!confirm('삭제할까요?')) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="page">
      <h2 className="page-title">내 상품 관리</h2>

      <div className="seller-form">
        <h3>새 상품 등록</h3>
        <input name="name" placeholder="상품명" value={form.name} onChange={handle} />
        <textarea name="description" placeholder="상품 설명" value={form.description} onChange={handle} />
        <input name="price" type="number" placeholder="가격 (0 = 무료)" value={form.price} onChange={handle} />
        <select name="category" value={form.category} onChange={handle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input name="imageUrl" placeholder="이미지 URL (선택)" value={form.imageUrl} onChange={handle} />
        {msg && <p className="seller-msg">{msg}</p>}
        <button onClick={submit} disabled={loading}>{loading ? '등록 중...' : '등록하기'}</button>
      </div>

      <div className="seller-products">
        <h3>등록한 상품 ({products.length}개)</h3>
        {products.map(p => (
          <div key={p.id} className="seller-product-row">
            <div>
              <strong>{p.name}</strong>
              <span>{p.price === 0 ? ' · 무료' : ` · ${Number(p.price).toLocaleString()}원`}</span>
              <span className="product-cat"> · {p.category}</span>
            </div>
            <button className="delete-btn" onClick={() => remove(p.id)}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
