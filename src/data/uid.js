// 数据层：ID 生成。本地单机应用，时间戳 + 计数器即可，避免同一毫秒内冲突。
let seq = 0;
export function uid(prefix) {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`;
}
