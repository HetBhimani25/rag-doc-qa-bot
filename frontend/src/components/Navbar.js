import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar({ activeSession }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <span style={styles.brandBlack}>RAG</span>
        <span style={styles.brandPurple}>DocBot</span>
      </Link>
      <div style={styles.right}>
        <span style={styles.navBadge}>LangChain</span>
        <span style={styles.navBadge}>ChromaDB</span>
        <span style={styles.navBadge}>Groq</span>
        <Link to="/bookmarks" state={{ session: activeSession }} style={styles.bookmarkBtn}>⭐ Bookmarks</Link>
        <span style={styles.userChip}>👤 {user?.name}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: '#ede8f5', padding: '0 40px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0f0a1e', position: 'sticky', top: 0, zIndex: 100 },
  brand: { fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', textDecoration: 'none' },
  brandBlack: { color: '#0f0a1e' },
  brandPurple: { color: '#7c3aed' },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  navBadge: { padding: '4px 12px', background: '#f3effe', border: '1.5px solid #a78bca', borderRadius: '20px', color: '#7c3aed', fontSize: '12px', fontWeight: '600' },
  bookmarkBtn: { padding: '6px 14px', background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '8px', color: '#0f0a1e', fontSize: '13px', fontWeight: '700', textDecoration: 'none', boxShadow: '2px 2px 0px #0f0a1e' },
  userChip: { fontSize: '13px', color: '#4a3f6b', fontWeight: '600' },
  logoutBtn: { padding: '6px 14px', background: 'transparent', border: '2px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
};