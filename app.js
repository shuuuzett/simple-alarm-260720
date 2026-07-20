const clockEl = document.getElementById('clock');
const alarmInput = document.getElementById('alarmTime');
const setBtn = document.getElementById('setBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

let alarmTime = null; // "HH:MM"
let ringing = false;
let hasRung = false; // 同じ分に二重で鳴らないためのフラグ
let audioCtx = null;
let beepTimer = null;

function pad(n) {
  return String(n).padStart(2, '0');
}

function currentHM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function currentHMS() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// AudioContext はユーザー操作の中で用意しておく（そうしないと後で音が鳴らない）
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function tick() {
  clockEl.textContent = currentHMS();

  const nowHM = currentHM();
  if (alarmTime && !ringing) {
    if (nowHM === alarmTime && !hasRung) {
      startRinging();
    }
    // 分が変わったらフラグをリセット（次の日など同時刻に再度鳴らせるように）
    if (nowHM !== alarmTime) {
      hasRung = false;
    }
  }
}

function startRinging() {
  ringing = true;
  hasRung = true;
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
  ensureAudio();
  const beepOnce = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  };
  beepOnce();
  beepTimer = setInterval(beepOnce, 700);
}

setBtn.addEventListener('click', () => {
  if (!alarmInput.value) {
    statusEl.textContent = '時刻を入力してな';
    return;
  }
  // クリック（ユーザー操作）のうちに音声を準備しておく
  ensureAudio();

  // "HH:MM" または "HH:MM:SS" のどちらでも分単位で扱う
  const [h, m] = alarmInput.value.split(':');
  alarmTime = `${pad(Number(h))}:${pad(Number(m))}`;
  hasRung = currentHM() === alarmTime; // 今まさに同じ分なら誤発火させない

  setBtn.disabled = true;
  clearBtn.disabled = false;
  alarmInput.disabled = true;
  statusEl.textContent = `⏱ ${alarmTime} にセットしたで`;
});

clearBtn.addEventListener('click', () => {
  alarmTime = null;
  hasRung = false;
  stopRinging();
  setBtn.disabled = false;
  clearBtn.disabled = true;
  alarmInput.disabled = false;
  statusEl.textContent = 'アラーム解除したで';
});

setInterval(tick, 250);
tick();
