// 界面层：新建章节表单。
import React, { useState } from 'react';
import { Modal } from './Modal.jsx';

const COLORS = ['#d8a153', '#93b7a6', '#b9a6d1', '#c98a7d', '#7d9ec9', '#8fb086'];

export function ChapterForm({ campaign, onClose, onSaved, store }) {
  const last = [...campaign.sessions].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )[0];
  const [form, setForm] = useState({
    title: '',
    date: last ? nextDate(last.date) : '2024-07-01',
    summary: '',
    tag: '主线',
    color: COLORS[campaign.sessions.length % COLORS.length]
  });

  const save = () => {
    if (!form.title.trim()) return;
    const id = store.addSession(form);
    onSaved(id, form.title.trim());
  };

  return (
    <Modal crumb="NEW CHAPTER" title="记录新的章节" onClose={onClose}>
      <label>
        章节标题
        <input
          autoFocus
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="例：第三章：月下集市"
          value={form.title}
        />
      </label>
      <label>
        游戏日期
        <input
          type="date"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          value={form.date}
        />
      </label>
      <label>
        章节摘要
        <textarea
          rows={3}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="发生了什么？"
          value={form.summary}
        />
      </label>
      <label>
        章节类型
        <select onChange={(e) => setForm({ ...form, tag: e.target.value })} value={form.tag}>
          <option>主线</option>
          <option>支线</option>
          <option>番外</option>
        </select>
      </label>
      <label>
        章节色
        <div className="color-row">
          {COLORS.map((col) => (
            <button
              key={col}
              type="button"
              className={'color-dot ' + (form.color === col ? 'on' : '')}
              onClick={() => setForm({ ...form, color: col })}
              style={{ background: col }}
            />
          ))}
        </div>
      </label>
      <button className="primary full" disabled={!form.title.trim()} onClick={save}>
        保存章节
      </button>
    </Modal>
  );
}

function nextDate(d) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + 7);
  return dt.toISOString().slice(0, 10);
}
