// 界面层：角色与阵营。支持离队/归队（任期分段）、旧出场查询、经办线索查询。
import React, { useState } from 'react';
import { orderedSessions, chapterNo } from '../data/order.js';
import { appearedSessions } from '../rules/participation.js';
import { chapterLabel } from './labels.js';
import { Modal } from './Modal.jsx';
import { CharacterForm } from './CharacterForm.jsx';
import { TenureForm } from './TenureForm.jsx';

export function Roster({ campaign, store, setActiveSession, notice }) {
  const [detail, setDetail] = useState(null); // 查看角色档案
  const [adding, setAdding] = useState(false);
  const [leaveFor, setLeaveFor] = useState(null);
  const [rejoinFor, setRejoinFor] = useState(null);

  const sessions = orderedSessions(campaign);
  const inParty = campaign.characters.filter((c) => c.active !== false);
  const away = campaign.characters.filter((c) => c.active === false);

  const renderCard = (c) => (
    <article className={'char-card ' + (c.active === false ? 'is-away' : '')} key={c.id}>
      <div className="avatar" style={{ background: c.color }}>
        {c.name[0]}
      </div>
      <div className="char-main" onClick={() => setDetail(c)}>
        <small>{c.role}</small>
        <h3>{c.name}</h3>
        <p>
          玩家 · {c.player || '—'}
          {c.active === false && <b className="away-flag">离队中</b>}
        </p>
      </div>
      <div className="char-btns">
        <button className="link" onClick={() => setDetail(c)}>
          档案
        </button>
        {c.active !== false ? (
          <button className="outline sm" onClick={() => setLeaveFor(c)}>
            离队
          </button>
        ) : (
          <button className="primary sm" onClick={() => setRejoinFor(c)}>
            归队
          </button>
        )}
      </div>
    </article>
  );

  const detailChar = detail && campaign.characters.find((c) => c.id === detail.id);

  return (
    <section className="cards">
      <div className="section-note row-between">
        <span>
          在队 {inParty.length} 人，离队 {away.length} 人。离队后的章节不可勾选为参与人；
          归队另建一段经历，旧出场仍可查。
        </span>
        <button className="primary sm" onClick={() => setAdding(true)}>
          ＋ 新角色
        </button>
      </div>

      {inParty.map(renderCard)}
      {away.length > 0 && (
        <>
          <div className="roster-sub">离队角色</div>
          {away.map(renderCard)}
        </>
      )}

      {detailChar && (
        <CharacterDetail
          campaign={campaign}
          c={detailChar}
          sessions={sessions}
          onClose={() => setDetail(null)}
          onJump={setActiveSession}
        />
      )}

      {adding && (
        <CharacterForm
          campaign={campaign}
          onClose={() => setAdding(false)}
          onSaved={(name) => {
            setAdding(false);
            notice(`角色「${name}」已入团`);
          }}
          store={store}
        />
      )}
      {leaveFor && (
        <TenureForm
          campaign={campaign}
          c={leaveFor}
          mode="leave"
          onClose={() => setLeaveFor(null)}
          onSaved={(note) => {
            store.setLeave(leaveFor.id, note.sessionId, note.note);
            setLeaveFor(null);
            notice(`${leaveFor.name} 已离队；之后章节不可再勾选`);
          }}
        />
      )}
      {rejoinFor && (
        <TenureForm
          campaign={campaign}
          c={rejoinFor}
          mode="rejoin"
          onClose={() => setRejoinFor(null)}
          onSaved={(note) => {
            store.setRejoin(rejoinFor.id, note.sessionId, note.note);
            setRejoinFor(null);
            notice(`${rejoinFor.name} 归队，已另建一段任期`);
          }}
        />
      )}
    </section>
  );
}

function CharacterDetail({ campaign, c, sessions, onClose, onJump }) {
  const appearances = appearedSessions(campaign, c.id);
  const ownedClues = campaign.clues.filter((cl) => cl.ownerCharId === c.id);
  return (
    <Modal crumb="CHARACTER SHEET" title={`${c.name} · ${c.role || '—'}`} onClose={onClose} wide>
      <div className="sheet">
        <div className="sheet-section">
          <h4>在队经历（任期分段）</h4>
          {(c.tenures || []).map((t, i) => (
            <div className="tenure-row" key={t.id}>
              <span className="tenure-no">{i + 1}</span>
              <div>
                <b>
                  {chapterLabel(campaign, t.from)}
                  {' → '}
                  {t.to ? chapterLabel(campaign, t.to) : '至今'}
                </b>
                <p>{t.note || '（无备注）'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="sheet-section">
          <h4>出场章节（{appearances.length}）</h4>
          {appearances.length === 0 && <p className="muted">暂无出场记录。</p>}
          {appearances.map((s) => (
            <button
              key={s.id}
              className="appear-row"
              onClick={() => {
                onJump(s.id);
                onClose();
              }}
            >
              <span className="tenure-no">{chapterNo(campaign, s.id)}</span>
              <b>{s.title}</b>
              <small>{s.date}</small>
              {s.settled && <i className="settled-mark">已结算</i>}
            </button>
          ))}
        </div>

        <div className="sheet-section">
          <h4>经办线索（{ownedClues.length}）</h4>
          {ownedClues.length === 0 && <p className="muted">没有经办中的线索。</p>}
          {ownedClues.map((cl) => (
            <div className="own-clue" key={cl.id}>
              <span className={'clue-dot ' + cl.status} />
              <b>{cl.title}</b>
              <small>
                来源 {chapterLabel(campaign, cl.originSessionId)} ·{' '}
                {cl.status === 'closed'
                  ? `收束 ${chapterLabel(campaign, cl.closeSessionId)}`
                  : '未解'}
              </small>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
