import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getBookmarks, deleteBookmark, getDocuments } from '../services/api';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view, setView]           = useState('documents'); // 'documents' | 'bookmarks'
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session || null;

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
      setBookmarks(prev => {
        const newBookmarks = prev.filter(b => b._id !== id);
        if (view === 'bookmarks' && selectedDoc) {
           const remaining = newBookmarks.filter(b => b.session_id === selectedDoc.session_id);
           if (remaining.length === 0) {
             setView('documents');
             setSearchQuery('');
           }
        }
        return newBookmarks;
      });
      toast.success('Bookmark removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleShow = async (b) => {
    try {
      const { data } = await getDocuments();
      const docExists = data.find(d => d._id === b.session_id);
      if (docExists) {
        navigate('/', { state: { session: docExists, highlightMsgId: b._id } });
      } else {
        toast.error('The document for this chat has been deleted.');
      }
    } catch {
      toast.error('Failed to verify document.');
    }
  };

  const groupedDocs = bookmarks.reduce((acc, b) => {
    if (!acc[b.session_id]) {
      acc[b.session_id] = {
        session_id: b.session_id,
        filename: b.filename || b.document_name || 'Unknown Document',
        count: 0
      };
    }
    acc[b.session_id].count += 1;
    return acc;
  }, {});

  const docsList = Object.values(groupedDocs).filter(d => 
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookmarks = bookmarks.filter(b => 
    b.session_id === selectedDoc?.session_id &&
    ((b.question || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (b.answer || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {view === 'documents' ? '⭐ Bookmarks' : `⭐ ${selectedDoc.filename}`}
            </h1>
            <p style={styles.sub}>
              {view === 'documents' ? 'Your saved answers across all documents' : 'Saved answers for this document'}
            </p>
          </div>
          <div style={styles.headerRight}>
            {view === 'bookmarks' && (
              <button onClick={() => { setView('documents'); setSearchQuery(''); }} style={styles.backBtn}>
                ← Back to Folders
              </button>
            )}
            <Link to="/" state={{ session }} style={styles.backBtn}>← Back to Chat</Link>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <div style={styles.searchContainer}>
            <input 
              type="text" 
              placeholder={view === 'documents' ? "Search documents..." : "Search bookmarks..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        )}

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : bookmarks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>⭐</p>
            <p style={styles.emptyTitle}>No bookmarks yet</p>
            <p style={styles.emptySub}>Click the ⭐ button on any answer to bookmark it</p>
          </div>
        ) : view === 'documents' ? (
          docsList.length === 0 ? (
            <p style={styles.empty}>No documents match your search.</p>
          ) : (
            <div style={styles.grid}>
              {docsList.map(d => (
                <div key={d.session_id} style={styles.docCard} onClick={() => { setSelectedDoc(d); setView('bookmarks'); setSearchQuery(''); }}>
                  <span style={styles.docIcon}>📁</span>
                  <p style={styles.docTitle}>{d.filename}</p>
                  <span style={styles.docCount}>{d.count} Bookmark{d.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredBookmarks.length === 0 ? (
            <p style={styles.empty}>No bookmarks match your search.</p>
          ) : (
            <div style={styles.grid}>
              {filteredBookmarks.map(b => (
                <div key={b._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.qIcon}>❓</span>
                    <p style={styles.question}>{b.question || 'Bookmarked answer'}</p>
                    <button style={styles.showBtn} onClick={() => handleShow(b)}>Show</button>
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
                  <p style={styles.date}>
                    {(() => {
                      const d = new Date(b.created_at);
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    })()}
                  </p>
                </div>
              ))}
            </div>
          )
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
  headerRight: { display: 'flex', gap: '10px' },
  backBtn: { padding: '10px 20px', background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '10px', color: '#0f0a1e', fontSize: '14px', fontWeight: '700', textDecoration: 'none', cursor: 'pointer', boxShadow: '3px 3px 0px #0f0a1e' },
  searchContainer: { marginBottom: '24px' },
  searchInput: { width: '100%', padding: '14px 18px', background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '12px', fontSize: '14px', outline: 'none', boxShadow: '4px 4px 0px #0f0a1e', boxSizing: 'border-box' },
  empty: { textAlign: 'center', color: '#6b5e8a', padding: '60px' },
  emptyState: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#0f0a1e', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#6b5e8a' },
  grid: { columns: '340px', columnGap: '16px' },
  docCard: { background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '14px', padding: '24px', boxShadow: '4px 4px 0px #0f0a1e', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.1s', breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%', boxSizing: 'border-box' },
  docIcon: { fontSize: '36px' },
  docTitle: { fontSize: '16px', fontWeight: '800', color: '#0f0a1e', wordBreak: 'break-word', lineHeight: '1.4' },
  docCount: { fontSize: '12px', background: '#f3effe', color: '#7c3aed', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', alignSelf: 'flex-start', border: '1.5px solid #a78bca' },
  card: { background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '14px', padding: '20px', boxShadow: '4px 4px 0px #0f0a1e', breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%', boxSizing: 'border-box' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' },
  qIcon: { fontSize: '16px', flexShrink: 0, marginTop: '2px' },
  question: { flex: 1, fontSize: '14px', fontWeight: '700', color: '#0f0a1e', lineHeight: '1.4' },
  showBtn: { padding: '4px 10px', background: '#f3effe', border: '1.5px solid #a78bca', borderRadius: '6px', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', flexShrink: 0 },
  answer: { fontSize: '13px', color: '#334155', lineHeight: '1.7', marginBottom: '12px', padding: '10px', background: '#faf9ff', borderRadius: '8px', border: '1px solid #e2e8f0' },
  sources: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
  sourceTag: { padding: '2px 10px', background: '#f3effe', border: '1.5px solid #a78bca', borderRadius: '20px', fontSize: '11px', color: '#7c3aed', fontWeight: '600' },
  date: { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
};