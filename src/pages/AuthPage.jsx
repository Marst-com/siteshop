import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: form.name,
          email: form.email,
          role: form.role,
          createdAt: new Date(),
        });
      }
      nav('/');
    } catch (e) {
      const msg = {
        'auth/email-already-in-use': '이미 사용 중인 이메일이에요.',
        'auth/wrong-password': '비밀번호가 틀렸어요.',
        'auth/user-not-found': '가입된 계정이 없어요.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
        'auth/invalid-credential': '이메일 또는 비밀번호가 잘못됐어요.',
      }[e.code] || '오류가 발생했어요. 다시 시도해주세요.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">DMSS</div>
        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>로그인</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>회원가입</button>
        </div>

        {!isLogin && (
          <input name="name" placeholder="이름" value={form.name} onChange={handle} />
        )}
        <input name="email" type="email" placeholder="이메일" value={form.email} onChange={handle} />
        <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handle}
          onKeyDown={e => e.key === 'Enter' && submit()} />

        {!isLogin && (
          <div className="role-select">
            <label>
              <input type="radio" name="role" value="buyer" checked={form.role === 'buyer'} onChange={handle} />
              구매자
            </label>
            <label>
              <input type="radio" name="role" value="seller" checked={form.role === 'seller'} onChange={handle} />
              판매자
            </label>
          </div>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? '처리 중...' : isLogin ? '로그인' : '가입하기'}
        </button>
      </div>
    </div>
  );
}
