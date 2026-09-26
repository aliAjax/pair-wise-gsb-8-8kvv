// 数据层：空白战役工厂（重开战役时用）。
import { DATA_VERSION } from './keys.js';

export function createEmptyCampaign({ name = '新的战役', system = '', date = '' } = {}) {
  return {
    version: DATA_VERSION,
    name,
    system,
    sessions: [],
    characters: [],
    clues: [],
    followUps: [],
    closeConflicts: []
  };
}
