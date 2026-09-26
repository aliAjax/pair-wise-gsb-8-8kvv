// 界面层：章节结算确认。结算前预览滚入下一章的未解线索、参与人。
import React from 'react';
import { Modal } from './Modal.jsx';
import { buildSettlement } from '../rules/settlement.js';
import { charName } from './labels.js';

export function SettleDialog({ campaign, session, onClose, onConfirm }) {
  const r = buildSettlement(campaign, session.id);
  return (
    <Modal crumb="SETTLE CHAPTER" title={`结算 · ${session.title}`} onClose={onClose}>
      <div className="settle-box">
        <div className="settle-line">
          <span>本章收束线索</span>
          <b>{r.closedHere.length} 条</b>
        </div>
        <div className="settle-line">
          <span>未解线索（滚入下一章）</span>
          <b className={r.openCount ? 'warn' : ''}>{r.openCount} 条</b>
        </div>

        {r.openClues.length > 0 && (
          <div className="carry-list">
            {r.openClues.map((c) => (
              <div className="carry-item" key={c.id}>
                <span className={'clue-dot open'} />
                <b>{c.title}</b>
                <small>
                  来源章节内出现 · 经办 {charName(campaign, c.ownerCharId)}
                </small>
              </div>
            ))}
          </div>
        )}

        {r.nextSession ? (
          <p className="form-hint">
            确认结算后，以上未解线索会出现在「{r.nextSession.title}」的详情里，不会因换章丢失。
          </p>
        ) : (
          <p className="form-hint">这是目前最后一章；新增章节后，未解线索会自动滚入。</p>
        )}

        <div className="row-end gap">
          <button className="outline" onClick={onClose}>
            再检查一下
          </button>
          <button className="primary" onClick={onConfirm}>
            确认结算
          </button>
        </div>
      </div>
    </Modal>
  );
}
