import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Link2, Plus, Trash2 } from 'lucide-react';

function loadEvents() {
  try {
    const events = JSON.parse(localStorage.getItem('heap-calendar-events') || '[]');
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarPanel() {
  const [events, setEvents] = useState(loadEvents);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');

  useEffect(() => localStorage.setItem('heap-calendar-events', JSON.stringify(events)), [events]);

  const visibleEvents = useMemo(() => events.filter(event => event.date === date).sort((a, b) => a.time.localeCompare(b.time)), [events, date]);

  function addEvent(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setEvents([...events, { id: Date.now(), title: title.trim(), date, time, duration }]);
    setTitle('');
  }

  return <section className="calendar-workspace">
    <div className="calendar-header"><div><p className="eyebrow">Time blocking</p><h2>Make space for the work.</h2><p>Put a task on the clock when it needs more than a reminder.</p></div><span className="calendar-status"><i></i> Local calendar</span></div>
    <div className="calendar-toolbar"><label><CalendarDays size={15} /><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><button className="connect-calendar" title="Connect Google or Outlook calendar"><Link2 size={15} /> Connect calendar</button></div>
    <form className="event-composer" onSubmit={addEvent}><Plus size={17} /><input value={title} onChange={event => setTitle(event.target.value)} placeholder="Block time for..." /><input type="time" value={time} onChange={event => setTime(event.target.value)} aria-label="Event time" /><select value={duration} onChange={event => setDuration(event.target.value)} aria-label="Event duration"><option value="25">25 min</option><option value="50">50 min</option><option value="75">75 min</option><option value="120">2 hours</option></select><button type="submit">Add block</button></form>
    <div className="agenda-list">{visibleEvents.length ? visibleEvents.map(event => <article className="agenda-row" key={event.id}><span className="agenda-time"><Clock3 size={13} /> {event.time}</span><span className="agenda-title">{event.title}</span><span className="agenda-duration">{event.duration} min</span><button onClick={() => setEvents(items => items.filter(item => item.id !== event.id))} title="Delete time block"><Trash2 size={14} /></button></article>) : <div className="calendar-empty"><CalendarDays size={23} /><h3>No time blocks yet</h3><p>Choose a date and reserve a little time for something that matters.</p></div>}</div>
    <div className="calendar-note"><Link2 size={15} /><p>Google Calendar and Outlook sync are ready for OAuth wiring. Local blocks stay available while no account is connected.</p></div>
  </section>;
}
