// d1 的四個答案各自對應一句寫在結果卡上的話
const TIRED_LABEL = {
  '安靜陪著就好，不用講話': '累的時候想要有人安靜陪著',
  '講點好笑的讓我分心': '累的時候想被逗笑',
  '問清楚發生什麼事': '累的時候想把話講開',
  '讓我自己待一下': '累的時候想自己待著',
};

export function buildPersonaLine(state) {
  const parts = [];
  if (typeof state.about?.q2 === 'number') parts.push(`${state.about.q2} 分的處女座`);
  const tired = TIRED_LABEL[state.deeper?.d1];
  if (tired) parts.push(tired);
  return parts.join('，');
}

export function restaurantName(id, restaurants) {
  const found = restaurants.find((r) => r.id === id);
  return found ? found.name : '還沒選';
}

export function rankedNames(ids, restaurants) {
  return (ids || []).map((id) => restaurantName(id, restaurants));
}
