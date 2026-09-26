// 界面层：给线索补一条"后续出处"——进展记在某个章节名下。
import React, { useState } from 'react';
import { orderedSessions } from '../data/order.js';
import { Modal } from './Modal.jsx';

export function FollowUpForm({ campaign, clue, onClose, onSaved, store }) {
  const sessions = orderedSessions(campaign);
  const [form, setForm] = useState({
    sessionId: sessions.at(-1)?.id || '',
    note: ''
  });

  const save = () => {
    if (!form.note.trim() || !form.sessionId) return;
    store.addFollowUp({ clueId: clue.id, ...form });
    onSaved();
  };

  return (
    <Modal crumb="FOLLOW-UP" title={`后续出处 · ${clue.title}`} onClose={onClose}>
      <p className="form-hint">这条线索之后在哪一章有了新进展？换章也不会丢。</p>
      <label>
        出处章节
        <select
          onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
          value={form.sessionId}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        进展记录
        <textarea
          autoFocus
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="例：伊琳认出符文属于潮语者，建议去月下集市。"
          rows={3}
          value={form.note}
        />
      </label>
      <button className="primary full" disabled={!form.note.trim()} onClick={save}>
        追加出处
      </button>
    </Modal>
  );
}
