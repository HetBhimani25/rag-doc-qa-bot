import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getBookmarks, deleteBookmark } from '../services/api';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    try {
      const { data } = await getBookmarks();
      setBookmarks(data);
    } catch { toast.error('Failed to load bookmarks'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b._id !== id));
      toast.success('Bookmark removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>⭐ Bookmarks</h1>
            <p style={styles.sub}>Your saved answers across all documents</p>
          </div>
          <Link to="/" style={styles.backBtn}>← Back to Chat</Link>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : bookmarks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>⭐</p>
            <p style={styles.emptyTitle}>No bookmarks yet</p>
            <p style={styles.emptySub}>Click the ⭐ button on any answer to bookmark it</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {bookmarks.map(b => (
              <div key={b._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.qIcon}>❓</span>
                  <p style={styles.question}>{b.question || 'Bookmarked answer'}</p>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(b._id)}>✕</button>
                </div>
                <p style={styles.answer}>{b.answer}</p>
                {b.sources?.length > 0 && (
                  <div style={styles.sources}>
                    {b.sources.map((s, i) => (
                      <span key={i} style={styles.sourceTag}>📄 {s}</span>
                    ))}
                  </div>
                )}
                <p style={styles.date}>{new Date(b.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#ede8f5' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px 40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  title: { fontSize: '32px', fontWeight: '900', color: '#0f0a1e', letterSpacing: '-0.5px' },
  sub: { color: '#6b5e8a', fontSize: '14px', marginTop: '4px' },
  backBtn: { padding: '10px 20px', background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '10px', color: '#0f0a1e', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: '3px 3px 0px #0f0a1e' },
  empty: { textAlign: 'center', color: '#6b5e8a', padding: '60px' },
  emptyState: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#0f0a1e', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#6b5e8a' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' },
  card: { background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '14px', padding: '20px', boxShadow: '4px 4px 0px #0f0a1e' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' },
  qIcon: { fontSize: '16px', flexShrink: 0, marginTop: '2px' },
  question: { flex: 1, fontSize: '14px', fontWeight: '700', color: '#0f0a1e', lineHeight: '1.4' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', flexShrink: 0 },
  answer: { fontSize: '13px', color: '#334155', lineHeight: '1.7', marginBottom: '12px', padding: '10px', background: '#faf9ff', borderRadius: '8px', border: '1px solid #e2e8f0' },
  sources: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
  sourceTag: { padding: '2px 10px', background: '#f3effe', border: '1.5px solid #a78bca', borderRadius: '20px', fontSize: '11px', color: '#7c3aed', fontWeight: '600' },
  date: { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
};