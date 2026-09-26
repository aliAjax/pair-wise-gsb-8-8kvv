// 界面层：归档库。重开战役会完整快照；归档详情沿线索展示来源、角色变化、后续出处、最终收束。
import React, { useState } from 'react';
import { rosterTimeline, conflictList } from '../rules/archive.js';
import { Modal } from './Modal.jsx';

export function Archives({ campaign, archives, store, notice }) {
  const [restarting, setRestarting] = useState(false);
  const [viewing, setViewing] = useState(null);

  return (
    <section className="board">
      <div className="board-head">
        <div>
          <span className="board-count">
            已归档 {archives.length} 场战役。重开会把当前战役连同线索链路、角色任期、关闭冲突完整存档。
          </span>
        </div>
        <button className="primary" onClick={() => setRestarting(true)}>
          ↻ 重开战役
        </button>
      </div>

      <div className="archive-grid">
        {archives.length === 0 && (
          <div className="board-empty">还没有归档。重开当前战役后，这里会出现完整快照。</div>
        )}
        {archives.map((a) => (
          <article className="archive-card" key={a.id}>
            <div className="arc-top">
              <span className="tag">ARCHIVE</span>
              <small>{new Date(a.archivedAt).toLocaleString('zh-CN')}</small>
            </div>
            <h3>{a.name}</h3>
            <p>{a.system}</p>
            <div className="arc-meta">
              <span>{a.chapterCount} 章</span>
              <span>{a.clueTrails.filter((t) => t.status === 'closed').length} 条线索收束</span>
              <span className={a.openClueCount ? 'warn' : ''}>
                {a.openClueCount} 条未解
              </span>
            </div>
            {a.note && <p className="arc-note">{a.note}</p>}
            <div className="row-end">
              <button className="outline sm" onClick={() => setViewing(a)}>
                沿线索复盘 ↗
              </button>
            </div>
          </article>
        ))}
      </div>

      {restarting && (
        <RestartForm
          campaign={campaign}
          onClose={() => setRestarting(false)}
          onConfirm={(payload) => {
            store.restartCampaign(payload);
            setRestarting(false);
            notice(`「${campaign.name}」已归档，新战役「${payload.name || '新的战役'}」开始`);
          }}
        />
      )}
      {viewing && (
        <ArchiveDetail archive={viewing} onClose={() => setViewing(null)} />
      )}
    </section>
  );
}

function RestartForm({ campaign, onClose, onConfirm }) {
  const [form, setForm] = useState({ name: '', system: campaign.system || '', note: '' });
  return (
    <Modal crumb="RESTART CAMPAIGN" title="重开战役" onClose={onClose}>
      <div className="warn-box">
        当前战役「{campaign.name}」（{campaign.sessions.length} 章、
        {campaign.clues.length} 条线索）将整体归档，不会被删除；之后可在归档库沿线索复盘。
      </div>
      <label>
        新战役名称
        <input
          autoFocus
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="例：潮下之城"
          value={form.name}
        />
      </label>
      <label>
        规则系统
        <input
          onChange={(e) => setForm({ ...form, system: e.target.value })}
          value={form.system}
        />
      </label>
      <label>
        归档备注（可选）
        <textarea
          rows={2}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="例：团暂告段落，伏笔留待续团"
          value={form.note}
        />
      </label>
      <button className="primary full danger" onClick={() => onConfirm(form)}>
        归档并重开
      </button>
    </Modal>
  );
}

function ArchiveDetail({ archive, onClose }) {
  const snap = archive.snapshot;
  const roster = rosterTimeline(snap);
  const conflicts = conflictList(snap);
  const [tab, setTab] = useState('clues');

  return (
    <Modal crumb="ARCHIVE REVIEW" title={`复盘 · ${archive.name}`} onClose={onClose} wide>
      <div className="arc-tabs">
        {[
          ['clues', `线索链路（${archive.clueTrails.length}）`],
          ['roster', `角色变化（${roster.length}）`],
          ['conflicts', `关闭冲突（${conflicts.length}）`]
        ].map(([id, t]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'clues' && (
        <div className="review-list">
          {archive.clueTrails.map((t) => (
            <div className={'review-clue ' + t.status} key={t.id}>
              <div className="review-clue-head">
                <span className={'clue-dot ' + t.status} />
                <b>{t.title}</b>
                <i>{t.status === 'closed' ? '已收束' : '未解'}</i>
              </div>
              <p className="muted">{snap.clues.find((c) => c.id === t.id)?.detail}</p>
              <div className="trace">
                <div className="trace-node origin">
                  <i>起</i>
                  <div>
                    <b>{t.originTitle}</b>
                    <p>来源章节 · 经办：{t.ownerName}</p>
                  </div>
                </div>
                {t.followUps.map((f, i) => (
                  <div className="trace-node" key={i}>
                    <i>续</i>
                    <div>
                      <b>{f.sessionTitle}</b>
                      <p>{f.note}</p>
                    </div>
                  </div>
                ))}
                {t.status === 'closed' && (
                  <div className="trace-node close-node">
                    <i>合</i>
                    <div>
                      <b>{t.closeTitle}</b>
                      <p>{t.conclusion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {archive.clueTrails.length === 0 && <p className="muted">这场战役没有留下线索。</p>}
        </div>
      )}

      {tab === 'roster' && (
        <div className="review-list">
          {roster.map((r) => (
            <div className="review-char" key={r.id}>
              <div className="review-clue-head">
                <b>
                  {r.name} <small>{r.role} · {r.player}</small>
                </b>
                <i>{r.active ? '在队' : '离队中'}</i>
              </div>
              <div className="tenure-timeline">
                {r.tenures.map((t, i) => (
                  <div className="tenure-row" key={i}>
                    <span className="tenure-no">{i + 1}</span>
                    <div>
                      <b>
                        {t.fromTitle} → {t.toTitle || '至今'}
                      </b>
                      <p>{t.note || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="muted appear-line">出场：{r.appearances.join('、') || '无'}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'conflicts' && (
        <div className="review-list">
          {conflicts.length === 0 && (
            <p className="muted">没有重复关闭，所有线索都只收束过一次。</p>
          )}
          {conflicts.map((cf) => (
            <div className="conflict-row" key={cf.id}>
              <p>
                线索 <b>「{cf.clueTitle}」</b>在 <b>{cf.attemptedTitle}</b>{' '}
                被再次要求关闭；其原状态为 <b>{cf.originalStatus === 'closed' ? '已收束' : '未解'}</b>
                {cf.originalCloseTitle && <>，最早收束于 <b>{cf.originalCloseTitle}</b></>}，
                按规则只保留最早一次。
              </p>
              {cf.rejectedConclusion && (
                <p className="rejected">未采纳：{cf.rejectedConclusion}</p>
              )}
              {cf.originalConclusion && <p className="kept">已保留：{cf.originalConclusion}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
