import { useState } from 'react';
import Navbar from '../components/Navbar';
import DocSidebar from '../components/DocSidebar';
import UploadZone from '../components/UploadZone';
import DocFlowPanel from '../components/DocFlowPanel';
import ChatBox from '../components/ChatBox';

const Sparkle = ({ style }) => (
  <span style={{ fontSize: '28px', animation: 'sparkle 2s ease-in-out infinite', display: 'inline-block', ...style }}>✦</span>
);

export default function Home() {
  const [session,     setSession]     = useState(null);
  const [showUpload,  setShowUpload]  = useState(false);
  const [docAnalysis, setDocAnalysis] = useState(null);

  const handleUploadSuccess = (data) => {
    setSession(data);
    setDocAnalysis(data.doc_analysis || null);
    setShowUpload(false);
  };

  const handleSelectDoc = (doc) => {
    if (!doc) { setSession(null); setDocAnalysis(null); return; }
    setSession(doc);
    setDocAnalysis(doc.doc_type ? {
      doc_type: doc.doc_type,
      title: doc.doc_title,
      description: doc.doc_desc,
      flow: doc.doc_flow,
      summary: doc.doc_summary
    } : null);
  };

  return (
    <div style={styles.page}>
      <Navbar />

      {/* Hero */}
      <div style={styles.hero}>
        <Sparkle style={{ color: '#7c3aed', position: 'absolute', top: '24px', left: '16%', animationDelay: '0s' }} />
        <Sparkle style={{ color: '#06b6d4', position: 'absolute', top: '16px', right: '16%', animationDelay: '0.5s', fontSize: '20px' }} />
        <Sparkle style={{ color: '#7c3aed', position: 'absolute', bottom: '16px', left: '20%', animationDelay: '1s', fontSize: '16px' }} />
        <Sparkle style={{ color: '#06b6d4', position: 'absolute', bottom: '24px', right: '20%', animationDelay: '0.3s' }} />
        <h1 style={styles.heroTitle}>Document to<br /><span style={styles.heroHighlight}>answers</span></h1>
        <p style={styles.heroSub}>Upload any PDF or TXT · AI-powered Q&A · Persistent history · Smart document analysis</p>
      </div>

      {/* Main */}
      <div style={styles.mainCard}>
        <div style={styles.grid}>

          {/* Left Panel */}
          <div style={styles.left}>
            {showUpload ? (
              <UploadZone
                onUploadSuccess={handleUploadSuccess}
                onCancel={() => setShowUpload(false)}
              />
            ) : (
              <DocSidebar
                activeSession={session}
                onSelectDoc={handleSelectDoc}
                onNewUpload={() => setShowUpload(true)}
              />
            )}

            {/* Doc Flow Panel */}
            {docAnalysis && !showUpload && (
              <DocFlowPanel analysis={docAnalysis} />
            )}

            {/* Session Info */}
            {session && !showUpload && (
              <div style={styles.sessionBox}>
                <div style={styles.sessionHeader}>
                  <span style={styles.greenDot} />
                  <span style={styles.sessionTitle}>Active Session</span>
                </div>
                <div style={styles.sessionGrid}>
                  <span style={styles.sKey}>File</span>
                  <span style={styles.sVal}>{session.filename}</span>
                  <span style={styles.sKey}>ID</span>
                  <code style={styles.sCode}>{session._id || session.session_id}</code>
                  <span style={styles.sKey}>Chunks</span>
                  <span style={styles.sVal}>{session.chunks}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Chat */}
          <div style={styles.right}>
            <div style={styles.chatHeader}>
              <p style={styles.sectionLabel}>
                💬 {session ? `Chatting about: ${session.filename}` : 'Select a document to start'}
              </p>
              {session && <span style={styles.readyPill}>● Ready</span>}
            </div>
            <div style={styles.chatBox}>
              <ChatBox session={session} />
            </div>
          </div>

        </div>
      </div>

      <div style={styles.footer}>
        Built with LangChain · ChromaDB · Groq · FastAPI · React.js · MongoDB
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#ede8f5', display: 'flex', flexDirection: 'column' },
  hero: { textAlign: 'center', padding: '48px 24px 36px', position: 'relative', overflow: 'hidden' },
  heroTitle: { fontSize: '60px', fontWeight: '900', color: '#0f0a1e', lineHeight: 1.1, marginBottom: '14px', letterSpacing: '-2px' },
  heroHighlight: { color: '#7c3aed' },
  heroSub: { fontSize: '15px', color: '#4a3f6b', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' },
  mainCard: { background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '24px', margin: '0 40px 32px', boxShadow: '8px 8px 0px #0f0a1e', overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: '360px 1fr' },
  left: { padding: '24px 20px', borderRight: '2px solid #0f0a1e', display: 'flex', flexDirection: 'column', gap: '14px', background: '#faf9ff', overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' },
  right: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionLabel: { fontSize: '13px', fontWeight: '700', color: '#0f0a1e', textTransform: 'uppercase', letterSpacing: '0.5px' },
  chatHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  readyPill: { fontSize: '12px', color: '#22c55e', fontWeight: '700', background: '#f0fdf4', border: '1.5px solid #22c55e', padding: '3px 10px', borderRadius: '20px' },
  chatBox: { flex: 1, border: '2.5px solid #0f0a1e', borderRadius: '16px', overflow: 'hidden', boxShadow: '4px 4px 0px #0f0a1e', background: '#ffffff', height: 'calc(100vh - 360px)', display: 'flex', flexDirection: 'column' },
  sessionBox: { background: '#f3effe', border: '2px solid #0f0a1e', borderRadius: '12px', padding: '14px', boxShadow: '3px 3px 0px #0f0a1e' },
  sessionHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' },
  greenDot: { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', border: '1.5px solid #0f0a1e' },
  sessionTitle: { fontSize: '11px', fontWeight: '800', color: '#0f0a1e', textTransform: 'uppercase', letterSpacing: '0.5px' },
  sessionGrid: { display: 'grid', gridTemplateColumns: '60px 1fr', gap: '5px', alignItems: 'center' },
  sKey: { fontSize: '11px', color: '#6b5e8a', fontWeight: '500' },
  sVal: { fontSize: '12px', color: '#0f0a1e', fontWeight: '500' },
  sCode: { fontSize: '11px', background: '#ffffff', border: '1.5px solid #0f0a1e', padding: '2px 8px', borderRadius: '4px', color: '#7c3aed', fontFamily: 'monospace' },
  footer: { textAlign: 'center', padding: '20px', fontSize: '12px', color: '#6b5e8a', fontWeight: '500', borderTop: '2px solid #d4cce8' },
};