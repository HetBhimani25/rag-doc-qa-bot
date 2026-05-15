const TYPE_CONFIG = {
  learning: { icon: '🎓', label: 'Learning Material', color: '#7c3aed', bg: '#f3effe', border: '#a78bca' },
  product:  { icon: '🚀', label: 'Product / Implementation', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  general:  { icon: '📄', label: 'General Document', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
};

export default function DocFlowPanel({ analysis }) {
  if (!analysis) return null;

  const config = TYPE_CONFIG[analysis.doc_type] || TYPE_CONFIG.general;

  return (
    <div style={{ ...styles.panel, background: config.bg, borderColor: config.border }}>
      <div style={styles.header}>
        <span style={styles.typeIcon}>{config.icon}</span>
        <div>
          <p style={{ ...styles.typeLabel, color: config.color }}>{config.label}</p>
          <p style={styles.docTitle}>{analysis.title}</p>
        </div>
      </div>

      <p style={styles.summary}>{analysis.summary}</p>

      <div style={styles.flowSection}>
        <p style={styles.flowTitle}>
          {analysis.doc_type === 'learning'  ? '🗺️ Suggested Learning Path' :
           analysis.doc_type === 'product'   ? '🛠️ Implementation Flow' :
           '📖 Reading Flow'}
        </p>
        <div style={styles.flowSteps}>
          {analysis.flow?.map((step, i) => (
            <div key={i} style={styles.flowStep}>
              <div style={{ ...styles.stepNum, background: config.color }}>{step.step}</div>
              <div style={styles.stepContent}>
                <p style={styles.stepTitle}>{step.title}</p>
                <p style={styles.stepDesc}>{step.description}</p>
              </div>
              {i < analysis.flow.length - 1 && <div style={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: { border: '2px solid', borderRadius: '14px', padding: '16px', boxShadow: '3px 3px 0px #0f0a1e' },
  header: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' },
  typeIcon: { fontSize: '28px', flexShrink: 0 },
  typeLabel: { fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  docTitle: { fontSize: '15px', fontWeight: '700', color: '#0f0a1e' },
  summary: { fontSize: '13px', color: '#334155', lineHeight: '1.6', marginBottom: '14px', padding: '10px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px' },
  flowSection: {},
  flowTitle: { fontSize: '12px', fontWeight: '800', color: '#0f0a1e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  flowSteps: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start' },
  flowStep: { display: 'flex', alignItems: 'flex-start', gap: '6px' },
  stepNum: { width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#fff', flexShrink: 0, border: '1.5px solid #0f0a1e', marginTop: '2px' },
  stepContent: { background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '6px 10px', maxWidth: '130px' },
  stepTitle: { fontSize: '12px', fontWeight: '700', color: '#0f0a1e', marginBottom: '2px' },
  stepDesc: { fontSize: '10px', color: '#64748b', lineHeight: '1.4' },
  stepArrow: { color: '#94a3b8', fontSize: '14px', marginTop: '8px' },
};