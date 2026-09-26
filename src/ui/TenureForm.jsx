// 界面层：离队 / 归队表单。离队当章仍可出场，之后章节在 UI 上禁选。
import React, { useState } from 'react';
import { orderedSessions, chapterNo } from '../data/order.js';
import { Modal } from './Modal.jsx';

export function TenureForm({ campaign, c, mode, onClose, onSaved }) {
  const sessions = orderedSessions(campaign);

  // 离队：默认当前最后一章；归队：默认下一章（用最后一章占位，由 GM 选择）。
  const defaultId = sessions.at(-1)?.id || '';
  const [sessionId, setSessionId] = useState(defaultId);
  const [note, setNote] = useState('');

  let allowedIds = sessions.map((s) => s.id);
  if (mode === 'leave') {
    // 离队点不能早于当前任期起点。
    const openTenure = (c.tenures || []).find((t) => t.to === null);
    const minNo = openTenure ? chapterNo(campaign, openTenure.from) : 1;
    allowedIds = sessions.filter((s) => chapterNo(campaign, s.id) >= minNo).map((s) => s.id);
  } else {
    // 归队点必须严格晚于上一段任期的结束章（不能与离队章相同）。
    const lastTenure = (c.tenures || []).at(-1);
    const minNo = lastTenure?.to ? chapterNo(campaign, lastTenure.to) + 1 : 1;
    allowedIds = sessions.filter((s) => chapterNo(campaign, s.id) >= minNo).map((s) => s.id);
  }

  const valid = sessionId && allowedIds.includes(sessionId);

  return (
    <Modal
      crumb={mode === 'leave' ? 'LEAVE PARTY' : 'REJOIN PARTY'}
      title={mode === 'leave' ? `${c.name} 离队` : `${c.name} 归队`}
      onClose={onClose}
    >
      <p className="form-hint">
        {mode === 'leave'
          ? '离队当章仍可出场；离队之后的章节不能再勾选为参与人，旧出场记录保留。'
          : '归队会另起一段任期经历，与旧任期并列保存。'}
      </p>
      <label>
        {mode === 'leave' ? '最后出场章节' : '归队章节'}
        <select value={valid ? sessionId : ''} onChange={(e) => setSessionId(e.target.value)}>
          {!valid && <option value="">请选择章节</option>}
          {sessions
            .filter((s) => allowedIds.includes(s.id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        备注
        <textarea
          rows={3}
          onChange={(e) => setNote(e.target.value)}
          placeholder={mode === 'leave' ? '为何离队？' : '为何归来？'}
          value={note}
        />
      </label>
      <button
        className="primary full"
        disabled={!valid}
        onClick={() => valid && onSaved({ sessionId, note })}
      >
        {mode === 'leave' ? '确认离队' : '确认归队'}
      </button>
    </Modal>
  );
}
