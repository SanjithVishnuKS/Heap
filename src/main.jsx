import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Brain, CalendarDays, Check, Clock3, Coins, Command, Download, Inbox, Library, ListChecks, LogIn, LogOut, Mic, Palette, Pencil, Plus, Search, Sparkles, Timer, Trash2, X } from 'lucide-react';
import './style.css';
import './theme.css';
import TaskPanel from './TaskPanel';
import FocusPanel from './FocusPanel';
import CalendarPanel from './CalendarPanel';
import { appConfig, cloudModeEnabled } from './config';
import { createClient } from '@supabase/supabase-js';

const supabase = cloudModeEnabled ? createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey) : null;

const THEME_CATALOG = [
  { id: 'coastal', name: 'Coastal Morning', baseCost: 0, note: 'Default calm workspace' },
  { id: 'mint-ledger', name: 'Mint Ledger', baseCost: 120, note: 'Finance-inspired mint and ink' },
  { id: 'vault-gold', name: 'Vault Gold', baseCost: 220, note: 'Warm brass and navy contrast' },
  { id: 'market-night', name: 'Market Night', baseCost: 340, note: 'Dark desk with neon trade accents' }
];

const COIN_REWARDS = {
  app_opened: 2,
  day_active: 3,
  capture_made: 4,
  ask_made: 3,
  source_chip_opened: 1,
  task_handoff_created: 5
};

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
  return saved.map(item => ({ ...item, id: typeof item.id === 'string' && item.id.includes('-') ? item.id : crypto.randomUUID(), createdAt: Number.isNaN(new Date(item.createdAt).getTime()) ? new Date().toISOString() : new Date(item.createdAt).toISOString() }));
}

function dayKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function trackEvent(name, payload = {}) {
  const events = readStorage('heap-events', []);
  const now = new Date();
  const entry = {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${now.getTime()}-${Math.random()}`,
    name,
    at: now.toISOString(),
    day: dayKey(now),
    ...payload
  };
  localStorage.setItem('heap-events', JSON.stringify([...events, entry]));
  return entry;
}

function csvEscape(value) {
  const normalized = String(value ?? '');
  return `"${normalized.replace(/"/g, '""')}"`;
}

function downloadTextFile(fileName, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function computeBetaMetrics(events) {
  const ordered = [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  if (!ordered.length) {
    return { activationRate: 0, askAdoptionRate: 0, trustPassRate: 100, returnRate: 0, capturesByDay3: 0, asksByDay10: 0, trustBreaks: 0, activeDays: 0 };
  }

  const firstAt = new Date(ordered[0].at).getTime();
  const day3Cutoff = firstAt + (3 * 24 * 60 * 60 * 1000);
  const day10Cutoff = firstAt + (10 * 24 * 60 * 60 * 1000);
  const capturesByDay3 = ordered.filter(event => event.name === 'capture_made' && new Date(event.at).getTime() <= day3Cutoff).length;
  const asksByDay10 = ordered.filter(event => event.name === 'ask_made' && new Date(event.at).getTime() <= day10Cutoff).length;
  const trustBreaks = ordered.filter(event => event.name === 'trust_break_reported').length;
  const activeDays = new Set(ordered.map(event => event.day)).size;

  return {
    activationRate: Math.min(100, Math.round((capturesByDay3 / 3) * 100)),
    askAdoptionRate: Math.min(100, Math.round((asksByDay10 / 3) * 100)),
    trustPassRate: Math.max(0, 100 - (trustBreaks * 35)),
    returnRate: Math.min(100, Math.round((activeDays / 7) * 100)),
    capturesByDay3,
    asksByDay10,
    trustBreaks,
    activeDays
  };
}

function scoreThought(thought, query) {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const haystack = thought.text.toLowerCase();
  return words.reduce((score, word) => score + (haystack.includes(word) ? 3 : 0), 0) + (haystack.includes(query.toLowerCase()) ? 4 : 0);
}

function buildAnswer(results, query) {
  if (!results.length) return 'I could not find that in your heap yet.';
  const lead = results[0].text.replace(/[.!?]+$/, '');
  if (results.length === 1) return `Your heap points to this: ${lead}.`;
  return `I found ${results.length} connected thoughts about ${query.trim()}. The strongest thread starts with: ${lead}.`;
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
  const [cloudAnswer, setCloudAnswer] = useState(null);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [coins, setCoins] = useState(() => Number(localStorage.getItem('heap-coins') || 0));
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('heap-theme') || 'coastal');
  const [unlockedThemes, setUnlockedThemes] = useState(() => {
    const saved = readStorage('heap-unlocked-themes', ['coastal']);
    return Array.isArray(saved) && saved.length ? Array.from(new Set(['coastal', ...saved])) : ['coastal'];
  });
  const [themeShopOpen, setThemeShopOpen] = useState(false);
  const [analyticsVersion, setAnalyticsVersion] = useState(0);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => localStorage.setItem('heap-thoughts', JSON.stringify(thoughts)), [thoughts]);
  useEffect(() => localStorage.setItem('heap-asks', String(asks)), [asks]);
  useEffect(() => localStorage.setItem('heap-coins', String(coins)), [coins]);
  useEffect(() => localStorage.setItem('heap-theme', activeTheme), [activeTheme]);
  useEffect(() => localStorage.setItem('heap-unlocked-themes', JSON.stringify(unlockedThemes)), [unlockedThemes]);
  useEffect(() => {
    document.body.dataset.theme = activeTheme;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [activeTheme]);
  useEffect(() => {
    const handleShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        document.querySelector('#capture-input')?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('#ask-input')?.focus();
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
  useEffect(() => {
    if (!query.trim() || !cloudModeEnabled) {
      setCloudAnswer(null);
      return undefined;
    }
    const timeout = window.setTimeout(async () => {
      setAnswerLoading(true);
      const { data, error } = await supabase.functions.invoke(appConfig.askFunctionName, { body: { query } });
      setCloudAnswer(error ? { error: 'Cloud retrieval is unavailable. Showing local sources.' } : data);
      setAnswerLoading(false);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => { if (mounted) setUser(data.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!user || !supabase) return;
    supabase.from('thoughts').select('id, body, created_at, updated_at').order('created_at', { ascending: false }).then(({ data }) => {
      if (!data?.length) {
        if (thoughts.length) {
          const rows = thoughts.map(thought => ({ id: thought.id, user_id: user.id, body: thought.text, created_at: thought.createdAt }));
          supabase.from('thoughts').upsert(rows).then(() => {});
        }
        return;
      }
      setThoughts(data.map((item, index) => ({ id: item.id, text: item.body, createdAt: item.created_at, updatedAt: item.updated_at, tone: ['coral', 'blue', 'green', 'yellow'][index % 4] })));
    });
  }, [user]);

  const results = useMemo(() => {
    if (!query.trim()) return thoughts;
    return thoughts.map(thought => ({ ...thought, score: scoreThought(thought, query) })).filter(thought => thought.score > 0).sort((a, b) => b.score - a.score);
  }, [thoughts, query]);
  const nudgeThought = useMemo(() => thoughts.find(thought => Date.now() - new Date(thought.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000), [thoughts]);
  const analyticsEvents = useMemo(() => readStorage('heap-events', []), [analyticsVersion]);
  const betaMetrics = useMemo(() => computeBetaMetrics(analyticsEvents), [analyticsEvents]);
  const usageActionCount = useMemo(
    () => analyticsEvents.filter(event => ['capture_made', 'ask_made', 'source_chip_opened', 'task_handoff_created', 'day_active'].includes(event.name)).length,
    [analyticsEvents]
  );

  function syncEventToCloud(entry) {
    if (!user || !supabase) return;
    supabase.from('beta_events').insert({ user_id: user.id, event_name: entry.name, metadata: entry }).then(() => {});
  }

  function recordEvent(name, payload = {}) {
    const entry = trackEvent(name, payload);
    setAnalyticsVersion(value => value + 1);
    syncEventToCloud(entry);
    return entry;
  }

  function rewardCoinsForUsage(eventName) {
    const amount = COIN_REWARDS[eventName] || 0;
    if (!amount) return;
    setCoins(value => value + amount);
    recordEvent('coins_earned', { source: eventName, amount });
  }

  function usageDiscountRate() {
    if (usageActionCount >= 120) return 0.3;
    if (usageActionCount >= 80) return 0.2;
    if (usageActionCount >= 40) return 0.1;
    return 0;
  }

  function themeCost(theme) {
    if (theme.baseCost === 0) return 0;
    return Math.max(30, Math.round(theme.baseCost * (1 - usageDiscountRate())));
  }

  function unlockOrApplyTheme(theme) {
    if (unlockedThemes.includes(theme.id)) {
      setActiveTheme(theme.id);
      recordEvent('theme_applied', { themeId: theme.id });
      return;
    }
    const cost = themeCost(theme);
    if (coins < cost) {
      setToast(`Need ${cost - coins} more coins for ${theme.name}`);
      setTimeout(() => setToast(''), 2200);
      return;
    }
    setCoins(value => value - cost);
    setUnlockedThemes(value => [...value, theme.id]);
    setActiveTheme(theme.id);
    recordEvent('theme_unlocked', { themeId: theme.id, cost });
    recordEvent('theme_applied', { themeId: theme.id });
    setToast(`${theme.name} unlocked`);
    setTimeout(() => setToast(''), 2200);
  }

  function markActiveDay() {
    const key = dayKey();
    const activeDays = readStorage('heap-active-days', []);
    if (!Array.isArray(activeDays) || !activeDays.includes(key)) {
      const next = Array.isArray(activeDays) ? [...activeDays, key] : [key];
      localStorage.setItem('heap-active-days', JSON.stringify(next));
      recordEvent('day_active', { day: key });
      rewardCoinsForUsage('day_active');
    }
  }

  function capture(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    const thought = { id: crypto.randomUUID(), text: draft.trim(), createdAt: new Date().toISOString(), tone: ['coral', 'blue', 'green', 'yellow'][thoughts.length % 4] };
    setThoughts([thought, ...thoughts]);
    if (user && supabase) supabase.from('thoughts').insert({ id: thought.id, user_id: user.id, body: thought.text, created_at: thought.createdAt }).then(({ error }) => { if (error) setToast('Saved locally; cloud sync needs attention'); });
    recordEvent('capture_made', { thoughtId: thought.id, length: thought.text.length });
    rewardCoinsForUsage('capture_made');
    setDraft('');
    setToast('Dropped into your heap');
    setTimeout(() => setToast(''), 2200);
  }

  function ask(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setAsks(value => value + 1);
    recordEvent('ask_made', { queryLength: query.trim().length });
    rewardCoinsForUsage('ask_made');
  }

  function makeTaskFromQuestion() {
    const tasks = readStorage('heap-tasks', []);
    const nextTask = { id: Date.now(), text: query.trim(), priority: 'medium', due: '', completed: false };
    localStorage.setItem('heap-tasks', JSON.stringify([nextTask, ...(Array.isArray(tasks) ? tasks : [])]));
    recordEvent('task_handoff_created', { queryLength: query.trim().length });
    rewardCoinsForUsage('task_handoff_created');
    setActiveView('tasks');
    setToast('Question added to Tasks');
    setTimeout(() => setToast(''), 2200);
  }

  function jumpToSource(thought) {
    recordEvent('source_chip_opened', { sourceThoughtId: thought.id });
    rewardCoinsForUsage('source_chip_opened');
    const element = document.querySelector(`[data-thought-id="${thought.id}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function reportTrustIssue() {
    if (!query.trim()) return;
    recordEvent('trust_break_reported', { queryPreview: query.trim().slice(0, 80) });
    setToast('Thanks. We logged this answer as untrusted.');
    setTimeout(() => setToast(''), 2200);
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
    downloadTextFile('heap-export.txt', `Heap export\n\n${content}`);
    setToast('Your heap is on its way out');
    setTimeout(() => setToast(''), 2200);
  }

  function exportAnalyticsCsv() {
    const rows = readStorage('heap-events', []);
    const header = ['id', 'name', 'at', 'day', 'payload'];
    const lines = rows.map(row => {
      const payload = { ...row };
      delete payload.id;
      delete payload.name;
      delete payload.at;
      delete payload.day;
      return [row.id, row.name, row.at, row.day, JSON.stringify(payload)].map(csvEscape).join(',');
    });
    const csv = [header.map(csvEscape).join(','), ...lines].join('\n');
    downloadTextFile('heap-analytics.csv', csv, 'text/csv');
    recordEvent('analytics_exported', { rows: rows.length });
    setToast('Analytics CSV exported');
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
    if (user && supabase) supabase.from('thoughts').update({ body: editingText.trim(), updated_at: new Date().toISOString() }).eq('id', id).then(() => {});
    setEditingId(null);
    setEditingText('');
  }

  function deleteThought(id) {
    if (!window.confirm('Delete this thought?')) return;
    setThoughts(items => items.filter(item => item.id !== id));
    if (user && supabase) supabase.from('thoughts').delete().eq('id', id).then(() => {});
    recordEvent('thought_deleted');
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabase || !authEmail.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail.trim(), options: { emailRedirectTo: window.location.origin } });
    setAuthMessage(error ? error.message : 'Check your email for a sign-in link.');
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setAuthOpen(false);
    setAuthMessage('');
  }

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  useEffect(() => {
    recordEvent('digest_viewed');
  }, []);

  useEffect(() => {
    markActiveDay();
    recordEvent('app_opened', { cloudMode: cloudModeEnabled });
    rewardCoinsForUsage('app_opened');
  }, []);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Brain size={18} /></span><span>heap</span></div>
      <button className="new-capture" onClick={() => document.querySelector('#capture-input')?.focus()}><Plus size={17} /> <span>New thought</span><kbd>⌘ N</kbd></button>
      <nav>
        <button className={activeView === 'today' ? 'nav-item active' : 'nav-item'} onClick={clearAll}><Inbox size={17} /><span>Today</span><b>{thoughts.filter(item => isToday(item.createdAt)).length}</b></button>
        <button className={activeView === 'all' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('all'); setQuery(''); }}><Library size={17} /><span>Everything</span><b>{thoughts.length}</b></button>
        <button className={activeView === 'tasks' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('tasks'); setQuery(''); }}><ListChecks size={17} /><span>Tasks</span></button>
        <button className={activeView === 'focus' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('focus'); setQuery(''); }}><Timer size={17} /><span>Focus</span></button>
        <button className={activeView === 'calendar' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('calendar'); setQuery(''); }}><CalendarDays size={17} /><span>Calendar</span></button>
      </nav>
      <section className="wallet-panel"><div className="wallet-balance"><Coins size={14} /><span>{coins} coins</span></div><button className="shop-btn" onClick={() => setThemeShopOpen(true)}><Palette size={14} /> Theme shop</button></section>
      <div className="sidebar-foot"><div className="status-dot"></div><span>{user ? user.email : cloudModeEnabled ? 'Cloud ready' : 'Local beta'}</span>{user ? <button className="auth-link" onClick={signOut} title="Sign out"><LogOut size={13} /></button> : cloudModeEnabled ? <button className="auth-link" onClick={() => setAuthOpen(true)} title="Sign in"><LogIn size={13} /></button> : <span className="sync">Local</span>}</div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">{query ? 'Searching your heap' : formatToday()}</p><h1>{query ? 'Here is what I found' : 'Good morning, Alex.'}</h1></div><div className="top-actions"><button className="export-btn" onClick={exportThoughts} title="Export your thoughts"><Download size={15} /> Export</button><button className="export-btn" onClick={exportAnalyticsCsv} title="Export beta analytics"><Download size={15} /> Metrics CSV</button>{installPrompt && <button className="export-btn install-btn" onClick={installApp} title="Install Heap"><Download size={15} /> Install</button>}<div className="profile">AS</div></div></header>
      <section className="ask-zone">
        <form className="ask-box" onSubmit={ask}><Search size={21} /><input id="ask-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ask your heap anything..." autoComplete="off" /><span className="ask-hint"><Command size={13} /> K</span>{query && <button type="button" className="clear-btn" onClick={clearAll}><X size={16} /></button>}</form>
        {query && <p className="result-meta">{results.length} {results.length === 1 ? 'thought' : 'thoughts'} found <span>·</span> based on your words, not folders</p>}
      </section>

      {query && <section className="answer-card"><div className="answer-heading"><span className="answer-badge"><Sparkles size={14} /> Heap answer</span><span className="answer-confidence">{answerLoading ? 'Searching your memory...' : cloudAnswer?.error ? 'Local sources' : results.length ? 'Grounded in your thoughts' : 'No source found'}</span></div><p className="answer-text">{cloudAnswer?.answer || buildAnswer(results, query)}</p>{results.length > 0 && <div className="answer-sources"><span>Sources</span>{results.slice(0, 3).map(thought => <button type="button" className="source-chip" key={thought.id} onClick={() => jumpToSource(thought)}>{formatTimestamp(thought.createdAt)} · {thought.text.slice(0, 54)}{thought.text.length > 54 ? '...' : ''}</button>)}</div>}<div className="answer-actions"><button className="answer-task" onClick={makeTaskFromQuestion}><Plus size={14} /> Turn this into a task</button><button type="button" className="answer-trust" onClick={reportTrustIssue}>I don't trust this answer</button></div></section>}

      {activeView === 'tasks' ? <TaskPanel /> : activeView === 'focus' ? <FocusPanel /> : activeView === 'calendar' ? <CalendarPanel /> : <>

      {!query && <section className="signal"><div className="signal-icon"><Sparkles size={19} /></div><div><strong>A small signal from your heap</strong><p>You have mentioned <em>launch</em> 3 times this week. Want to keep following that thread?</p></div><button onClick={() => setQuery('launch')}>Explore <ArrowUpRight size={15} /></button></section>}
      {!query && showNudge && nudgeThought && <section className="weekly-nudge"><div><span className="nudge-label"><Clock3 size={13} /> Still here</span><p>{nudgeThought.text}</p></div><button onClick={() => { localStorage.setItem('heap-nudge-dismissed', new Date().toISOString().slice(0, 10)); setShowNudge(false); }} title="Dismiss reminder"><X size={16} /></button></section>}

      <section className="content-grid">
        <div className="feed-column">
          <div className="section-heading"><h2>{query ? 'Matching thoughts' : activeView === 'all' ? 'Everything' : 'Your latest thoughts'}</h2><span>{query ? 'Most relevant first' : 'No filing required'}</span></div>
          <div className="thought-list">{results.length ? results.map(thought => <article className={`thought-card ${thought.tone}`} key={thought.id} data-thought-id={thought.id}><div className="thought-top"><span className="thought-type"><span className="tone-dot"></span> Thought</span><time><Clock3 size={13} /> {formatTimestamp(thought.createdAt)}</time><span className="thought-actions"><button onClick={() => beginEdit(thought)} title="Edit thought"><Pencil size={13} /></button><button onClick={() => deleteThought(thought.id)} title="Delete thought"><Trash2 size={13} /></button></span></div>{editingId === thought.id ? <form className="edit-form" onSubmit={event => saveEdit(event, thought.id)}><textarea value={editingText} onChange={event => setEditingText(event.target.value)} autoFocus /><div><button type="button" onClick={() => setEditingId(null)}>Cancel</button><button type="submit">Save</button></div></form> : <p>{thought.text}</p>}{query && <div className="evidence"><Check size={13} /> Source found in your heap</div>}</article>) : <div className="empty"><Search size={26} /><h3>{query ? 'Nothing yet' : 'Your heap is empty'}</h3><p>{query ? 'Try asking in a different way. Heap works best with natural language.' : 'Start with one thought below. It does not need a title or a folder.'}</p></div>}</div>
        </div>
        <aside className="right-rail"><div className="rail-card"><div className="rail-title"><span>Beta pulse</span><span className="live"><i></i> Live</span></div><div className="metric"><strong>{thoughts.length}</strong><span>thoughts captured</span></div><div className="metric"><strong>{asks}</strong><span>questions asked</span></div><div className="metric"><strong>{coins}</strong><span>coins earned</span></div><div className="progress-label"><span>Usage discount</span><span>{Math.round(usageDiscountRate() * 100)}%</span></div><div className="progress"><i style={{ width: `${Math.max(8, Math.round(usageDiscountRate() * 100))}%` }}></i></div></div><div className="rail-card"><div className="rail-title"><span>Validation KPIs</span><span className="live"><i></i> Auto</span></div><div className="kpi-row"><span>Activation</span><strong>{betaMetrics.activationRate}%</strong></div><div className="kpi-row"><span>Ask adoption</span><strong>{betaMetrics.askAdoptionRate}%</strong></div><div className="kpi-row"><span>Trust pass</span><strong>{betaMetrics.trustPassRate}%</strong></div><div className="kpi-row"><span>Return rate</span><strong>{betaMetrics.returnRate}%</strong></div><p className="kpi-meta">Day3 captures: {betaMetrics.capturesByDay3} · Day10 asks: {betaMetrics.asksByDay10} · Trust breaks: {betaMetrics.trustBreaks}</p></div><div className="rail-note"><Sparkles size={16} /><p>Keep dumping. The value compounds when you stop organizing.</p></div></aside>
      </section>
      </>}
    </main>

    <form className="capture-dock" onSubmit={capture}><div className="dock-icon"><Plus size={20} /></div><input id="capture-input" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Drop a thought here... no title, no folder" /><button className={listening ? 'voice-btn listening' : 'voice-btn'} type="button" onClick={toggleVoice} title={speechSupported ? 'Capture with your voice' : 'Voice capture unavailable'}><Mic size={17} /></button><button type="submit">Capture <ArrowUpRight size={15} /></button></form>
    {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    {showOnboarding && <div className="onboarding-backdrop"><section className="onboarding"><button className="onboarding-close" onClick={completeOnboarding} title="Close"><X size={17} /></button><span className="onboarding-mark"><Brain size={22} /></span><p className="eyebrow">A quieter place for your mind</p><h2>What's on your mind right now?</h2><p>Drop it here. No title, no folder, no need to make it neat. Heap will help you find it later.</p><button className="start-btn" onClick={completeOnboarding}>Start dumping <ArrowUpRight size={15} /></button></section></div>}
    {authOpen && <div className="onboarding-backdrop"><section className="onboarding auth-modal"><button className="onboarding-close" onClick={() => setAuthOpen(false)} title="Close"><X size={17} /></button><span className="onboarding-mark"><LogIn size={21} /></span><p className="eyebrow">Sync your heap</p><h2>Keep your thoughts with you.</h2><p>Sign in with a magic link to sync this heap across devices.</p><form onSubmit={signIn}><input className="auth-input" type="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} placeholder="you@example.com" required /><button className="start-btn" type="submit">Send magic link <ArrowUpRight size={15} /></button></form>{authMessage && <p className="auth-message">{authMessage}</p>}</section></div>}
    {themeShopOpen && <div className="onboarding-backdrop"><section className="onboarding theme-shop"><button className="onboarding-close" onClick={() => setThemeShopOpen(false)} title="Close"><X size={17} /></button><span className="onboarding-mark"><Palette size={21} /></span><p className="eyebrow">Theme market</p><h2>Unlock themes with usage coins.</h2><p>Coins are generated only when you use Heap. Active usage also lowers unlock prices.</p><div className="theme-list">{THEME_CATALOG.map(theme => { const unlocked = unlockedThemes.includes(theme.id); const cost = themeCost(theme); return <article key={theme.id} className={activeTheme === theme.id ? 'theme-item active' : 'theme-item'}><div><h3>{theme.name}</h3><p>{theme.note}</p><span>{cost === 0 ? 'Free' : `${cost} coins`}</span></div><button onClick={() => unlockOrApplyTheme(theme)}>{unlocked ? (activeTheme === theme.id ? 'Applied' : 'Apply') : 'Unlock'}</button></article>; })}</div></section></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
