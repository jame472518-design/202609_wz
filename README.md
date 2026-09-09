# 給她的生日測驗網頁

純靜態網頁，沒有後端，沒有任何執行期依賴。答案透過 Formspree 寄到作者的 Gmail，結果頁另外提供一張可截圖的結果卡當備援。

## 本機預覽

因為使用 ES modules，不能直接用 `file://` 開啟，需要一個本機伺服器：

    node serve.mjs

然後開 http://localhost:8080

## 測試

    node --test tests/*.test.js

端到端跑一次完整流程（用最小的 DOM 模擬，確認沒有執行期錯誤）：

    node tests/smoke.mjs

涵蓋三個純邏輯模組：狀態存取、送出內容組裝、結果卡文案組裝。畫面與互動沒有自動化測試，用設計文件裡的手動清單驗證。

## 修改內容

所有文案與題目都在 `src/data/`，改內容不需要碰程式邏輯：

- `copy.js` 封面、結尾、送出相關文字，她的名字，以及生日日期
- `questions.js` 第一章題目
- `memories.js` 五顆回憶星
- `restaurants.js` 餐廳卡與餐桌細節題

## 上線前必做

1. 把 `src/data/copy.js` 的 `HER_NAME` 換成真名
2. 用真手機跑一次完整流程
3. 在 LINE 裡貼網址點開再跑一次，這是她最可能的使用情境
4. 送出一次，確認 Gmail 收到主旨為「她填完了」的信

## 部署

把整個資料夾拖到 https://app.netlify.com/drop 就會拿到一個公開網址。

## 檔案結構

    index.html          進入點
    serve.mjs           本機預覽伺服器
    src/data/           所有文案與題目
    src/js/             程式邏輯
      state.js          答案狀態與 localStorage（有測試）
      payload.js        送出內容組裝（有測試）
      summary.js        結果卡文案組裝（有測試）
      render.js         四種題型的卡片渲染
      icons.js          餐廳卡的線條圖示
      fireworks.js      綻放一次的煙火
      ambience.js       合成的水聲與開關
      starmap.js        星圖進度元件
      rose.js           生日日期算出來的玫瑰線
      heart.js          心臟線與心跳脈動
      flow.js           章節順序與切換
      result.js         結果頁與送出流程
      submit.js         Formspree 呼叫
      main.js           封面
    src/styles/         樣式
    tests/              純邏輯測試
    docs/superpowers/   設計文件與實作計畫
