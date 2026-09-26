// 界面层：收束线索——必须关联收束章节、必填结论。
import React, { useState } from 'react';
import { orderedSessions, chapterNo } from '../data/order.js';
import { Modal } from './Modal.jsx';

export function CloseClueForm({ campaign, clue, onClose, onSaved, store }) {
  const sessions = orderedSessions(campaign);
  // 默认收束章节取线索来源章之后的最近一章（通常是当前章）。
  const originNo = chapterNo(campaign, clue.originSessionId);
  const defaultClose =
    sessions
      .filter((s) => chapterNo(campaign, s.id) >= originNo)
      .at(-1)?.id || clue.originSessionId;

  const [form, setForm] = useState({ closeSessionId: defaultClose, conclusion: '' });

  const save = () => {
    if (!form.conclusion.trim() || !form.closeSessionId) return;
    const conflict = store.closeClue(clue.id, form);
    onSaved(conflict);
  };

  return (
    <Modal crumb="RESOLVE CLUE" title={`收束线索 · ${clue.title}`} onClose={onClose}>
      <p className="form-hint">关闭时写清结论，并关联最终收束章节。</p>
      <label>
        收束章节
        <select
          onChange={(e) => setForm({ ...form, closeSessionId: e.target.value })}
          value={form.closeSessionId}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        结论
        <textarea
          autoFocus
          onChange={(e) => setForm({ ...form, conclusion: e.target.value })}
          placeholder="这条线索最终的答案是什么？"
          rows={4}
          value={form.conclusion}
        />
      </label>
      {rejectHint && <p className="form-error">{rejectHint}</p>}
      <button className="primary full" disabled={!form.conclusion.trim()} onClick={save}>
        确认收束
      </button>
    </Modal>
  );
}
