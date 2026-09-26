// 界面层：时间线 + 章节详情面板（参与人、线索结转、章节结算）。
import React, { useMemo, useState } from 'react';
import { orderedSessions, getNextSession } from '../data/order.js';
import {
  eligibleParticipants,
  ineligibleParticipants
} from '../rules/participation.js';
import {
  cluesOriginatedIn,
  carriedInto
} from '../rules/clues.js';
import { buildSettlement } from '../rules/settlement.js';
import { chapterLabel } from './labels.js';
import { ChapterForm } from './ChapterForm.jsx';
import { SettleDialog } from './SettleDialog.jsx';
import { ClueForm } from './ClueForm.jsx';

export function Timeline({ campaign, store, active, setActive, setTab, notice }) {
  const [show, setShow] = useState(false);
  const [settleFor, setSettleFor] = useState(null);
  const [addClueFor, setAddClueFor] = useState(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const sessions = useMemo(() => orderedSessions(campaign), [campaign]);
  const cur = sessions.find((s) => s.id === active) || sessions[0] || null;

  if (!cur) {
    return (
      <section className="empty">
        <div>◌</div>
        <h2>战役还没有章节</h2>
        <p>新建第一章，开始记录冒险；线索、参与人与结算都会围绕章节组织。</p>
        <button className="primary" onClick={() => setShow(true)}>
          ＋ 新建第一章
        </button>
        {show && (
          <ChapterForm
            campaign={campaign}
            onClose={() => setShow(false)}
            onSaved={(id, title) => {
              setShow(false);
              setActive(id);
              notice(`章节「${title}」已加入时间线`);
            }}
            store={store}
          />
        )}
      </section>
    );
  }

  const index = sessions.findIndex((s) => s.id === cur.id);
  const eligible = eligibleParticipants(campaign, cur.id);
  const blocked = ineligibleParticipants(campaign, cur.id);
  const bornHere = cluesOriginatedIn(campaign, cur.id);
  const carried = carriedInto(campaign, cur.id);
  const updatesHere = campaign.followUps.filter((f) => f.sessionId === cur.id);
  const next = getNextSession(campaign, cur.id);

  const toggle = (cid) => {
    const ok = store.toggleParticipant(cur.id, cid);
    if (!ok) {
      const c = campaign.characters.find((x) => x.id === cid);
      notice(`${c?.name || '该角色'}此时不在队，不能勾选为本章参与人`);
    }
  };

  const saveSummary = () => {
    store.updateSession(cur.id, { summary: summaryDraft });
    setEditingSummary(false);
    notice('章节摘要已更新');
  };

  return (
    <div className="timeline-layout">
      <section className="timeline">
        <div className="timeline-intro">
          <div>
            <span>THE CHRONICLE</span>
            <h2>记录每一次冒险</h2>
          </div>
          <button className="outline sm" onClick={() => setShow(true)}>
            ＋ 新建章节
          </button>
        </div>
        {sessions.map((s, i) => (
          <button
            className={'chapter ' + (active === s.id ? 'selected' : '')}
            key={s.id}
            onClick={() => setActive(s.id)}
          >
            <div className="date">
              <b>
                {new Date(s.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
              </b>
              <small>{new Date(s.date).getFullYear()}</small>
            </div>
            <div className="line">
              <span style={{ background: s.color }}></span>
              {i < sessions.length - 1 && <i />}
            </div>
            <div className="chapter-copy">
              <div className="tag-row">
                <div className="tag">{s.tag}</div>
                {s.settled && <span className="settled-chip">已结算</span>}
              </div>
              <h3>{s.title}</h3>
              <p>{s.summary}</p>
            </div>
            <span className="arrow">↗</span>
          </button>
        ))}
      </section>

      <section className="detail-panel">
        <div className="detail-cover" style={{ background: cur.color }}>
          <span>CHAPTER {String(index + 1).padStart(2, '0')}</span>
          <i>✦</i>
        </div>
        <div className="detail-body">
          <div className="tag-row">
            <span className="tag">{cur.tag}</span>
            {cur.settled ? (
              <button className="link sm" onClick={() => store.reopen(cur.id)}>
                ↺ 取消结算（重新编辑）
              </button>
            ) : (
              <button className="primary sm" onClick={() => setSettleFor(cur)}>
                ✓ 章节结算
              </button>
            )}
          </div>
          <h2>{cur.title}</h2>

          {editingSummary ? (
            <div className="summary-edit">
              <textarea
                rows={4}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
              />
              <div className="row-end">
                <button className="outline sm" onClick={() => setEditingSummary(false)}>
                  取消
                </button>
                <button className="primary sm" onClick={saveSummary}>
                  保存
                </button>
              </div>
            </div>
          ) : (
            <p className="summary-p">
              {cur.summary || '（还没有摘要）'}
              <button
                className="link sm"
                onClick={() => {
                  setSummaryDraft(cur.summary || '');
                  setEditingSummary(true);
                }}
              >
                编辑
              </button>
            </p>
          )}

          <div className="meta-grid">
            <div>
              <small>游戏日期</small>
              <strong>{cur.date}</strong>
            </div>
            <div>
              <small>参与人勾选</small>
              <strong>{(cur.participants || []).length} 人出场</strong>
            </div>
          </div>

          {/* 参与人：离队后的章节不可勾选 */}
          <div className="participants">
            <div className="block-title">
              <h4>本章参与人</h4>
              <small>仅在队角色可勾选；离队期间置灰</small>
            </div>
            <div className="p-checks">
              {eligible.map((c) => (
                <label key={c.id} className={'p-check ' + (cur.participants?.includes(c.id) ? 'on' : '')}>
                  <input
                    type="checkbox"
                    checked={!!cur.participants?.includes(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="avatar xs" style={{ background: c.color }}>
                    {c.name[0]}
                  </span>
                  {c.name}
                </label>
              ))}
              {blocked.map((c) => (
                <label key={c.id} className="p-check blocked" title="该角色此章节处于离队状态">
                  <input type="checkbox" disabled checked={false} readOnly />
                  <span className="avatar xs" style={{ background: c.color }}>
                    {c.name[0]}
                  </span>
                  {c.name}
                  <i>离队中</i>
                </label>
              ))}
            </div>
          </div>

          {/* 上章滚入的未解线索 */}
          <ClueSection
            title="滚入本章的未解线索"
            hint="上一章结算后未解线索自动进入下一章"
            clues={carried}
            campaign={campaign}
            empty="没有滚入的未解线索。"
            onJumpClue={() => setTab('clues')}
          />

          {/* 本章来源线索 */}
          <ClueSection
            title="本章来源线索"
            clues={bornHere}
            campaign={campaign}
            empty="本章还没有登记线索。"
            action={<button className="link sm" onClick={() => setAddClueFor(cur)}>＋ 登记</button>}
            onJumpClue={() => setTab('clues')}
          />

          {/* 本章作为后续出处 */}
          {updatesHere.length > 0 && (
            <div className="clue-section">
              <div className="block-title">
                <h4>本章出现的线索进展（{updatesHere.length}）</h4>
              </div>
              {updatesHere.map((f) => {
                const cl = campaign.clues.find((x) => x.id === f.clueId);
                return (
                  <div className="fu-row" key={f.id}>
                    <span className={'clue-dot ' + (cl?.status || 'open')} />
                    <b>{cl?.title || '已删除线索'}</b>
                    <p>{f.note}</p>
                    <button className="link sm" onClick={() => setTab('clues')}>
                      追踪板 ↗
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="settle-foot">
            {cur.settled ? (
              <span className="settled-line">本章已结算，线索与参与人已定稿；可随时取消结算修订。</span>
            ) : (
              <span className="muted">结算后，未解线索将滚入{next ? `「${next.title}」` : '下一章'}。</span>
            )}
          </div>
        </div>
      </section>

      {show && (
        <ChapterForm
          campaign={campaign}
          onClose={() => setShow(false)}
          onSaved={(id, title) => {
            setShow(false);
            setActive(id);
            notice(`章节「${title}」已加入时间线`);
          }}
          store={store}
        />
      )}
      {settleFor && (
        <SettleDialog
          campaign={campaign}
          session={settleFor}
          onClose={() => setSettleFor(null)}
          onConfirm={() => {
            store.settle(settleFor.id);
            setSettleFor(null);
            const r = buildSettlement(campaign, settleFor.id);
            notice(
              r.nextSession
                ? `已结算，${r.openCount} 条未解线索滚入下一章`
                : '已结算（最后一章）'
            );
          }}
        />
      )}
      {addClueFor && (
        <ClueForm
          campaign={campaign}
          defaultSessionId={addClueFor.id}
          onClose={() => setAddClueFor(null)}
          onSaved={() => {
            setAddClueFor(null);
            notice('线索已登记到本章');
          }}
          store={store}
        />
      )}
    </div>
  );
}

function ClueSection({ title, hint, clues, campaign, empty, action, onJumpClue }) {
  return (
    <div className="clue-section">
      <div className="block-title">
        <h4>
          {title}
          {clues.length > 0 && <em>（{clues.length}）</em>}
        </h4>
        {action}
      </div>
      {hint && <small className="block-hint">{hint}</small>}
      {clues.length === 0 && <p className="muted">{empty}</p>}
      {clues.map((cl) => (
        <button className="fu-row clue-link" key={cl.id} onClick={onJumpClue}>
          <span className={'clue-dot ' + cl.status} />
          <b>{cl.title}</b>
          <p>{cl.detail}</p>
          <i className={cl.status === 'closed' ? 'st-closed' : 'st-open'}>
            {cl.status === 'closed'
              ? `收束${chapterLabel(campaign, cl.closeSessionId)}`
              : '未解'}
          </i>
        </button>
      ))}
    </div>
  );
}
