// 规则层：战役归档与重开。
// 重开时把当前战役整体快照存档；归档内保留完整数据，
// 可沿每条线索看到：来源章节 → 经办角色变化（任期）→ 后续出处 → 最终收束章节与结论。
import { uid } from '../data/uid.js';
import { orderedSessions } from '../data/order.js';
import { followUpsOf } from './clues.js';

export function archiveCampaign(campaign, note = '') {
  const sessions = orderedSessions(campaign);
  const archivedAt = new Date().toISOString();
  const arc = {
    id: uid('arc'),
    name: campaign.name,
    system: campaign.system,
    note: note || '',
    archivedAt,
    chapterCount: sessions.length,
    openClueCount: campaign.clues.filter((c) => c.status === 'open').length,
    // 深拷贝，之后重开的新战役不会改动这份历史。
    snapshot: JSON.parse(JSON.stringify(campaign)),
    // 线索收束总览，供归档详情直接阅读。
    clueTrails: campaign.clues
      .slice()
      .sort((a, b) => a.createdOrder - b.createdOrder)
      .map((clue) => ({
        id: clue.id,
        title: clue.title,
        status: clue.status,
        originSessionId: clue.originSessionId,
        originTitle: sessions.find((s) => s.id === clue.originSessionId)?.title || '—',
        ownerCharId: clue.ownerCharId,
        ownerName:
          campaign.characters.find((c) => c.id === clue.ownerCharId)?.name || '未指派',
        followUps: followUpsOf(campaign, clue.id).map((f) => ({
          sessionTitle: sessions.find((s) => s.id === f.sessionId)?.title || '—',
          note: f.note
        })),
        closeSessionId: clue.closeSessionId,
        closeTitle:
          sessions.find((s) => s.id === clue.closeSessionId)?.title || null,
        conclusion: clue.conclusion
      }))
  };
  return arc;
}

// 角色变化时间线（归档详情用）：每段任期的起止章节都能对上名字。
export function rosterTimeline(campaign) {
  const sessions = orderedSessions(campaign);
  const titleOf = (id) => sessions.find((s) => s.id === id)?.title;
  return campaign.characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    player: c.player,
    active: c.active !== false,
    tenures: (c.tenures || []).map((t) => ({
      fromTitle: titleOf(t.from) || '战役开始前',
      toTitle: t.to ? titleOf(t.to) : null,
      note: t.note
    })),
    appearances: sessions
      .filter((s) => (s.participants || []).includes(c.id))
      .map((s) => s.title)
  }));
}

// 关闭冲突也进入归档，便于复盘"同一条线索为什么只保留最早一次关闭"。
export function conflictList(campaign) {
  const sessions = orderedSessions(campaign);
  const titleOf = (id) => sessions.find((s) => s.id === id)?.title || '—';
  return campaign.closeConflicts.map((cf) => ({
    ...cf,
    attemptedTitle: titleOf(cf.attemptedSessionId),
    originalCloseTitle: titleOf(cf.originalCloseSessionId)
  }));
}
