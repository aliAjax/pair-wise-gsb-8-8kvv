// 界面层：线索追踪板。
// 每条线索可见：来源章节、经办角色、状态、后续出处；收束时写结论并关联章节。
import React, { useMemo, useState } from 'react';
import { orderedSessions, chapterNo } from '../data/order.js';
import { followUpsOf } from '../rules/clues.js';
import { chapterLabel, charName, statusText } from './labels.js';
import { ClueForm } from './ClueForm.jsx';
import { FollowUpForm } from './FollowUpForm.jsx';
import { CloseClueForm } from './CloseClueForm.jsx';

const FILTERS = [
  ['all', '全部'],
  ['open', '未解'],
  ['closed', '已收束']
];

export function CluesBoard({ campaign, store, setActiveSession, notice }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [followFor, setFollowFor] = useState(null);
  const [closing, setClosing] = useState(null);

  const sessions = useMemo(() => orderedSessions(campaign), [campaign]);
  const lastSessionId = sessions.at(-1)?.id || null;

  const rows = campaign.clues
    .filter((c) => filter === 'all' || c.status === filter)
    .sort((a, b) => a.createdOrder - b.createdOrder);

  const openCount = campaign.clues.filter((c) => c.status === 'open').length;
  const conflictsOf = (clueId) =>
    campaign.closeConflicts.filter((cf) => cf.clueId === clueId);

  return (
    <section className="board">
      <div className="board-head">
        <div>
          <span className="board-count">
            {campaign.clues.length} 条线索 · {openCount} 条未解，章节结算后自动滚入下一章
          </span>
        </div>
        <div className="board-actions">
          <div className="seg">
            {FILTERS.map(([id, t]) => (
              <button
                key={id}
                className={filter === id ? 'on' : ''}
                onClick={() => setFilter(id)}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="primary" disabled={!sessions.length} onClick={() => setAdding(true)}>
            ＋ 登记线索
          </button>
        </div>
      </div>

      {!sessions.length && (
        <div className="board-empty">还没有章节。先在时间线新建第一章，再来登记线索。</div>
      )}

      <div className="clue-list">
        {rows.map((clue) => {
          const fos = followUpsOf(campaign, clue.id);
          const carried = clue.status === 'open' && lastSessionId &&
            chapterNo(campaign, clue.originSessionId) < chapterNo(campaign, lastSessionId);
          const conflicts = conflictsOf(clue.id);
          const open = expanded === clue.id;
          return (
            <article
              key={clue.id}
              className={'clue-card ' + (clue.status === 'closed' ? 'is-closed' : '')}
            >
              <header className="clue-top" onClick={() => setExpanded(open ? null : clue.id)}>
                <span className={'clue-dot ' + clue.status} title={statusText(clue.status)} />
                <div className="clue-title">
                  <h3>{clue.title}</h3>
                  <p>{clue.detail || '暂无描述'}</p>
                </div>
                <span className={'clue-status ' + clue.status}>{statusText(clue.status)}</span>
                <span className="clue-caret">{open ? '▾' : '▸'}</span>
              </header>

              <div className="clue-meta">
                <span>
                  来源
                  <button
                    className="link"
                    onClick={() => setActiveSession(clue.originSessionId)}
                    title="跳到来源章节"
                  >
                    {chapterLabel(campaign, clue.originSessionId)}
                  </button>
                </span>
                <span>
                  经办
                  <b className="owner-chip">{charName(campaign, clue.ownerCharId)}</b>
                </span>
                <span>
                  后续出处
                  <b>{fos.length} 处</b>
                </span>
                {clue.status === 'closed' ? (
                  <span>
                    收束于
                    <button
                      className="link"
                      onClick={() => setActiveSession(clue.closeSessionId)}
                    >
                      {chapterLabel(campaign, clue.closeSessionId)}
                    </button>
                  </span>
                ) : carried ? (
                  <span className="carry-tag">已滚入 {chapterLabel(campaign, lastSessionId)}</span>
                ) : null}
              </div>

              {open && (
                <div className="clue-body">
                  {/* 后续出处时间线 */}
                  <div className="trace">
                    <div className="trace-node origin">
                      <i>起</i>
                      <div>
                        <b>{chapterLabel(campaign, clue.originSessionId)} 来源</b>
                        <p>{clue.detail || '—'}</p>
                      </div>
                    </div>
                    {fos.map((f) => (
                      <div className="trace-node" key={f.id}>
                        <i>续</i>
                        <div>
                          <b>
                            {chapterLabel(campaign, f.sessionId)} ·{' '}
                            <button className="link" onClick={() => setActiveSession(f.sessionId)}>
                              查看章节
                            </button>
                          </b>
                          <p>{f.note}</p>
                        </div>
                      </div>
                    ))}
                    {clue.status === 'closed' && (
                      <div className="trace-node close-node">
                        <i>合</i>
                        <div>
                          <b>{chapterLabel(campaign, clue.closeSessionId)} 收束</b>
                          <p>{clue.conclusion}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="clue-actions">
                    <button className="outline sm" onClick={() => setFollowFor(clue)}>
                      ＋ 记后续出处
                    </button>
                    {clue.status === 'open' && (
                      <button className="primary sm" onClick={() => setClosing(clue)}>
                        ✓ 写结论并收束
                      </button>
                    )}
                  </div>

                  {/* 重复关闭冲突：只保留最早一次，后来的尝试记录在线索上 */}
                  {conflicts.length > 0 && (
                    <div className="conflict-box">
                      <h4>重复关闭冲突 ×{conflicts.length}（仅保留最早一次关闭）</h4>
                      {conflicts
                        .slice()
                        .reverse()
                        .map((cf) => (
                          <div className="conflict-row" key={cf.id}>
                            <p>
                              有人想在 <b>{chapterLabel(campaign, cf.attemptedSessionId)}</b>{' '}
                              再次关闭「{cf.clueTitle}」；该线索原状态为
                              <b> {cf.originalStatus === 'closed' ? '已收束' : '未解'}</b>
                              {cf.originalCloseSessionId && (
                                <>
                                  ，最早收束于{' '}
                                  <b>{chapterLabel(campaign, cf.originalCloseSessionId)}</b>
                                </>
                              )}
                              。
                            </p>
                            {cf.rejectedConclusion && (
                              <p className="rejected">未采纳的结论：{cf.rejectedConclusion}</p>
                            )}
                            {cf.originalConclusion && (
                              <p className="kept">保留的结论：{cf.originalConclusion}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {sessions.length > 0 && rows.length === 0 && (
          <div className="board-empty">当前筛选下没有线索。</div>
        )}
      </div>

      {adding && (
        <ClueForm
          campaign={campaign}
          defaultSessionId={lastSessionId}
          onClose={() => setAdding(false)}
          onSaved={(title) => {
            setAdding(false);
            notice(`线索「${title}」已登记`);
          }}
          store={store}
        />
      )}
      {followFor && (
        <FollowUpForm
          campaign={campaign}
          clue={followFor}
          onClose={() => setFollowFor(null)}
          onSaved={() => {
            setFollowFor(null);
            notice('后续出处已记下');
          }}
          store={store}
        />
      )}
      {closing && (
        <CloseClueForm
          campaign={campaign}
          clue={closing}
          onClose={() => setClosing(null)}
          onSaved={(conflict) => {
            setClosing(null);
            if (conflict) {
              notice(`重复关闭被拒绝：已保留最早收束（${chapterLabel(
                campaign,
                conflict.originalCloseSessionId
              )}）`);
            } else {
              notice(`线索「${closing.title}」已收束`);
            }
          }}
          store={store}
        />
      )}
    </section>
  );
}
