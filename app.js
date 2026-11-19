const PHASE = { IDLE: 'IDLE', READY: 'READY', EXERCISE: 'EXERCISE', REST: 'REST', DONE: 'DONE' };
const READY_COUNTDOWN = 5;

const state = {
  phase: PHASE.IDLE,
  isPaused: false,
  currentTime: 0,
  repCount: 0,
  exerciseDuration: 5,
  restDuration: 1,
  restIncrement: 0.5,
  initialRestDuration: 1,
  totalReps: 11,
  intervalId: null,
};

// --- Audio ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(frequency, duration, type = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playExerciseStart() {
  // Three quick ascending beeps — "go!"
  beep(784, 0.12);
  setTimeout(() => beep(988, 0.12), 130);
  setTimeout(() => beep(1319, 0.25), 260);
}

function playRestStart() {
  // Two slow descending tones at low pitch, softer waveform — "stop"
  beep(392, 0.35, 'triangle');
  setTimeout(() => beep(262, 0.5, 'triangle'), 380);
}

function playExerciseCountdownBeep() {
  beep(1047, 0.08);          // high C6 — sharp and urgent
}

function playRestCountdownBeep() {
  beep(440, 0.12, 'triangle'); // A4, softer triangle wave — calm and low
}

function playCompletionSound() {
  // Triumphant ascending arpeggio: C-E-G-C (major chord)
  beep(262, 0.2, 'sine');      // C4
  setTimeout(() => beep(330, 0.2, 'sine'), 220);  // E4
  setTimeout(() => beep(392, 0.2, 'sine'), 440);  // G4
  setTimeout(() => beep(523, 0.6, 'sine'), 660);  // C5, longer hold
}

// --- DOM refs ---
const configPanel    = document.getElementById('config-panel');
const timerPanel     = document.getElementById('timer-panel');
const phaseLabel     = document.getElementById('phase-label');
const countdownEl    = document.getElementById('countdown');
const repLabel       = document.getElementById('rep-label');
const nextRestLabel  = document.getElementById('next-rest-label');
const startPauseBtn  = document.getElementById('btn-start-pause');
const resetBtn       = document.getElementById('btn-reset');
const inputExercise  = document.getElementById('input-exercise');
const inputRest      = document.getElementById('input-rest');
const inputIncrement = document.getElementById('input-increment');
const inputReps      = document.getElementById('input-reps');

// --- Helpers ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}`;
}

function setPhaseUI(phase) {
  document.body.className = phase.toLowerCase();
  if (phase === PHASE.EXERCISE) phaseLabel.textContent = 'EXERCISE';
  else if (phase === PHASE.REST) phaseLabel.textContent = 'REST';
  else if (phase === PHASE.READY) phaseLabel.textContent = 'GET READY';
  else if (phase === PHASE.DONE) phaseLabel.textContent = 'DONE';
}

function updateCountdownDisplay() {
  countdownEl.textContent = formatTime(state.currentTime);
}

function updateRepDisplay() {
  repLabel.textContent = `Rep ${state.repCount}`;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function updateNextRestDisplay() {
  if (state.phase === PHASE.EXERCISE) {
    nextRestLabel.textContent = `Rest after this: ${fmt(state.restDuration)}s`;
  } else {
    const nextRest = state.restDuration + state.restIncrement;
    nextRestLabel.textContent = state.restIncrement > 0
      ? `Next rest: ${fmt(nextRest)}s (+${fmt(state.restIncrement)}s)`
      : '';
  }
}

function showTimer() {
  configPanel.classList.add('hidden');
  timerPanel.classList.remove('hidden');
  resetBtn.classList.remove('hidden');
}

function showConfig() {
  configPanel.classList.remove('hidden');
  timerPanel.classList.add('hidden');
  resetBtn.classList.add('hidden');
  document.body.className = '';
}

// --- Timer logic ---
function tick() {
  if (state.currentTime <= 3 && state.currentTime > 0) {
    if (state.phase === PHASE.EXERCISE) playExerciseCountdownBeep();
    else if (state.phase === PHASE.REST) playRestCountdownBeep();
  }

  if (state.currentTime === 0) {
    transitionPhase();
    return;
  }

  state.currentTime--;
  updateCountdownDisplay();
}

function transitionPhase() {
  if (state.phase === PHASE.READY) {
    // Buffer done — start first exercise
    state.repCount = 1;
    state.phase = PHASE.EXERCISE;
    state.currentTime = state.exerciseDuration;
    setPhaseUI(PHASE.EXERCISE);
    updateRepDisplay();
    updateNextRestDisplay();
    playExerciseStart();
    updateCountdownDisplay();
    return;
  }

  if (state.phase === PHASE.EXERCISE) {
    if (state.repCount >= state.totalReps) {
      // All reps done
      clearTimer();
      state.phase = PHASE.DONE;
      setPhaseUI(PHASE.DONE);
      countdownEl.textContent = '';
      repLabel.textContent = `${state.totalReps} reps complete!`;
      nextRestLabel.textContent = '';
      startPauseBtn.textContent = 'Start';
      playCompletionSound();
      return;
    }
    // Switch to REST
    state.phase = PHASE.REST;
    state.currentTime = Math.round(state.restDuration);
    setPhaseUI(PHASE.REST);
    updateNextRestDisplay();
    playRestStart();
  } else {
    // Switch to EXERCISE
    state.restDuration += state.restIncrement;
    state.repCount++;
    state.phase = PHASE.EXERCISE;
    state.currentTime = state.exerciseDuration;
    setPhaseUI(PHASE.EXERCISE);
    updateRepDisplay();
    updateNextRestDisplay();
    playExerciseStart();
  }
  updateCountdownDisplay();
}

function startInterval() {
  state.intervalId = setInterval(tick, 1000);
}

function clearTimer() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

// --- Controls ---
function readInputs() {
  const ex = parseInt(inputExercise.value, 10);
  const rest = parseInt(inputRest.value, 10);
  const inc = parseFloat(inputIncrement.value);
  const reps = parseInt(inputReps.value, 10);
  if (isNaN(ex) || ex < 1) { inputExercise.focus(); return false; }
  if (isNaN(rest) || rest < 0) { inputRest.focus(); return false; }
  if (isNaN(inc) || inc < 0) { inputIncrement.focus(); return false; }
  if (isNaN(reps) || reps < 1) { inputReps.focus(); return false; }
  state.exerciseDuration  = ex;
  state.restDuration      = rest;
  state.initialRestDuration = rest;
  state.restIncrement     = inc;
  state.totalReps         = reps;
  return true;
}

startPauseBtn.addEventListener('click', () => {
  // Resume AudioContext if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (state.phase === PHASE.DONE) {
    // Treat Start on the done screen as a full reset back to config
    state.phase = PHASE.IDLE;
    state.isPaused = false;
    state.repCount = 0;
    state.restDuration = state.initialRestDuration;
    state.currentTime = 0;
    showConfig();
    return;
  }

  if (state.phase === PHASE.IDLE) {
    // First start — 5-second "get ready" buffer
    if (!readInputs()) return;
    state.phase = PHASE.READY;
    state.currentTime = READY_COUNTDOWN;
    showTimer();
    setPhaseUI(PHASE.READY);
    updateCountdownDisplay();
    repLabel.textContent = '';
    nextRestLabel.textContent = '';
    startPauseBtn.textContent = 'Pause';
    startInterval();
    return;
  }

  if (!state.isPaused) {
    // Pause
    clearTimer();
    state.isPaused = true;
    startPauseBtn.textContent = 'Resume';
    phaseLabel.textContent += ' (paused)';
  } else {
    // Resume
    state.isPaused = false;
    startPauseBtn.textContent = 'Pause';
    setPhaseUI(state.phase);
    startInterval();
  }
});

resetBtn.addEventListener('click', () => {
  clearTimer();
  state.phase = PHASE.IDLE;
  state.isPaused = false;
  state.repCount = 0;
  state.restDuration = state.initialRestDuration;
  state.currentTime = 0;
  startPauseBtn.textContent = 'Start';
  showConfig();
});
