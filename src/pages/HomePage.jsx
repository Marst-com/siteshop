import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['전체', '식품', '의류', '전자기기', '생활용품', '도서', '기타'];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = products.filter(p => {
    const matchCat = category === '전체' || p.category === category;
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page">
      <div className="search-bar">
        <input
          placeholder="상품 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={category === c ? 'active' : ''}
            onClick={() => setCategory(c)}
          >{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">상품이 없어요. 판매자가 등록하면 여기 나타나요!</div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-img">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} />
                  : <div className="no-img">이미지 없음</div>
                }
              </div>
              <div className="product-info">
                <span className="product-cat">{p.category}</span>
                <h3>{p.name}</h3>
                <p className="product-desc">{p.description}</p>
                <div className="product-footer">
                  <span className="price">
                    {p.price === 0 ? '무료' : `${p.price.toLocaleString()}원`}
                  </span>
                  {user && (
                    <button onClick={() => addToCart(p)}>장바구니</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
