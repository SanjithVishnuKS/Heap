import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Circle, Flag, Plus, Trash2 } from 'lucide-react';

const priorities = { low: 'Low', medium: 'Medium', high: 'High' };

function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem('heap-tasks') || '[]');
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

export default function TaskPanel() {
  const [tasks, setTasks] = useState(loadTasks);
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('');

  useEffect(() => localStorage.setItem('heap-tasks', JSON.stringify(tasks)), [tasks]);

  function addTask(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setTasks([{ id: Date.now(), text: draft.trim(), priority, due, completed: false }, ...tasks]);
    setDraft('');
    setDue('');
  }

  function toggleTask(id) {
    setTasks(items => items.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function removeTask(id) {
    setTasks(items => items.filter(task => task.id !== id));
  }

  const remaining = tasks.filter(task => !task.completed).length;
  return <section className="task-workspace">
    <div className="task-header"><div><p className="eyebrow">Lightweight planning</p><h2>Tasks, without leaving Heap.</h2><p>Turn a thought into an action only when it needs one.</p></div><span className="task-count">{remaining} open</span></div>
    <form className="task-composer" onSubmit={addTask}><Plus size={18} /><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="What needs doing?" /><select value={priority} onChange={event => setPriority(event.target.value)} aria-label="Priority">{Object.entries(priorities).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><input type="date" value={due} onChange={event => setDue(event.target.value)} aria-label="Due date" /><button type="submit">Add task</button></form>
    <div className="task-list">{tasks.length ? tasks.map(task => <article className={task.completed ? 'task-row completed' : 'task-row'} key={task.id}><button className="task-check" onClick={() => toggleTask(task.id)} title={task.completed ? 'Mark incomplete' : 'Complete task'}>{task.completed ? <Check size={15} /> : <Circle size={15} />}</button><span className="task-text">{task.text}</span><span className={`priority ${task.priority}`}><Flag size={12} /> {priorities[task.priority]}</span>{task.due && <span className="task-due"><CalendarDays size={12} /> {task.due}</span>}<button className="task-delete" onClick={() => removeTask(task.id)} title="Delete task"><Trash2 size={14} /></button></article>) : <div className="task-empty"><Check size={22} /><h3>No tasks yet</h3><p>Keep your heap messy. Add structure only when something needs action.</p></div>}</div>
  </section>;
}
