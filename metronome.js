const LOOKAHEAD = 0.1;      // seconds to schedule ahead
const SCHEDULER_INTERVAL = 25; // ms between scheduler ticks

const state = {
    bpm: 120,
    beatsPerMeasure: 4,
    isPlaying: false,
    audioCtx: null,
    schedulerTimer: null,
    animFrameId: null,
    // Queue of { beatIndex, time } for the animation loop to consume
    scheduledBeats: [],
    // Last beat that the animation loop has acknowledged
    lastAckedBeat: { index: -1, time: 0 },
    nextBeatTime: 0,
    nextBeatIndex: 0,
};

// --- DOM refs ---
let bpmSlider, bpmDisplay, timeSigSelect, playStopBtn, beatBar, beatIndicator, beatLabels;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    bpmSlider     = document.getElementById('bpm-slider');
    bpmDisplay    = document.getElementById('bpm-display');
    timeSigSelect = document.getElementById('time-sig');
    playStopBtn   = document.getElementById('play-stop-btn');
    beatBar       = document.getElementById('beat-bar');
    beatIndicator = document.getElementById('beat-indicator');
    beatLabels    = document.getElementById('beat-labels');

    bpmSlider.addEventListener('input', () => {
        state.bpm = parseInt(bpmSlider.value);
        bpmDisplay.value = state.bpm;
    });

    bpmDisplay.addEventListener('input', () => {
        const val = parseInt(bpmDisplay.value);
        if (!isNaN(val) && val >= 20 && val <= 240) {
            state.bpm = val;
            bpmSlider.value = val;
        }
    });

    bpmDisplay.addEventListener('blur', () => {
        const val = Math.max(20, Math.min(240, parseInt(bpmDisplay.value) || state.bpm));
        state.bpm = val;
        bpmSlider.value = val;
        bpmDisplay.value = val;
    });

    timeSigSelect.addEventListener('change', () => {
        parseTimeSig(timeSigSelect.value);
        renderMarkers();
        if (!state.isPlaying) resetVisuals();
    });

    playStopBtn.addEventListener('click', () => {
        state.isPlaying ? stopMetronome() : startMetronome();
    });

    parseTimeSig(timeSigSelect.value);
    renderMarkers();
});

// --- Time signature ---
function parseTimeSig(str) {
    const [beats] = str.split('/').map(Number);
    state.beatsPerMeasure = beats;
}

function secondsPerBeat() {
    return 60 / state.bpm;
}

// --- Marker rendering ---
function renderMarkers() {
    // Remove existing markers and labels (keep the indicator)
    beatBar.querySelectorAll('.beat-marker').forEach(el => el.remove());
    beatLabels.innerHTML = '';

    for (let i = 0; i < state.beatsPerMeasure; i++) {
        const pct = (i / state.beatsPerMeasure) * 100;

        // Marker dot on bar
        const marker = document.createElement('div');
        marker.className = 'beat-marker' + (i === 0 ? ' beat-one' : '');
        marker.dataset.beat = i;
        marker.style.left = pct + '%';
        beatBar.appendChild(marker);

        // Number label below bar
        const label = document.createElement('div');
        label.className = 'beat-label' + (i === 0 ? ' beat-one' : '');
        label.style.left = pct + '%';
        label.textContent = i + 1;
        beatLabels.appendChild(label);
    }
}

function getMarker(index) {
    return beatBar.querySelector(`.beat-marker[data-beat="${index}"]`);
}

// --- Audio scheduling ---
function scheduleClick(time, beatIndex) {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);

    osc.frequency.value = beatIndex === 0 ? 1000 : 600;
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.09);

    state.scheduledBeats.push({ index: beatIndex, time });
}

function scheduler() {
    const ctx = state.audioCtx;
    while (state.nextBeatTime < ctx.currentTime + LOOKAHEAD) {
        scheduleClick(state.nextBeatTime, state.nextBeatIndex);
        state.nextBeatTime += secondsPerBeat();
        state.nextBeatIndex = (state.nextBeatIndex + 1) % state.beatsPerMeasure;
    }
}

// --- Animation ---
function animationLoop() {
    if (!state.isPlaying) return;

    const now = state.audioCtx.currentTime;
    const barWidth = beatBar.offsetWidth;
    const indicatorWidth = 3;

    // Process any newly passed beats from the queue
    while (state.scheduledBeats.length > 0 && state.scheduledBeats[0].time <= now) {
        const beat = state.scheduledBeats.shift();
        // Deactivate previous marker
        const prev = getMarker(state.lastAckedBeat.index);
        if (prev) prev.classList.remove('active');

        // Activate current marker
        const curr = getMarker(beat.index);
        if (curr) curr.classList.add('active');

        // Flash bar border on downbeat
        if (beat.index === 0) {
            beatBar.classList.remove('downbeat');
            void beatBar.offsetWidth; // force reflow to restart animation
            beatBar.classList.add('downbeat');
        }

        state.lastAckedBeat = beat;
    }

    // Compute indicator position
    const spb = secondsPerBeat();
    const measureDuration = spb * state.beatsPerMeasure;
    const elapsed = now - state.lastAckedBeat.time;
    const beatOffset = state.lastAckedBeat.index * spb;
    const fraction = Math.min((beatOffset + elapsed) / measureDuration, 1);
    const x = Math.min(fraction * barWidth, barWidth - indicatorWidth);

    beatIndicator.style.transform = `translateX(${x}px)`;

    state.animFrameId = requestAnimationFrame(animationLoop);
}

// --- Play / Stop ---
function startMetronome() {
    if (!state.audioCtx) {
        state.audioCtx = new AudioContext();
    } else {
        state.audioCtx.resume();
    }

    state.isPlaying = true;
    state.nextBeatTime = state.audioCtx.currentTime + 0.05;
    state.nextBeatIndex = 0;
    state.scheduledBeats = [];
    state.lastAckedBeat = { index: 0, time: state.nextBeatTime };

    playStopBtn.textContent = 'Stop';
    playStopBtn.classList.add('playing');

    scheduler();
    state.schedulerTimer = setInterval(scheduler, SCHEDULER_INTERVAL);
    state.animFrameId = requestAnimationFrame(animationLoop);
}

function stopMetronome() {
    state.isPlaying = false;

    clearInterval(state.schedulerTimer);
    cancelAnimationFrame(state.animFrameId);

    state.scheduledBeats = [];
    resetVisuals();

    playStopBtn.textContent = 'Play';
    playStopBtn.classList.remove('playing');
}

function resetVisuals() {
    beatIndicator.style.transform = 'translateX(0)';
    beatBar.classList.remove('downbeat');
    beatBar.querySelectorAll('.beat-marker').forEach(m => m.classList.remove('active'));
}
