// 這個檔案裡的兩個值都不該出現在公開的 repo 裡，所以版本庫存的是佔位符。
//
// HER_NAME 是她的名字，那是私人的。
// FORM_ENDPOINT 一旦被爬到，任何人都能往這個表單灌東西，
// 免費額度每月五十份，灌爆了就收不到她真正的答案。
//
// 本機填真實值之後，讓 git 忽略這個檔案的本機修改：
//
//   git update-index --skip-worktree src/data/config.js
//
// 之後 git status 不會再看到它，也不會不小心 commit 上去。
// 要恢復追蹤就用 --no-skip-worktree。
//
// 因為真實值不在版本庫裡，GitHub Pages 部署出來的會是佔位符版本。
// 實際上線請用 Netlify Drop 拖本機資料夾，那才有真實值。
export const HER_NAME = '{{她的名字}}';
export const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
