// 界面层：登记新线索（来源章节 + 经办角色）。
import React, { useState } from 'react';
import { orderedSessions } from '../data/order.js';
import { Modal } from './Modal.jsx';

export function ClueForm({ campaign, defaultSessionId, onClose, onSaved, store }) {
  const sessions = orderedSessions(campaign);
  const [form, setForm] = useState({
    title: '',
    detail: '',
    originSessionId: defaultSessionId || sessions[0]?.id || '',
    ownerCharId: campaign.characters[0]?.id || ''
  });

  const save = () => {
    if (!form.title.trim() || !form.originSessionId) return;
    store.addClue(form);
    onSaved(form.title.trim());
  };

  return (
    <Modal crumb="NEW CLUE" title="登记线索" onClose={onClose}>
      <label>
        线索名称
        <input
          autoFocus
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="例：钟楼符文"
          value={form.title}
        />
      </label>
      <label>
        来源章节
        <select
          onChange={(e) => setForm({ ...form, originSessionId: e.target.value })}
          value={form.originSessionId}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}（{s.date}）
            </option>
          ))}
        </select>
      </label>
      <label>
        经办角色
        <select
          onChange={(e) => setForm({ ...form, ownerCharId: e.target.value })}
          value={form.ownerCharId}
        >
          <option value="">未指派</option>
          {campaign.characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}（{c.role}）
            </option>
          ))}
        </select>
      </label>
      <label>
        线索内容
        <textarea
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
          placeholder="发现了什么？指向哪里？"
          rows={3}
          value={form.detail}
        />
      </label>
      <button className="primary full" disabled={!form.title.trim()} onClick={save}>
        保存线索
      </button>
    </Modal>
  );
}
