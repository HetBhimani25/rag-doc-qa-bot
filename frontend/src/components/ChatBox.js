import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { askQuestion, getChatHistory, suggestQuestions, addBookmark, deleteBookmark, getBookmarks } from '../services/api';

function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return text;
  const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts  = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: '#fef08a', color: '#0f0a1e', borderRadius: '3px', padding: '0 2px', fontWeight: '600' }}>{part}</mark>
      : part
  );
}

export default function ChatBox({ session }) {
  const [messages,   setMessages]   = useState([]);
  const [question,   setQuestion]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [suggested,  setSuggested]  = useState([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [bookmarked, setBookmarked] = useState(new Set());
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (session) {
      loadHistory();
      fetchSuggestions(session._id || session.session_id);
      loadBookmarks();
    } else {
      setMessages([]);
      setSuggested([]);
    }
  }, [session]);

  const loadHistory = async () => {
    try {
      const id = session._id || session.session_id;
      const { data } = await getChatHistory(id);
      if (data.length > 0) {
        const msgs = [];
        data.forEach(chat => {
          msgs.push({ role: 'user', text: chat.question });
          msgs.push({ role: 'assistant', text: chat.answer, sources: chat.sources, chatId: chat._id, keywords: extractKeywords(chat.question) });
        });
        setMessages(msgs);
      } else {
        setMessages([{
          role: 'assistant',
          text: `"${session.filename}" is ready! Ask me anything about it.`,
          sources: []
        }]);
      }
    } catch {
      setMessages([{ role: 'assistant', text: `"${session.filename}" is ready!`, sources: [] }]);
    }
  };

  const loadBookmarks = async () => {
    try {
      const { data } = await getBookmarks();
      const ids = new Set(data.map(b => b._id));
      setBookmarked(ids);
    } catch {}
  };

  const extractKeywords = (question) => {
    const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 'in', 'of', 'for', 'to', 'and', 'or', 'do', 'does', 'can', 'could', 'would', 'should']);
    return question.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  };

  const fetchSuggestions = async (id) => {
    setLoadingSug(true);
    try {
      const { data } = await suggestQuestions(id);
      setSuggested(data.questions || []);
    } catch {
      setSuggested(['Summarize this document', 'What are the key points?', 'What topics are covered?', 'What are the main concepts?']);
    } finally { setLoadingSug(false); }
  };

  const handleSend = async (q = null) => {
    const text = q || question;
    if (!text.trim() || !session) return;

    const keywords = extractKeywords(text);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuestion('');
    setSuggested([]);
    setLoading(true);

    try {
      const id = session._id || session.session_id;
      const { data } = await askQuestion(id, text);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.answer,
        sources: data.sources || [],
        keywords,
        question: text,
      }]);
    } catch { toast.error('Failed to get answer'); }
    finally { setLoading(false); }
  };

  const handleBookmark = async (msg) => {
    try {
      const id = session._id || session.session_id;
      const { data } = await addBookmark({
        session_id: id,
        question: msg.question || '',
        answer: msg.text,
        sources: msg.sources || []
      });
      setBookmarked(prev => new Set([...prev, data.id]));
      toast.success('⭐ Bookmarked!');
    } catch { toast.error('Bookmark failed'); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyTitle}>Select a document to start chatting</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <p style={styles.roleLabel}>{msg.role === 'user' ? 'You' : '🧠 Assistant'}</p>
            <div style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
              <p style={{ ...styles.msgText, color: msg.role === 'user' ? '#ffffff' : '#0f0a1e' }}>
                {msg.role === 'assistant' && msg.keywords
                  ? highlightKeywords(msg.text, msg.keywords)
                  : msg.text}
              </p>
            </div>

            {msg.role === 'assistant' && (
              <div style={styles.msgFooter}>
                {msg.sources?.length > 0 && (
                  <div style={styles.sources}>
                    <span style={styles.sourcesLabel}>Sources:</span>
                    {msg.sources.map((s, j) => (
                      <span key={j} style={styles.sourceTag}>📄 {s}</span>
                    ))}
                  </div>
                )}
                <button style={styles.bookmarkBtn} onClick={() => handleBookmark(msg)} title="Bookmark this answer">
                  ⭐
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <p style={styles.roleLabel}>🧠 Assistant</p>
            <div style={styles.aiBubble}>
              <div style={styles.typingDots}>
                <span style={{ ...styles.dot, animationDelay: '0s' }} />
                <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {suggested.length > 0 && session && (
        <div style={styles.suggestions}>
          <div style={styles.suggestHeader}>
            <span style={styles.sparkle}>✦</span>
            <p style={styles.suggestLabel}>
              {loadingSug ? 'Analyzing document...' : 'AI suggested questions:'}
            </p>
          </div>
          {loadingSug ? (
            <div style={styles.suggestLoading}>
              <div style={styles.suggestSpinner} />
              <span style={styles.suggestLoadingText}>Generating questions...</span>
            </div>
          ) : (
            <div style={styles.suggestRow}>
              {suggested.map((q, i) => (
                <button key={i} style={styles.suggestBtn} onClick={() => handleSend(q)}>{q}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputBox}>
          <textarea
            style={styles.input}
            placeholder={session ? "Ask anything about your document..." : "Select a document first..."}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={!session || loading}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: (!session || loading || !question.trim()) ? 0.4 : 1 }}
            onClick={() => handleSend()}
            disabled={!session || loading || !question.trim()}
          >↑</button>
        </div>
        <p style={styles.hint}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', opacity: 0.5 },
  emptyIcon: { fontSize: '40px' },
  emptyTitle: { fontSize: '16px', fontWeight: '700', color: '#4a3f6b' },
  roleLabel: { fontSize: '11px', fontWeight: '700', color: '#6b5e8a', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  aiBubble: { background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '14px', borderTopLeftRadius: '4px', padding: '14px 18px', maxWidth: '85%', boxShadow: '3px 3px 0px #0f0a1e' },
  userBubble: { background: '#7c3aed', border: '2px solid #0f0a1e', borderRadius: '14px', borderTopRightRadius: '4px', padding: '12px 16px', maxWidth: '75%', boxShadow: '3px 3px 0px #0f0a1e' },
  msgText: { fontSize: '14px', lineHeight: '1.75', whiteSpace: 'pre-wrap' },
  msgFooter: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' },
  sources: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  sourcesLabel: { fontSize: '11px', color: '#6b5e8a', fontWeight: '600' },
  sourceTag: { padding: '2px 10px', background: '#f3effe', border: '1.5px solid #a78bca', borderRadius: '20px', fontSize: '11px', color: '#7c3aed', fontWeight: '600' },
  bookmarkBtn: { background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '14px' },
  typingDots: { display: 'flex', gap: '5px', alignItems: 'center', padding: '2px 0' },
  dot: { width: '8px', height: '8px', background: '#a78bca', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.2s infinite' },
  suggestions: { padding: '0 20px 14px', borderTop: '1.5px solid #ede8f5' },
  suggestHeader: { display: 'flex', alignItems: 'center', gap: '6px', margin: '12px 0 8px' },
  sparkle: { color: '#7c3aed', fontSize: '14px', animation: 'sparkle 2s ease-in-out infinite' },
  suggestLabel: { fontSize: '11px', color: '#6b5e8a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  suggestLoading: { display: 'flex', alignItems: 'center', gap: '8px' },
  suggestSpinner: { width: '14px', height: '14px', border: '2px solid #e0d7f5', borderTop: '2px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  suggestLoadingText: { fontSize: '12px', color: '#a78bca' },
  suggestRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  suggestBtn: { padding: '7px 14px', background: '#ffffff', border: '2px solid #0f0a1e', borderRadius: '20px', color: '#0f0a1e', fontSize: '12px', cursor: 'pointer', fontWeight: '600', boxShadow: '2px 2px 0px #0f0a1e' },
  inputArea: { padding: '14px 20px 12px', borderTop: '2px solid #e0d7f5' },
  inputBox: { display: 'flex', alignItems: 'flex-end', gap: '10px', background: '#ffffff', border: '2.5px solid #0f0a1e', borderRadius: '14px', padding: '10px 14px', boxShadow: '4px 4px 0px #0f0a1e' },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#0f0a1e', fontSize: '14px', resize: 'none', lineHeight: '1.5', fontFamily: 'inherit' },
  sendBtn: { width: '36px', height: '36px', background: '#7c3aed', border: '2px solid #0f0a1e', borderRadius: '8px', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '2px 2px 0px #0f0a1e' },
  hint: { textAlign: 'center', fontSize: '11px', color: '#a78bca', marginTop: '8px' },
};