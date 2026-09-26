// 界面层：新建角色。入团章节决定第一段任期的起点。
import React, { useState } from 'react';
import { orderedSessions } from '../data/order.js';
import { Modal } from './Modal.jsx';

const COLORS = ['#d8a153', '#93b7a6', '#b9a6d1', '#c98a7d', '#7d9ec9', '#8fb086'];

export function CharacterForm({ campaign, onClose, onSaved, store }) {
  const sessions = orderedSessions(campaign);
  const [form, setForm] = useState({
    name: '',
    role: '',
    player: '',
    color: COLORS[campaign.characters.length % COLORS.length],
    fromSessionId: sessions.at(-1)?.id || ''
  });

  const save = () => {
    if (!form.name.trim()) return;
    store.addCharacter(form);
    onSaved(form.name.trim());
  };

  return (
    <Modal crumb="NEW CHARACTER" title="新角色入团" onClose={onClose}>
      <label>
        角色名
        <input
          autoFocus
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="例：伊琳"
          value={form.name}
        />
      </label>
      <label>
        职业 / 身份
        <input
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          placeholder="例：流浪法师"
          value={form.role}
        />
      </label>
      <label>
        玩家
        <input
          onChange={(e) => setForm({ ...form, player: e.target.value })}
          placeholder="玩家姓名"
          value={form.player}
        />
      </label>
      <label>
        入团章节
        <select
          onChange={(e) => setForm({ ...form, fromSessionId: e.target.value })}
          value={form.fromSessionId}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        卡片颜色
        <div className="color-row">
          {COLORS.map((col) => (
            <button
              key={col}
              className={'color-dot ' + (form.color === col ? 'on' : '')}
              onClick={() => setForm({ ...form, color: col })}
              style={{ background: col }}
              type="button"
            />
          ))}
        </div>
      </label>
      <button className="primary full" disabled={!form.name.trim()} onClick={save}>
        入团
      </button>
    </Modal>
  );
}
