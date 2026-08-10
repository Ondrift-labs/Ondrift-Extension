export const inlineWidgetStyles = `
:host { all: initial; color-scheme: light; --od-ink:#20211e; --od-muted:#686b64; --od-paper:#fffef9; --od-line:#d7d8cf; --od-accent:#256b57; --od-accent-soft:#e4f0eb; --od-danger:#a13e32; font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
:host([hidden]) { display:none !important; }
* { box-sizing:border-box; }
button { font:inherit; }
button:focus-visible { outline:2px solid var(--od-accent); outline-offset:2px; }
.od-shell { width:min(390px,calc(100vw - 24px)); border:1px solid var(--od-line); border-radius:9px; color:var(--od-ink); background:var(--od-paper); box-shadow:0 12px 36px rgb(28 31 27 / 16%); overflow:hidden; }
.od-header { min-height:42px; display:flex; align-items:center; gap:8px; padding:8px 10px; border-bottom:1px solid var(--od-line); }
.od-logo { display:block; width:23px; height:23px; object-fit:contain; }
.od-title { font-size:12px; font-weight:720; letter-spacing:-.01em; }
.od-status { margin-left:auto; color:var(--od-muted); font-size:10px; }
.od-icon-button { position:relative; z-index:1; width:26px; height:26px; display:grid; place-items:center; border:0; border-radius:5px; color:var(--od-muted); background:transparent; cursor:pointer; pointer-events:auto; }
.od-icon-button:hover { color:var(--od-ink); background:#f0f0ea; }
.od-icon-button svg { width:14px; height:14px; }
.od-body { padding:12px; }
.od-ready { display:flex; align-items:center; gap:12px; }
.od-ready p { flex:1; margin:0; color:var(--od-muted); font-size:11px; line-height:1.4; }
.od-button { min-height:32px; display:inline-flex; align-items:center; justify-content:center; gap:6px; border:1px solid transparent; border-radius:6px; padding:6px 10px; color:white; background:var(--od-accent); font-size:11px; font-weight:680; cursor:pointer; }
.od-button:hover:not(:disabled) { background:#1e5949; }
.od-button:disabled { cursor:not-allowed; opacity:.55; }
.od-button--secondary { border-color:var(--od-line); color:var(--od-ink); background:var(--od-paper); }
.od-button--secondary:hover:not(:disabled) { background:#f1f1eb; }
.od-button svg { width:14px; height:14px; }
.od-score-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.od-score { display:grid; place-items:center; width:48px; height:48px; border:2px solid var(--od-accent); border-radius:50%; color:var(--od-accent); font:500 19px Georgia,serif; }
.od-score-copy { display:grid; gap:3px; }
.od-score-copy strong { font-size:12px; }
.od-score-copy span { color:var(--od-accent); font-size:10px; font-weight:650; }
.od-rationale { margin:0 0 11px; color:var(--od-muted); font-size:11px; line-height:1.5; }
.od-preview-label { display:block; margin-bottom:5px; color:var(--od-muted); font-size:9px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
.od-preview { max-height:104px; overflow:auto; margin:0; border-left:2px solid var(--od-accent); padding:8px 10px; color:var(--od-ink); background:#f5f6f1; font-size:11px; line-height:1.5; white-space:pre-wrap; }
.od-actions { display:flex; align-items:center; justify-content:flex-end; gap:7px; margin-top:11px; }
.od-message { display:grid; grid-template-columns:auto 1fr; gap:10px; align-items:start; }
.od-message-icon { display:grid; place-items:center; width:27px; height:27px; border-radius:50%; color:var(--od-danger); background:#f7e9e6; }
.od-message-icon svg { width:14px; }
.od-message strong { display:block; margin-bottom:3px; font-size:12px; }
.od-message p { margin:0; color:var(--od-muted); font-size:11px; line-height:1.45; }
.od-loading { display:flex; align-items:center; gap:10px; color:var(--od-muted); font-size:11px; }
.od-spinner { width:17px; height:17px; border:2px solid var(--od-line); border-top-color:var(--od-accent); border-radius:50%; animation:od-spin .75s linear infinite; }
.od-applied { display:flex; align-items:center; gap:9px; color:var(--od-accent); font-size:11px; font-weight:650; }
.od-applied svg { width:17px; }
[hidden] { display:none !important; }
@keyframes od-spin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) { * { animation-duration:.01ms !important; transition-duration:.01ms !important; } }
`;
