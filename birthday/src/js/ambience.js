// 河邊的水聲，用瀏覽器內建的音訊合成即時產生，沒有音檔。
//
// 第一版做成「白噪音通過低通濾波器，音量緩慢起伏」，那是風聲的配方不是浪。
// 差別在於風是連續的，海浪是一次一次的事件：
//
//   1. 碎波的瞬間有爆發，泡沫的高頻嘶嘶聲跟著出來
//   2. 接著拖長衰減，高頻先消失，最後只剩低頻的隆隆聲
//   3. 隔幾秒再來一次，間隔與強度每次都不一樣
//
// 所以這一版有兩條路徑：一條是持續的低頻底噪，那是遠處的海一直在那裡；
// 一條是碎波，每隔六到十二秒觸發一次，音量與亮度用同一組包絡一起衰減。
// 「高頻比低頻先消失」是聽起來像水而不像風的關鍵。
const VOLUME = 0.08;
const FADE_SECONDS = 3;
const STORAGE_KEY = 'special-website-sound';

// 遠處的海：很低的低通，音量固定，一直在
const BED_CUTOFF_HZ = 180;
const BED_LEVEL = 0.14;

// 碎波：間隔、上升、衰減、亮度都給一個範圍，每次在範圍內隨機
const GAP_MIN_SECONDS = 6;
const GAP_RANGE_SECONDS = 6;
const ATTACK_MIN = 0.35;
const ATTACK_RANGE = 0.3;
const DECAY_MIN = 3;
const DECAY_RANGE = 2.5;
const PEAK_MIN = 0.5;
const PEAK_RANGE = 0.5;
const CREST_HZ = 1800;
const CREST_RANGE_HZ = 900;
const TROUGH_HZ = 320;
const PAN_RANGE = 0.4;

const WAVE_ON = 'M2 9c2-2.2 4-2.2 6 0s4 2.2 6 0M2 14c2-2.2 4-2.2 6 0s4 2.2 6 0';
const WAVE_OFF = 'M2 11.5c2-2.2 4-2.2 6 0s4 2.2 6 0';
const NS = 'http://www.w3.org/2000/svg';

const between = (min, range) => min + Math.random() * range;

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writePreference(on) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // 無痕模式存不了，記不住就算了，不影響播放
  }
}

function buildIcon() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'sound-icon');
  svg.setAttribute('aria-hidden', 'true');

  const wave = document.createElementNS(NS, 'path');
  wave.setAttribute('d', WAVE_ON);

  const slash = document.createElementNS(NS, 'path');
  slash.setAttribute('d', 'M17 7l5 10');
  slash.setAttribute('class', 'sound-slash');

  svg.append(wave, slash);
  return { svg, wave, slash };
}

export function createAmbience() {
  let context = null;
  let master = null;
  let surfFilter = null;
  let surfGain = null;
  let surfPan = null;
  let timer = null;
  let enabled = readPreference();
  let broken = false;

  const button = document.createElement('button');
  button.className = 'sound-toggle';
  button.type = 'button';
  const icon = buildIcon();
  button.append(icon.svg);

  function syncButton() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? '關掉水聲' : '打開水聲');
    icon.wave.setAttribute('d', enabled ? WAVE_ON : WAVE_OFF);
    icon.slash.style.opacity = enabled ? '0' : '1';
  }

  function build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('no audio context');
    context = new Ctx();

    // 四秒的白噪音，循環播放。夠長才聽不出接點。
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;

    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    // 路徑一：遠處的海。只留很低的頻率，音量固定，置中。
    const bedFilter = context.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.value = BED_CUTOFF_HZ;
    const bedGain = context.createGain();
    bedGain.gain.value = BED_LEVEL;
    noise.connect(bedFilter).connect(bedGain).connect(master);

    // 路徑二：碎波。濾波器與音量都由 breakWave() 逐次排程。
    surfFilter = context.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = TROUGH_HZ;
    surfFilter.Q.value = 0.7;

    surfGain = context.createGain();
    surfGain.gain.value = 0.0001;

    // 每次碎波稍微偏左或偏右，海才有寬度，不會像一個點在響
    surfPan = context.createStereoPanner ? context.createStereoPanner() : null;
    if (surfPan) noise.connect(surfFilter).connect(surfGain).connect(surfPan).connect(master);
    else noise.connect(surfFilter).connect(surfGain).connect(master);

    noise.start();
  }

  // 一次碎波。音量與亮度共用同一段時間軸，而且亮度衰減得比音量更徹底，
  // 這樣泡沫的高頻會先不見，尾巴只剩水的低頻。
  function breakWave() {
    if (!context) return;
    const now = context.currentTime;
    const attack = between(ATTACK_MIN, ATTACK_RANGE);
    const decay = between(DECAY_MIN, DECAY_RANGE);
    const peak = between(PEAK_MIN, PEAK_RANGE);
    const crest = between(CREST_HZ, CREST_RANGE_HZ);

    surfGain.gain.cancelScheduledValues(now);
    surfGain.gain.setValueAtTime(Math.max(surfGain.gain.value, 0.0001), now);
    surfGain.gain.linearRampToValueAtTime(peak, now + attack);
    surfGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

    surfFilter.frequency.cancelScheduledValues(now);
    surfFilter.frequency.setValueAtTime(surfFilter.frequency.value, now);
    surfFilter.frequency.linearRampToValueAtTime(crest, now + attack * 0.8);
    surfFilter.frequency.exponentialRampToValueAtTime(TROUGH_HZ, now + attack + decay * 0.7);

    if (surfPan) {
      surfPan.pan.cancelScheduledValues(now);
      surfPan.pan.setValueAtTime((Math.random() * 2 - 1) * PAN_RANGE, now);
    }
  }

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      breakWave();
      scheduleNext();
    }, between(GAP_MIN_SECONDS, GAP_RANGE_SECONDS) * 1000);
  }

  function stopScheduling() {
    clearTimeout(timer);
    timer = null;
  }

  // 音量一律用斜坡，不直接跳。突然出聲跟突然斷掉都會嚇到人。
  function ramp(target, seconds) {
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + seconds);
  }

  function toggle() {
    enabled = !enabled;
    writePreference(enabled);
    syncButton();
    if (!enabled) {
      ramp(0, 1);
      stopScheduling();
      return;
    }
    if (!context) {
      start();
      return;
    }
    context.resume();
    ramp(VOLUME, 1.5);
    breakWave();
    scheduleNext();
  }

  // 瀏覽器一律擋掉沒有手勢的有聲播放，所以這只能在她按下開始之後呼叫
  function start() {
    if (broken || context) return;
    try {
      build();
      context.resume();
      if (enabled) {
        ramp(VOLUME, FADE_SECONDS);
        breakWave();
        scheduleNext();
      }
    } catch {
      broken = true;
      button.hidden = true;
    }
  }

  button.addEventListener('click', toggle);
  syncButton();

  // 她可能中途去回訊息。切走就停，不要讓聲音在背景跑，
  // 也不要讓碎波排在暫停期間，回來一次全部湧出來。
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) {
      stopScheduling();
      context.suspend();
      return;
    }
    if (!enabled) return;
    context.resume();
    scheduleNext();
  });

  return { button, start };
}
