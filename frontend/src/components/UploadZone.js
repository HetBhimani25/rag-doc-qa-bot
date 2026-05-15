import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadDocument } from '../services/api';

export default function UploadZone({ onUploadSuccess, onCancel }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) return toast.error('Only PDF and TXT files supported');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await uploadDocument(formData);
      onUploadSuccess(data);
      toast.success(`Processed into ${data.chunks} chunks!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <div
        style={{ ...styles.zone, ...(dragging ? styles.zoneDrag : {}) }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <div style={styles.uploadingBox}>
            <div style={styles.spinner} />
            <p style={styles.uploadingText}>Processing document...</p>
            <p style={styles.uploadingSub}>Chunking → Embedding → Analyzing → Storing</p>
          </div>
        ) : (
          <>
            <div style={styles.icon}>📄</div>
            <p style={styles.title}>Drop your document here</p>
            <p style={styles.sub}>or click to browse</p>
            <div style={styles.badges}>
              <span style={styles.badge}>PDF</span>
              <span style={styles.badge}>TXT</span>
            </div>
          </>
        )}
      </div>
      {onCancel && (
        <button style={styles.cancelBtn} onClick={onCancel}>✕ Cancel</button>
      )}
    </div>
  );
}

const styles = {
  zone: { border: '2.5px dashed #a78bca', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#f3effe' },
  zoneDrag: { borderColor: '#7c3aed', background: '#ede0ff', transform: 'scale(1.01)' },
  icon: { fontSize: '36px', marginBottom: '12px', animation: 'float 3s ease-in-out infinite', display: 'block' },
  title: { fontSize: '16px', fontWeight: '700', color: '#0f0a1e', marginBottom: '6px' },
  sub: { color: '#6b5e8a', fontSize: '13px', marginBottom: '16px' },
  badges: { display: 'flex', justifyContent: 'center', gap: '8px' },
  badge: { padding: '4px 14px', background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '20px', color: '#0f0a1e', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #0f0a1e' },
  uploadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  spinner: { width: '32px', height: '32px', border: '3px solid #e0d7f5', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  uploadingText: { fontSize: '15px', fontWeight: '700', color: '#0f0a1e' },
  uploadingSub: { fontSize: '12px', color: '#6b5e8a' },
  cancelBtn: { width: '100%', marginTop: '10px', padding: '8px', background: 'transparent', border: '2px solid #0f0a1e', borderRadius: '8px', color: '#0f0a1e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};