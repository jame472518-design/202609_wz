import { COVER } from '../data/copy.js';
import { createState, loadState } from './state.js';
import { createFireworks } from './fireworks.js';
import { createAmbience } from './ambience.js';
import { startFlow } from './flow.js';

const app = document.getElementById('app');
const ambience = createAmbience();
document.body.append(ambience.button);

function renderCover() {
  app.innerHTML = '';
  const cover = document.createElement('div');
  cover.className = 'cover';

  cover.append(createFireworks('fireworks-cover'));

  const title = document.createElement('h1');
  title.textContent = COVER.title;

  const subtitle = document.createElement('p');
  subtitle.className = 'cover-sub';
  subtitle.textContent = COVER.subtitle;

  const start = document.createElement('button');
  start.className = 'btn-primary';
  start.type = 'button';
  start.textContent = COVER.button;
  start.addEventListener('click', () => {
    // 按下開始就是她的手勢，這是唯一能讓聲音開始的時機
    ambience.start();
    startFlow(app, loadState(window.localStorage) || createState());
  });

  cover.append(title, subtitle, start);
  app.append(cover);
}

renderCover();
