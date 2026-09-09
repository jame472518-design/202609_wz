export const STORAGE_KEY = 'special-website-v1';

const SECTIONS = ['about', 'deeper', 'memories', 'dinner'];

export function createState() {
  return { about: {}, deeper: {}, memories: {}, dinner: {} };
}

export function setAnswer(state, section, key, value) {
  return { ...state, [section]: { ...state[section], [key]: value } };
}

export function saveState(state, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const state = createState();
    for (const section of SECTIONS) {
      if (parsed[section] && typeof parsed[section] === 'object') {
        state[section] = { ...parsed[section] };
      }
    }
    return state;
  } catch {
    return null;
  }
}

export function clearState(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 無痕模式可能整個 storage 都不能用，忽略即可
  }
}
