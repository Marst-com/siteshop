import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SUPER_ADMIN_UID = 'SUPER_ADMIN_UID_HERE'; // 여기에 네 Firebase UID 넣어

export default function AdminPage() {
  const { user, userRole } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('verify'); // 'verify' | 'users'
  const [verifyRequests, setVerifyRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.uid === SUPER_ADMIN_UID;

  useEffect(() => {
    if (userRole && userRole !== 'admin') nav('/');
  }, [userRole]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // 인증 신청 목록
      const vSnap = await getDocs(query(collection(db, 'users'), where('verifyRequest', '==', true), where('verified', '==', false)));
      setVerifyRequests(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 전체 유저
      const uSnap = await getDocs(collection(db, 'users'));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const approveVerify = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { verified: true, verifyRequest: false });
    setVerifyRequests(r => r.filter(x => x.id !== uid));
    setUsers(u => u.map(x => x.id === uid ? { ...x, verified: true, verifyRequest: false } : x));
  };

  const rejectVerify = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { verifyRequest: false });
    setVerifyRequests(r => r.filter(x => x.id !== uid));
  };

  const revokeVerify = async (uid) => {
    if (!confirm('인증을 해제할까요?')) return;
    await updateDoc(doc(db, 'users', uid), { verified: false });
    setUsers(u => u.map(x => x.id === uid ? { ...x, verified: false } : x));
  };

  const setAdmin = async (uid, isAdmin) => {
    if (!isSuperAdmin) return;
    if (!confirm(isAdmin ? '관리자로 임명할까요?' : '관리자를 해제할까요?')) return;
    await updateDoc(doc(db, 'users', uid), { role: isAdmin ? 'admin' : 'buyer' });
    setUsers(u => u.map(x => x.id === uid ? { ...x, role: isAdmin ? 'admin' : 'buyer' } : x));
  };

  if (loading) return <div className="page"><div className="loading">불러오는 중...</div></div>;

  return (
    <div className="page">
      <h2 className="page-title">관리자 페이지</h2>

      <div className="seller-tabs">
        <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>
          인증 신청 {verifyRequests.length > 0 && <span className="badge">{verifyRequests.length}</span>}
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          유저 관리
        </button>
      </div>

      {tab === 'verify' && (
        <div className="refund-list">
          {verifyRequests.length === 0 ? (
            <div className="empty">대기 중인 인증 신청이 없어요.</div>
          ) : verifyRequests.map(u => (
            <div key={u.id} className="refund-card">
              <div className="refund-info">
                <strong>{u.name}</strong>
                <span> · {u.email}</span>
                <p className="refund-reason">역할: {u.role}</p>
              </div>
              <div className="refund-actions">
                <button className="approve-btn" onClick={() => approveVerify(u.id)}>승인</button>
                <button className="reject-btn" onClick={() => rejectVerify(u.id)}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-user-list">
          {users.map(u => (
            <div key={u.id} className="admin-user-row">
              <div>
                <strong>{u.name}</strong>
                {u.verified && <span className="verified-badge">✓ 인증</span>}
                <span className="product-cat"> · {u.role}</span>
                <span className="refund-user"> · {u.email}</span>
              </div>
              <div className="refund-actions">
                {u.verified
                  ? <button className="reject-btn" onClick={() => revokeVerify(u.id)}>인증해제</button>
                  : null
                }
                {isSuperAdmin && u.id !== user.uid && (
                  u.role === 'admin'
                    ? <button className="reject-btn" onClick={() => setAdmin(u.id, false)}>관리자해제</button>
                    : <button className="approve-btn" onClick={() => setAdmin(u.id, true)}>관리자임명</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
