// 数据层：localStorage 读写 + 旧版数据迁移。
import { STORE_KEY, ARCHIVE_KEY, DATA_VERSION } from './keys.js';
import { seed } from './seed.js';
import { uid } from './uid.js';

export function loadCampaign() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return structuredClone(seed);
  }
}

export function saveCampaign(campaign) {
  localStorage.setItem(STORE_KEY, JSON.stringify(campaign));
}

export function loadArchives() {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveArchives(archives) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives));
}

// 旧版（v1）数据没有 id / 线索 / 任期，按章节顺序补齐。
export function migrate(data) {
  if (!data || !Array.isArray(data.sessions)) return structuredClone(seed);
  if (data.version >= DATA_VERSION) return data;

  const sessions = [...data.sessions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id || 0) - (b.id || 0)))
    .map((s, i) => ({
      id: typeof s.id === 'number' ? `s_legacy${s.id}` : s.id || `s_${i}`,
      date: s.date,
      title: s.title,
      summary: s.summary || '',
      tag: s.tag || '主线',
      color: s.color || '#d8a153',
      participants: [],
      settled: false
    }));

  const chars = (data.characters || []).map((c, i) => {
    const id = `c_${i}_${(c.name || 'x').slice(0, 1)}`;
    return {
      id,
      name: c.name || `角色${i + 1}`,
      role: c.role || '',
      player: c.player || '',
      color: c.color || '#93b7a6',
      active: true,
      tenures: sessions.length
        ? [{ id: uid('t'), from: sessions[0].id, to: null, note: '旧记录迁移' }]
        : []
    };
  });

  sessions.forEach((s) => {
    s.participants = chars.filter((c) => c.active).map((c) => c.id);
  });

  return {
    version: DATA_VERSION,
    name: data.name || '未命名战役',
    system: data.system || '',
    sessions,
    characters: chars,
    clues: [],
    followUps: [],
    closeConflicts: []
  };
}
