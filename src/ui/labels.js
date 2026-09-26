// 界面层小工具：章节/角色的展示文案。
import { chapterNo, orderedSessions } from '../data/order.js';

export function chapterLabel(campaign, sessionId) {
  if (!sessionId) return '—';
  const s = campaign.sessions.find((x) => x.id === sessionId);
  if (!s) return '—';
  return `第${toCN(chapterNo(campaign, sessionId))}章`;
}

export function chapterShort(campaign, sessionId) {
  const s = campaign.sessions.find((x) => x.id === sessionId);
  return s ? s.title : '—';
}

export function statusText(status) {
  return status === 'closed' ? '已收束' : '未解';
}

export function toCN(n) {
  const map = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 10) return map[n] || String(n);
  if (n < 20) return `十${map[n - 10] || ''}`;
  if (n < 100) return `${map[Math.floor(n / 10)]}十${n % 10 ? map[n % 10] : ''}`;
  return String(n);
}

export function charName(campaign, id) {
  return campaign.characters.find((c) => c.id === id)?.name || '未指派';
}

export function sessionOptions(campaign) {
  return orderedSessions(campaign).map((s) => ({
    id: s.id,
    label: `${chapterLabel(campaign, s.id)} · ${s.title}`
  }));
}
