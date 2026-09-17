export const DINNER_INTRO = `好，講正事。
你生日快到了。
我想帶你去吃一頓，但我想先問你想去哪，而不是自己決定。`;

export const DINNER_HINT = '想去的都點一下，會照你點的順序排。禮拜五人多，我從第一間開始訂。';

export const RESTAURANTS = [
  {
    id: 'pinwei', name: '品味牛排餐酒館', icon: 'glass',
    where: '竹圍站旁，民族路二樓的牛排餐酒館',
    why: '這間最有慶生的感覺，牛排是真材實料。位子不多，我會先訂',
    query: '品味牛排餐酒館 新北市淡水區民族路28號',
  },
  {
    id: 'heishi', name: '黑市shabu 竹圍店', icon: 'pot',
    where: '民族路上走三分鐘的鍋物',
    why: '昆布湯底不加味精，菜盤都是原型食材。二樓是四人桌，安靜好講話',
    query: '黑市shabu 竹圍店 新北市淡水區民族路31之5號',
  },
  {
    id: 'kimchunhee', name: '金春喜韓廚 竹圍店', icon: 'bowl',
    where: '捷運站旁的韓式湯飯',
    why: '離我們熟悉的地方最近，小菜白飯霜淇淋無限續，可以慢慢吃慢慢聊',
    query: '金春喜韓廚 竹圍店 新北市淡水區',
  },
  {
    id: 'gwangju', name: '光州神仙爐', icon: 'lid',
    where: '竹圍站走三分鐘的韓式小鍋',
    why: '一人一鍋，部隊鍋豆腐鍋都有。用餐時間常客滿，在地人是真的愛',
    query: '光州神仙爐 新北市淡水區民生路5號',
  },
  {
    id: 'anywhere', name: '都可以，你決定就好', icon: 'star',
    where: '',
    why: '如果你真的沒特別想法，那就交給我',
  },
];

// 沒有店家照片的授權，所以給連結。照片、評價、地址、營業時間全都在地圖上。
export function mapLink(restaurant) {
  if (!restaurant.query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.query)}`;
}
