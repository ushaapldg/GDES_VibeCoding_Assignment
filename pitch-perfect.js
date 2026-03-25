// ── Note pools ────────────────────────────────────────────────────────────────

const NATURAL_NOTES = [
    { freq: 261.63, label: 'C' },
    { freq: 293.66, label: 'D' },
    { freq: 329.63, label: 'E' },
    { freq: 349.23, label: 'F' },
    { freq: 392.00, label: 'G' },
    { freq: 440.00, label: 'A' },
    { freq: 493.88, label: 'B' },
];

// Accidentals shown as sharps; enharmonic flat shown in feedback.
const CHROMATIC_NOTES = [
    { freq: 261.63, label: 'C',  enharmonic: null  },
    { freq: 277.18, label: 'C♯', enharmonic: 'D♭'  },
    { freq: 293.66, label: 'D',  enharmonic: null  },
    { freq: 311.13, label: 'D♯', enharmonic: 'E♭'  },
    { freq: 329.63, label: 'E',  enharmonic: null  },
    { freq: 349.23, label: 'F',  enharmonic: null  },
    { freq: 369.99, label: 'F♯', enharmonic: 'G♭'  },
    { freq: 392.00, label: 'G',  enharmonic: null  },
    { freq: 415.30, label: 'G♯', enharmonic: 'A♭'  },
    { freq: 440.00, label: 'A',  enharmonic: null  },
    { freq: 466.16, label: 'A♯', enharmonic: 'B♭'  },
    { freq: 493.88, label: 'B',  enharmonic: null  },
];

function activePool() {
    return state.chromatic ? CHROMATIC_NOTES : NATURAL_NOTES;
}

// ── Audio ─────────────────────────────────────────────────────────────────────

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playFreq(freq) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const harmonics  = [1, 2, 3, 4, 6];
    const amplitudes = [1, 0.45, 0.2, 0.08, 0.03];

    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.28, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.25);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    harmonics.forEach((h, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h, now);
        gain.gain.setValueAtTime(amplitudes[i], now);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 2.2);
    });

    // Pulse the note icon
    const visual = document.getElementById('note-visual');
    visual.classList.remove('playing');
    void visual.offsetWidth; // force reflow to restart animation
    visual.classList.add('playing');
}

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
    score: 0,
    total: 0,
    streak: 0,
    answered: false,
    currentNote: null,
    chromatic: false,
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('play-btn').addEventListener('click', () => {
        if (state.currentNote) playFreq(state.currentNote.freq);
    });
    document.getElementById('btn-naturals').addEventListener('click',  () => setMode(false));
    document.getElementById('btn-chromatic').addEventListener('click', () => setMode(true));
    nextQuestion();
});

function setMode(chromatic) {
    if (state.chromatic === chromatic) return;
    state.chromatic = chromatic;

    // Reset score when difficulty changes
    state.score = 0;
    state.total = 0;
    state.streak = 0;
    updateScore();

    document.getElementById('btn-naturals').classList.toggle('active', !chromatic);
    document.getElementById('btn-chromatic').classList.toggle('active',  chromatic);

    nextQuestion();
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function nextQuestion() {
    state.answered = false;

    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    document.querySelector('.next-btn')?.remove();

    const pool = activePool();
    const note = pool[Math.floor(Math.random() * pool.length)];
    state.currentNote = note;

    playFreq(note.freq);
    renderOptions(note.label);
}

function renderOptions(correctLabel) {
    const container = document.getElementById('options');
    container.innerHTML = '';

    const allLabels = activePool().map(n => n.label);
    const wrong     = allLabels
        .filter(l => l !== correctLabel)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    const options   = [...wrong, correctLabel].sort(() => Math.random() - 0.5);

    options.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = label;
        btn.addEventListener('click', () => handleAnswer(btn, label, correctLabel));
        container.appendChild(btn);
    });
}

function handleAnswer(btn, chosen, correct) {
    if (state.answered) return;
    state.answered = true;
    state.total++;

    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    const note     = state.currentNote;
    const feedback = document.getElementById('feedback');
    const also     = note.enharmonic ? ` (also called ${note.enharmonic})` : '';

    if (chosen === correct) {
        state.score++;
        state.streak++;
        btn.classList.add('correct');
        feedback.textContent = `Correct! That note is ${correct}${also}.`;
        feedback.className = 'feedback correct';
    } else {
        state.streak = 0;
        btn.classList.add('wrong');
        document.querySelectorAll('.option-btn').forEach(b => {
            if (b.textContent === correct) b.classList.add('correct');
        });
        feedback.textContent = `Not quite — that was ${correct}${also}.`;
        feedback.className = 'feedback wrong';
    }

    // Replay the correct note so the player can associate sound with name
    playFreq(note.freq);

    updateScore();

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', nextQuestion);
    document.getElementById('options').appendChild(nextBtn);
}

function updateScore() {
    document.getElementById('score').textContent = `${state.score} / ${state.total}`;
    const streakEl = document.getElementById('streak');
    streakEl.textContent = state.streak >= 3 ? `${state.streak} in a row` : '';
    streakEl.className   = state.streak >= 3 ? 'streak-active' : '';
}
