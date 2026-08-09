import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['전체', '쇼핑몰형', '포트폴리오형', '랜딩페이지', '예약시스템', '커뮤니티', '관리자대시보드', '게임', '기타'];
const SORTS = [
  { label: '최신순', value: 'newest' },
  { label: '인기순', value: 'popular' },
  { label: '낮은가격순', value: 'priceLow' },
  { label: '높은가격순', value: 'priceHigh' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = products
    .filter(p => {
      const matchCat = category === '전체' || p.category === category;
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
      if (sort === 'priceLow') return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
      if (sort === 'priceHigh') return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
      return 0; // newest: 이미 createdAt desc로 정렬됨
    });

  const displayPrice = (p) => p.discountPrice != null ? p.discountPrice : p.price;
  const discountRate = (p) => p.discountPrice != null
    ? Math.round((1 - p.discountPrice / p.price) * 100) : null;

  return (
    <div className="page">
      <div className="search-bar">
        <input
          placeholder="사이트 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-bar">
        {CATEGORIES.map(c => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="sort-bar">
        {SORTS.map(s => (
          <button key={s.value} className={sort === s.value ? 'active' : ''} onClick={() => setSort(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">사이트가 없어요. 판매자가 등록하면 여기 나타나요!</div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => {
            const dp = displayPrice(p);
            const dr = discountRate(p);
            return (
              <div key={p.id} className="product-card" onClick={() => nav(`/product/${p.id}`)} style={{cursor:'pointer'}}>
                <div className="product-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} />
                    : <div className="no-img">미리보기 없음</div>
                  }
                  {dr && <span className="discount-badge">{dr}%</span>}
                </div>
                <div className="product-info">
                  <span className="product-cat">{p.category}</span>
                  <h3>{p.name}</h3>
                  <p className="product-desc">{p.description}</p>
                  {p.salesCount > 0 && (
                    <span className="sales-count">🔥 {p.salesCount}개 판매</span>
                  )}
                  <div className="product-footer">
                    <div className="price-wrap">
                      {dr && <span className="original-price">{p.price.toLocaleString()}원</span>}
                      <span className="price">
                        {dp === 0 ? '무료' : `${dp.toLocaleString()}원`}
                      </span>
                    </div>
                    {user && (
                      <button onClick={e => { e.stopPropagation(); addToCart({ ...p, price: dp }); }}>장바구니</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
