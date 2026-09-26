// 规则层：线索的创建、后续出处、关闭与重复关闭冲突。
import { uid } from '../data/uid.js';
import { getNextSession, chapterNo } from '../data/order.js';

export const CLUE_STATUS = { OPEN: 'open', CLOSED: 'closed' };

// 新线索：带来源章节与经办角色；createdOrder 用于记录同一章内的登记次序。
export function createClue(campaign, { title, detail, originSessionId, ownerCharId }) {
  const order = campaign.clues.reduce((m, c) => Math.max(m, c.createdOrder || 0), 0) + 1;
  const clue = {
    id: uid('cl'),
    title: (title || '').trim(),
    detail: (detail || '').trim(),
    originSessionId,
    ownerCharId: ownerCharId || null,
    status: CLUE_STATUS.OPEN,
    closeSessionId: null,
    conclusion: '',
    createdOrder: order,
    closedOrder: null
  };
  return { ...campaign, clues: [...campaign.clues, clue] };
}

// 后续出处：线索在某一章产生的新进展/新去向。
export function addFollowUp(campaign, { clueId, sessionId, note }) {
  const fu = { id: uid('f'), clueId, sessionId, note: (note || '').trim() };
  return { ...campaign, followUps: [...campaign.followUps, fu] };
}

export function followUpsOf(campaign, clueId) {
  return campaign.followUps
    .filter((f) => f.clueId === clueId)
    .sort(
      (a, b) =>
        chapterNo(campaign, a.sessionId) - chapterNo(campaign, b.sessionId) ||
        a.id.localeCompare(b.id)
    );
}

/*
 * 关闭线索：必须写结论并关联收束章节。
 * 同一线索重复关闭只保留最早一次；后来的尝试不改任何数据，
 * 在 closeConflicts 里登记：线索、章节、原状态（原收束章节/结论）。
 * 返回 { campaign, conflict }；conflict 为 null 表示关闭成功。
 */
export function closeClue(campaign, clueId, { closeSessionId, conclusion }) {
  const clue = campaign.clues.find((c) => c.id === clueId);
  if (!clue) return { campaign, conflict: null };

  if (clue.status === CLUE_STATUS.CLOSED) {
    const conflict = {
      id: uid('cf'),
      clueId,
      clueTitle: clue.title,
      attemptedSessionId: closeSessionId,
      originalStatus: clue.status,
      originalCloseSessionId: clue.closeSessionId,
      originalConclusion: clue.conclusion,
      rejectedConclusion: (conclusion || '').trim()
    };
    return {
      campaign: {
        ...campaign,
        closeConflicts: [...campaign.closeConflicts, conflict]
      },
      conflict
    };
  }

  const closedOrder = campaign.clues.reduce((m, c) => Math.max(m, c.closedOrder || 0), 0) + 1;
  const next = {
    ...campaign,
    clues: campaign.clues.map((c) =>
      c.id === clueId
        ? {
            ...c,
            status: CLUE_STATUS.CLOSED,
            closeSessionId,
            conclusion: (conclusion || '').trim(),
            closedOrder
          }
        : c
    )
  };
  return { campaign: next, conflict: null };
}

// 章节结算后，未解线索"进入下一章"：线索本体不改归属，视图层据此判定结转。
// 返回结转进 sessionId 这一章的线索（来源章节早于本章且仍未解）。
export function carriedInto(campaign, sessionId) {
  return campaign.clues
    .filter(
      (c) =>
        c.status === CLUE_STATUS.OPEN &&
        chapterNo(campaign, c.originSessionId) < chapterNo(campaign, sessionId)
    )
    .sort((a, b) => a.createdOrder - b.createdOrder);
}

export function cluesOriginatedIn(campaign, sessionId) {
  return campaign.clues
    .filter((c) => c.originSessionId === sessionId)
    .sort((a, b) => a.createdOrder - b.createdOrder);
}

// 结算时给下一章做的线索摘要：未解线索随章节流转。
export function settlementReport(campaign, sessionId) {
  const next = getNextSession(campaign, sessionId);
  const open = campaign.clues.filter(
    (c) =>
      c.status === CLUE_STATUS.OPEN &&
      chapterNo(campaign, c.originSessionId) <= chapterNo(campaign, sessionId)
  );
  return {
    nextSession: next,
    openClues: open.sort((a, b) => a.createdOrder - b.createdOrder),
    closedHere: campaign.clues.filter((c) => c.closeSessionId === sessionId)
  };
}
