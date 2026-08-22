import React, { useEffect, useState } from 'react';
import { Check, Pause, Play, RotateCcw, Timer } from 'lucide-react';

const DEFAULT_MINUTES = 25;
const PRESETS = [25, 50, 75];

export default function FocusPanel() {
  const [duration, setDuration] = useState(() => Number(localStorage.getItem('heap-focus-duration') || DEFAULT_MINUTES));
  const [seconds, setSeconds] = useState(() => Number(localStorage.getItem('heap-focus-seconds') || DEFAULT_MINUTES * 60));
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(() => Number(localStorage.getItem('heap-focus-sessions') || 0));
  const sessionSeconds = duration * 60;

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setSeconds(value => {
      if (value <= 1) {
        setRunning(false);
        setSessions(count => count + 1);
        return sessionSeconds;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, sessionSeconds]);

  useEffect(() => localStorage.setItem('heap-focus-duration', String(duration)), [duration]);
  useEffect(() => localStorage.setItem('heap-focus-seconds', String(seconds)), [seconds]);
  useEffect(() => localStorage.setItem('heap-focus-sessions', String(sessions)), [sessions]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  const progress = Math.min(100, Math.max(0, ((sessionSeconds - seconds) / sessionSeconds) * 100));

  function changeDuration(minutes) {
    const nextDuration = Math.min(240, Math.max(1, minutes));
    setRunning(false);
    setDuration(nextDuration);
    setSeconds(nextDuration * 60);
  }

  return <section className="focus-workspace">
    <div className="focus-header"><div><p className="eyebrow">Make room for one thing</p><h2>Focus, gently.</h2><p>One small session is enough to move something forward.</p></div><div className="focus-sessions"><strong>{sessions}</strong><span>sessions completed</span></div></div>
    <div className="focus-stage"><div className="duration-picker"><span>Session length</span><div className="duration-presets">{PRESETS.map(preset => <button className={duration === preset ? 'duration-option selected' : 'duration-option'} onClick={() => changeDuration(preset)} key={preset}>{preset} min</button>)}<label className={PRESETS.includes(duration) ? 'duration-custom' : 'duration-custom selected'}><input type="number" min="1" max="240" value={PRESETS.includes(duration) ? '' : duration} placeholder="Other" onChange={event => changeDuration(Number(event.target.value) || DEFAULT_MINUTES)} /> min</label></div></div><div className="focus-ring" style={{ '--progress': `${progress}%` }}><div className="focus-time"><Timer size={18} /><strong>{minutes}:{remainder}</strong><span>{running ? 'In progress' : `${duration} minute session`}</span></div></div><div className="focus-controls"><button className="focus-primary" onClick={() => setRunning(value => !value)}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? 'Pause session' : 'Start focus'}</button><button className="focus-reset" onClick={() => { setRunning(false); setSeconds(sessionSeconds); }} title="Reset timer"><RotateCcw size={16} /></button></div><p className="focus-note"><Check size={14} /> Your thoughts stay here while you focus.</p></div>
  </section>;
}
