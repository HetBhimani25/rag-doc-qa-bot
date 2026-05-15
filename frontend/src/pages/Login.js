import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>RAG<span style={styles.purple}>DocBot</span></h1>
        <p style={styles.sub}>Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input style={styles.input} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p style={styles.link}>Don't have an account?{' '}
          <Link to="/register" style={styles.linkA}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#ede8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '8px 8px 0px #0f0a1e', textAlign: 'center' },
  logo: { fontSize: '48px', marginBottom: '8px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#0f0a1e', marginBottom: '6px', letterSpacing: '-0.5px' },
  purple: { color: '#7c3aed' },
  sub: { color: '#6b5e8a', fontSize: '14px', marginBottom: '24px' },
  input: { width: '100%', padding: '12px 16px', marginBottom: '12px', background: '#faf9ff', border: '2px solid #0f0a1e', borderRadius: '10px', color: '#0f0a1e', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', background: '#7c3aed', border: '2px solid #0f0a1e', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '3px 3px 0px #0f0a1e', marginTop: '4px' },
  link: { marginTop: '20px', color: '#6b5e8a', fontSize: '14px' },
  linkA: { color: '#7c3aed', textDecoration: 'none', fontWeight: '700' },
};