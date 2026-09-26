// 规则层：角色在队状态与章节参与资格。
// 一段任期 tenure = [from, to]，to 为 null 表示至今。
// 角色离队后的章节不可再勾选；归队会另起一段任期，旧任期与旧出场不变。
import { chapterNo } from '../data/order.js';

// 章节序号是否落在某段任期内：离队当章仍可出场，离队"之后"的章节不行。
function tenureCovers(tenure, campaign, sessionId) {
  const start = chapterNo(campaign, tenure.from);
  const end = tenure.to ? chapterNo(campaign, tenure.to) : Infinity;
  const cur = chapterNo(campaign, sessionId);
  return cur >= start && cur <= end;
}

export function isOnRoster(campaign, character, sessionId) {
  if (!sessionId) return character.active !== false;
  return (character.tenures || []).some((t) => tenureCovers(t, campaign, sessionId));
}

// 当前章节可勾选的参与人（按在队状态过滤）。
export function eligibleParticipants(campaign, sessionId) {
  return campaign.characters.filter((c) => isOnRoster(campaign, c, sessionId));
}

export function ineligibleParticipants(campaign, sessionId) {
  return campaign.characters.filter((c) => !isOnRoster(campaign, c, sessionId));
}

export function canParticipate(campaign, characterId, sessionId) {
  const c = campaign.characters.find((x) => x.id === characterId);
  return c ? isOnRoster(campaign, c, sessionId) : false;
}

// 角色曾在哪些章节出场（所有历史任期内 + 实际勾选记录都可查）。
export function appearedSessions(campaign, characterId) {
  const c = campaign.characters.find((x) => x.id === characterId);
  if (!c) return [];
  return campaign.sessions
    .filter((s) => (s.participants || []).includes(characterId))
    .sort((a, b) => chapterNo(campaign, a.id) - chapterNo(campaign, b.id));
}
