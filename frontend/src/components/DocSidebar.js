import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getDocuments, deleteDocument } from '../services/api';

export default function DocSidebar({ activeSession, onSelectDoc, onNewUpload }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => { fetchDocs(); }, [activeSession]);

  const fetchDocs = async () => {
    try {
      const { data } = await getDocuments();
      setDocs(data);
    } catch {}
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and its chat history?')) return;
    try {
      await deleteDocument(id);
      setDocs(prev => prev.filter(d => d._id !== id));
      if (activeSession?._id === id) onSelectDoc(null);
      toast.success('Document deleted');
    } catch { toast.error('Delete failed'); }
  };

  const DOC_TYPE_ICONS = { learning: '🎓', product: '🚀', general: '📄' };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <p style={styles.title}>📁 My Documents</p>
        <button style={styles.newBtn} onClick={onNewUpload}>+ Upload</button>
      </div>

      {docs.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📂</p>
          <p style={styles.emptyText}>No documents yet</p>
        </div>
      ) : (
        <div style={styles.list}>
          {docs.map(doc => (
            <div
              key={doc._id}
              style={{ ...styles.docItem, ...(activeSession?._id === doc._id ? styles.activeDoc : {}) }}
              onClick={() => onSelectDoc(doc)}
            >
              <div style={styles.docLeft}>
                <span style={styles.docIcon}>{DOC_TYPE_ICONS[doc.doc_type] || '📄'}</span>
                <div>
                  <p style={styles.docName}>{doc.filename}</p>
                  <p style={styles.docMeta}>{doc.chunks} chunks · {doc.doc_type}</p>
                </div>
              </div>
              <button style={styles.deleteBtn} onClick={e => handleDelete(e, doc._id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: { background: '#faf9ff', border: '2px solid #0f0a1e', borderRadius: '14px', overflow: 'hidden', boxShadow: '4px 4px 0px #0f0a1e' },
  header: { padding: '14px 16px', borderBottom: '2px solid #0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f3effe' },
  title: { fontSize: '13px', fontWeight: '800', color: '#0f0a1e', textTransform: 'uppercase', letterSpacing: '0.5px' },
  newBtn: { padding: '5px 12px', background: '#7c3aed', border: '2px solid #0f0a1e', borderRadius: '7px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '2px 2px 0px #0f0a1e' },
  empty: { padding: '32px 16px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '8px' },
  emptyText: { fontSize: '13px', color: '#6b5e8a' },
  list: { maxHeight: '300px', overflowY: 'auto' },
  docItem: { padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #ede8f5', transition: 'background 0.15s' },
  activeDoc: { background: '#f3effe', borderLeft: '3px solid #7c3aed' },
  docLeft: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 },
  docIcon: { fontSize: '20px', flexShrink: 0 },
  docName: { fontSize: '13px', fontWeight: '600', color: '#0f0a1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' },
  docMeta: { fontSize: '11px', color: '#6b5e8a', marginTop: '2px' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.6, flexShrink: 0 },
};