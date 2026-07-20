const clockEl = document.getElementById('clock');
const alarmInput = document.getElementById('alarmTime');
const setBtn = document.getElementById('setBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

let alarmTime = null; // "HH:MM:SS"
let ringing = false;
let audioCtx = null;
let beepTimer = null;

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowString() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function tick() {
  const now = nowString();
  clockEl.textContent = now;

  if (alarmTime && !ringing && now === alarmTime) {
    startRinging();
  }
}

function startRinging() {
  ringing = true;
  document.body.classList.add('ringing');
  statusEl.textContent = '⏰ 時間やで！「解除」を押してな';
  playBeep();
}

function stopRinging() {
  ringing = false;
  document.body.classList.remove('ringing');
  if (beepTimer) {
    clearInterval(beepTimer);
    beepTimer = null;
  }
}

// Web Audio API でシンプルなビープ音を生成（外部音源ファイル不要）
function playBeep() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const beepOnce = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  beepOnce();
  beepTimer = setInterval(beepOnce, 600);
}

setBtn.addEventListener('click', () => {
  if (!alarmInput.value) {
    statusEl.textContent = '時刻を入力してな';
    return;
  }
  // time入力は step=1 でも秒が空の場合があるので補完
  const parts = alarmInput.value.split(':');
  while (parts.length < 3) parts.push('00');
  alarmTime = parts.map((p) => pad(Number(p))).join(':');

  setBtn.disabled = true;
  clearBtn.disabled = false;
  alarmInput.disabled = true;
  statusEl.textContent = `⏱ ${alarmTime} にセットしたで`;
});

clearBtn.addEventListener('click', () => {
  alarmTime = null;
  stopRinging();
  setBtn.disabled = false;
  clearBtn.disabled = true;
  alarmInput.disabled = false;
  statusEl.textContent = 'アラーム解除したで';
});

setInterval(tick, 250);
tick();
