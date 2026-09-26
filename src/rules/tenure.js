// 规则层：角色离队 / 归队（任期分段）。
// 不直接改数据，返回新的角色对象，由状态层统一提交。
import { uid } from '../data/uid.js';
import { isOnRoster } from './participation.js';

export function leaveParty(character, sessionId, note) {
  if (character.active === false) return character;
  const tenures = character.tenures || [];
  const open = tenures.find((t) => t.to === null);
  if (!open) return character;
  return {
    ...character,
    active: false,
    tenures: tenures.map((t) =>
      t.id === open.id ? { ...t, to: sessionId, note: note || t.note || '' } : t
    )
  };
}

export function rejoinParty(character, sessionId, note) {
  if (character.active === true) return character;
  return {
    ...character,
    active: true,
    // 旧任期原样保留；另建一段新经历，互不覆盖。
    tenures: [
      ...(character.tenures || []),
      { id: uid('t'), from: sessionId, to: null, note: note || '' }
    ]
  };
}

// 离队后被误选的章节参与人需清理（正常 UI 会拦截，这里兜底）。
export function sanitizeParticipants(campaign) {
  return {
    ...campaign,
    sessions: campaign.sessions.map((s) => ({
      ...s,
      participants: (s.participants || []).filter((cid) =>
        isOnRoster(campaign, campaign.characters.find((c) => c.id === cid), s.id)
      )
    }))
  };
}
