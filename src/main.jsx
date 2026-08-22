import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Brain, Check, Clock3, Command, Download, Inbox, Library, Mic, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import './style.css';

function formatTimestamp(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(Number.isNaN(date.getTime()) ? new Date() : date);
}

function formatToday() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function isToday(value) {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString();
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadThoughts() {
  const saved = readStorage('heap-thoughts', []);
  if (!Array.isArray(saved)) return [];
  return saved.map(item => ({ ...item, createdAt: Number.isNaN(new Date(item.createdAt).getTime()) ? new Date().toISOString() : new Date(item.createdAt).toISOString() }));
}

function trackEvent(name) {
  const events = readStorage('heap-events', []);
  localStorage.setItem('heap-events', JSON.stringify([...events, { name, at: new Date().toISOString() }]));
}

function scoreThought(thought, query) {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const haystack = thought.text.toLowerCase();
  return words.reduce((score, word) => score + (haystack.includes(word) ? 3 : 0), 0) + (haystack.includes(query.toLowerCase()) ? 4 : 0);
}

function App() {
  const [thoughts, setThoughts] = useState(loadThoughts);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [activeView, setActiveView] = useState('today');
  const [toast, setToast] = useState('');
  const [asks, setAsks] = useState(() => Number(localStorage.getItem('heap-asks') || 0));
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('heap-onboarded') !== 'true');
  const [showNudge, setShowNudge] = useState(() => localStorage.getItem('heap-nudge-dismissed') !== new Date().toISOString().slice(0, 10));
  const [listening, setListening] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => localStorage.setItem('heap-thoughts', JSON.stringify(thoughts)), [thoughts]);
  useEffect(() => localStorage.setItem('heap-asks', String(asks)), [asks]);
  useEffect(() => trackEvent('digest_viewed'), []);
  useEffect(() => {
    const handleShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        document.querySelector('#capture-input')?.focus();
      }
    };
    const handleInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('keydown', handleShortcut);
    window.addEventListener('beforeinstallprompt', handleInstall);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
      window.removeEventListener('beforeinstallprompt', handleInstall);
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return thoughts;
    return thoughts.map(thought => ({ ...thought, score: scoreThought(thought, query) })).filter(thought => thought.score > 0).sort((a, b) => b.score - a.score);
  }, [thoughts, query]);
  const nudgeThought = useMemo(() => thoughts.find(thought => Date.now() - new Date(thought.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000), [thoughts]);

  function capture(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setThoughts([{ id: Date.now(), text: draft.trim(), createdAt: new Date().toISOString(), tone: ['coral', 'blue', 'green', 'yellow'][thoughts.length % 4] }, ...thoughts]);
    trackEvent('capture_made');
    setDraft('');
    setToast('Dropped into your heap');
    setTimeout(() => setToast(''), 2200);
  }

  function ask(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setAsks(value => value + 1);
    trackEvent('ask_made');
  }

  function clearAll() {
    setQuery('');
    setActiveView('today');
  }

  function completeOnboarding() {
    localStorage.setItem('heap-onboarded', 'true');
    setShowOnboarding(false);
    document.querySelector('#capture-input')?.focus();
  }

  function exportThoughts() {
    const content = thoughts.map(thought => `${formatTimestamp(thought.createdAt)}\n${thought.text}`).join('\n\n');
    const blob = new Blob([`Heap export\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'heap-export.txt';
    link.click();
    URL.revokeObjectURL(url);
    setToast('Your heap is on its way out');
    setTimeout(() => setToast(''), 2200);
  }

  function toggleVoice() {
    if (!speechSupported) {
      setToast('Voice capture is not supported in this browser');
      setTimeout(() => setToast(''), 2200);
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setToast('Voice capture could not start'); setTimeout(() => setToast(''), 2200); };
    recognition.onresult = event => setDraft(value => `${value}${value ? ' ' : ''}${event.results[0][0].transcript}`);
    recognition.start();
  }

  function beginEdit(thought) {
    setEditingId(thought.id);
    setEditingText(thought.text);
  }

  function saveEdit(event, id) {
    event.preventDefault();
    if (!editingText.trim()) return;
    setThoughts(items => items.map(item => item.id === id ? { ...item, text: editingText.trim(), updatedAt: new Date().toISOString() } : item));
    setEditingId(null);
    setEditingText('');
  }

  function deleteThought(id) {
    if (!window.confirm('Delete this thought?')) return;
    setThoughts(items => items.filter(item => item.id !== id));
    trackEvent('thought_deleted');
  }

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Brain size={18} /></span><span>heap</span></div>
      <button className="new-capture" onClick={() => document.querySelector('#capture-input')?.focus()}><Plus size={17} /> <span>New thought</span><kbd>⌘ N</kbd></button>
      <nav>
        <button className={activeView === 'today' ? 'nav-item active' : 'nav-item'} onClick={clearAll}><Inbox size={17} /><span>Today</span><b>{thoughts.filter(item => isToday(item.createdAt)).length}</b></button>
        <button className={activeView === 'all' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('all'); setQuery(''); }}><Library size={17} /><span>Everything</span><b>{thoughts.length}</b></button>
      </nav>
      <div className="sidebar-foot"><div className="status-dot"></div><span>Local beta</span><span className="sync">Synced</span></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">{query ? 'Searching your heap' : formatToday()}</p><h1>{query ? 'Here is what I found' : 'Good morning, Alex.'}</h1></div><div className="top-actions"><button className="export-btn" onClick={exportThoughts} title="Export your thoughts"><Download size={15} /> Export</button>{installPrompt && <button className="export-btn install-btn" onClick={installApp} title="Install Heap"><Download size={15} /> Install</button>}<div className="profile">AS</div></div></header>
      <section className="ask-zone">
        <form className="ask-box" onSubmit={ask}><Search size={21} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ask your heap anything..." autoComplete="off" /><span className="ask-hint"><Command size={13} /> K</span>{query && <button type="button" className="clear-btn" onClick={clearAll}><X size={16} /></button>}</form>
        {query && <p className="result-meta">{results.length} {results.length === 1 ? 'thought' : 'thoughts'} found <span>·</span> based on your words, not folders</p>}
      </section>

      {!query && <section className="signal"><div className="signal-icon"><Sparkles size={19} /></div><div><strong>A small signal from your heap</strong><p>You have mentioned <em>launch</em> 3 times this week. Want to keep following that thread?</p></div><button onClick={() => setQuery('launch')}>Explore <ArrowUpRight size={15} /></button></section>}
      {!query && showNudge && nudgeThought && <section className="weekly-nudge"><div><span className="nudge-label"><Clock3 size={13} /> Still here</span><p>{nudgeThought.text}</p></div><button onClick={() => { localStorage.setItem('heap-nudge-dismissed', new Date().toISOString().slice(0, 10)); setShowNudge(false); }} title="Dismiss reminder"><X size={16} /></button></section>}

      <section className="content-grid">
        <div className="feed-column">
          <div className="section-heading"><h2>{query ? 'Matching thoughts' : activeView === 'all' ? 'Everything' : 'Your latest thoughts'}</h2><span>{query ? 'Most relevant first' : 'No filing required'}</span></div>
          <div className="thought-list">{results.length ? results.map(thought => <article className={`thought-card ${thought.tone}`} key={thought.id}><div className="thought-top"><span className="thought-type"><span className="tone-dot"></span> Thought</span><time><Clock3 size={13} /> {formatTimestamp(thought.createdAt)}</time><span className="thought-actions"><button onClick={() => beginEdit(thought)} title="Edit thought"><Pencil size={13} /></button><button onClick={() => deleteThought(thought.id)} title="Delete thought"><Trash2 size={13} /></button></span></div>{editingId === thought.id ? <form className="edit-form" onSubmit={event => saveEdit(event, thought.id)}><textarea value={editingText} onChange={event => setEditingText(event.target.value)} autoFocus /><div><button type="button" onClick={() => setEditingId(null)}>Cancel</button><button type="submit">Save</button></div></form> : <p>{thought.text}</p>}{query && <div className="evidence"><Check size={13} /> Source found in your heap</div>}</article>) : <div className="empty"><Search size={26} /><h3>{query ? 'Nothing yet' : 'Your heap is empty'}</h3><p>{query ? 'Try asking in a different way. Heap works best with natural language.' : 'Start with one thought below. It does not need a title or a folder.'}</p></div>}</div>
        </div>
        <aside className="right-rail"><div className="rail-card"><div className="rail-title"><span>Beta pulse</span><span className="live"><i></i> Live</span></div><div className="metric"><strong>{thoughts.length}</strong><span>thoughts captured</span></div><div className="metric"><strong>{asks}</strong><span>questions asked</span></div><div className="progress-label"><span>Day 4 of 14</span><span>beta</span></div><div className="progress"><i></i></div></div><div className="rail-note"><Sparkles size={16} /><p>Keep dumping. The value compounds when you stop organizing.</p></div></aside>
      </section>
    </main>

    <form className="capture-dock" onSubmit={capture}><div className="dock-icon"><Plus size={20} /></div><input id="capture-input" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Drop a thought here... no title, no folder" /><button className={listening ? 'voice-btn listening' : 'voice-btn'} type="button" onClick={toggleVoice} title={speechSupported ? 'Capture with your voice' : 'Voice capture unavailable'}><Mic size={17} /></button><button type="submit">Capture <ArrowUpRight size={15} /></button></form>
    {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    {showOnboarding && <div className="onboarding-backdrop"><section className="onboarding"><button className="onboarding-close" onClick={completeOnboarding} title="Close"><X size={17} /></button><span className="onboarding-mark"><Brain size={22} /></span><p className="eyebrow">A quieter place for your mind</p><h2>What's on your mind right now?</h2><p>Drop it here. No title, no folder, no need to make it neat. Heap will help you find it later.</p><button className="start-btn" onClick={completeOnboarding}>Start dumping <ArrowUpRight size={15} /></button></section></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
