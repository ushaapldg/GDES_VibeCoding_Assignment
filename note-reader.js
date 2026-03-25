const SVG_NS = 'http://www.w3.org/2000/svg';

// ── Audio ─────────────────────────────────────────────────────────────────────

const NOTE_FREQUENCIES = {
    'F2': 87.31,  'G2': 98.00,  'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
    'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99,
};

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playNote(noteName) {
    const freq = NOTE_FREQUENCIES[noteName];
    if (!freq) return;
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
}

// ── Note data ─────────────────────────────────────────────────────────────────
// Staff lines sit at y = [30, 42, 54, 66, 78]; each step between positions = 6px.

// Treble clef lines (bottom→top): E4 G4 B4 D5 F5
const TREBLE_NOTES = [
    { name: 'C4', y: 90, ledger: true  },  // ledger line below staff (middle C)
    { name: 'D4', y: 84, ledger: false },
    { name: 'E4', y: 78, ledger: false },  // line 1 (bottom)
    { name: 'F4', y: 72, ledger: false },
    { name: 'G4', y: 66, ledger: false },  // line 2
    { name: 'A4', y: 60, ledger: false },
    { name: 'B4', y: 54, ledger: false },  // line 3 (middle)
    { name: 'C5', y: 48, ledger: false },
    { name: 'D5', y: 42, ledger: false },  // line 4
    { name: 'E5', y: 36, ledger: false },
    { name: 'F5', y: 30, ledger: false },  // line 5 (top)
    { name: 'G5', y: 24, ledger: false },
];

// Bass clef lines (bottom→top): G2 B2 D3 F3 A3
const BASS_NOTES = [
    { name: 'F2', y: 84, ledger: false },  // space below staff
    { name: 'G2', y: 78, ledger: false },  // line 1 (bottom)
    { name: 'A2', y: 72, ledger: false },
    { name: 'B2', y: 66, ledger: false },  // line 2
    { name: 'C3', y: 60, ledger: false },
    { name: 'D3', y: 54, ledger: false },  // line 3 (middle)
    { name: 'E3', y: 48, ledger: false },
    { name: 'F3', y: 42, ledger: false },  // line 4 (the F line)
    { name: 'G3', y: 36, ledger: false },
    { name: 'A3', y: 30, ledger: false },  // line 5 (top)
    { name: 'B3', y: 24, ledger: false },
    { name: 'C4', y: 18, ledger: true  },  // ledger line above staff (middle C)
];

// ── Piano key data ────────────────────────────────────────────────────────────
// i_left for black keys = index of the white key immediately to their left.

const TREBLE_WHITE_KEYS = [
    { note: 'C4', i: 0  }, { note: 'D4', i: 1  }, { note: 'E4', i: 2  },
    { note: 'F4', i: 3  }, { note: 'G4', i: 4  }, { note: 'A4', i: 5  },
    { note: 'B4', i: 6  }, { note: 'C5', i: 7  }, { note: 'D5', i: 8  },
    { note: 'E5', i: 9  }, { note: 'F5', i: 10 }, { note: 'G5', i: 11 },
];
const TREBLE_BLACK_KEYS = [
    { i_left: 0 }, { i_left: 1 },                  // C#4, D#4
    { i_left: 3 }, { i_left: 4 }, { i_left: 5 },   // F#4, G#4, A#4
    { i_left: 7 }, { i_left: 8 },                  // C#5, D#5
    { i_left: 10 },                                 // F#5
];

// Bass piano: F2–C4 (12 white keys, same width as treble)
const BASS_WHITE_KEYS = [
    { note: 'F2', i: 0  }, { note: 'G2', i: 1  }, { note: 'A2', i: 2  },
    { note: 'B2', i: 3  }, { note: 'C3', i: 4  }, { note: 'D3', i: 5  },
    { note: 'E3', i: 6  }, { note: 'F3', i: 7  }, { note: 'G3', i: 8  },
    { note: 'A3', i: 9  }, { note: 'B3', i: 10 }, { note: 'C4', i: 11 },
];
const BASS_BLACK_KEYS = [
    { i_left: 0 }, { i_left: 1 }, { i_left: 2 },   // F#2, G#2, A#2
    { i_left: 4 }, { i_left: 5 },                  // C#3, D#3
    { i_left: 7 }, { i_left: 8 }, { i_left: 9 },   // F#3, G#3, A#3
];

const KEY_W  = 30;
const KEY_H  = 110;
const KEY_X0 = 5;

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
    score: 0,
    total: 0,
    streak: 0,
    answered: false,
    currentNote: null,
    clef: 'treble',
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-treble').addEventListener('click', () => switchClef('treble'));
    document.getElementById('btn-bass').addEventListener('click',   () => switchClef('bass'));
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    buildPiano();
    nextQuestion();
});

function switchClef(clef) {
    if (state.clef === clef) return;
    state.clef = clef;
    document.getElementById('btn-treble').classList.toggle('active', clef === 'treble');
    document.getElementById('btn-bass').classList.toggle('active',   clef === 'bass');
    buildPiano();
    nextQuestion();
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function nextQuestion() {
    state.answered = false;

    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    document.getElementById('next-btn').hidden = true;
    resetPianoKeys();

    const notes = state.clef === 'bass' ? BASS_NOTES : TREBLE_NOTES;
    const note  = notes[Math.floor(Math.random() * notes.length)];
    state.currentNote = note;

    drawStaff(note);
}

function handleKeyClick(keyEl, noteName) {
    if (state.answered) return;
    playNote(noteName);
    state.answered = true;
    state.total++;

    document.querySelectorAll('.piano-key').forEach(k => k.style.pointerEvents = 'none');

    const correct  = state.currentNote.name;
    const feedback = document.getElementById('feedback');

    if (noteName === correct) {
        state.score++;
        state.streak++;
        keyEl.classList.add('correct');
        feedback.textContent = `Correct! The note is ${correct}.`;
        feedback.className = 'feedback correct';
    } else {
        state.streak = 0;
        keyEl.classList.add('wrong');
        document.querySelectorAll('.piano-key').forEach(k => {
            if (k.getAttribute('data-note') === correct) k.classList.add('correct');
        });
        feedback.textContent = `Not quite — the note is ${correct}.`;
        feedback.className = 'feedback wrong';
    }

    updateScore();
    document.getElementById('next-btn').hidden = false;
}

function updateScore() {
    document.getElementById('score').textContent = `${state.score} / ${state.total}`;
    const streakEl = document.getElementById('streak');
    streakEl.textContent = state.streak >= 3 ? `${state.streak} in a row` : '';
    streakEl.className   = state.streak >= 3 ? 'streak-active' : '';
}

// ── Piano ─────────────────────────────────────────────────────────────────────

function buildPiano() {
    const svg       = document.getElementById('piano-svg');
    svg.innerHTML   = '';
    const whiteKeys = state.clef === 'bass' ? BASS_WHITE_KEYS : TREBLE_WHITE_KEYS;
    const blackKeys = state.clef === 'bass' ? BASS_BLACK_KEYS : TREBLE_BLACK_KEYS;

    // White keys first so black keys render on top
    whiteKeys.forEach(({ note, i }) => {
        const x    = KEY_X0 + i * KEY_W;
        const rect = el('rect', {
            x: x + 1, y: 5,
            width: KEY_W - 2, height: KEY_H,
            rx: 2, ry: 2,
            fill: '#f5f5ee', stroke: '#888', 'stroke-width': 1,
        });
        rect.setAttribute('class', 'piano-key');
        rect.setAttribute('data-note', note);
        rect.addEventListener('click', () => handleKeyClick(rect, note));
        svg.appendChild(rect);

        const txt = el('text', {
            x: x + KEY_W / 2, y: 5 + KEY_H - 8,
            'font-size': 9, 'text-anchor': 'middle',
            fill: '#444', 'font-family': 'system-ui, sans-serif',
            'pointer-events': 'none',
        });
        txt.textContent = note;
        svg.appendChild(txt);
    });

    blackKeys.forEach(({ i_left }) => {
        const bx = KEY_X0 + (i_left + 1) * KEY_W - 9;
        svg.appendChild(el('rect', {
            x: bx, y: 5, width: 18, height: 70,
            rx: 2, ry: 2,
            fill: '#1e1e30', stroke: '#000', 'stroke-width': 1,
            'pointer-events': 'none',
        }));
    });
}

function resetPianoKeys() {
    document.querySelectorAll('.piano-key').forEach(k => {
        k.classList.remove('correct', 'wrong');
        k.style.pointerEvents = '';
    });
}

// ── Staff & Note ──────────────────────────────────────────────────────────────

function drawStaff(note) {
    const svg = document.getElementById('staff-svg');
    svg.innerHTML = '';

    // Five staff lines
    [30, 42, 54, 66, 78].forEach(y => {
        svg.appendChild(el('line', {
            x1: 5, x2: 375, y1: y, y2: y,
            stroke: '#4a4a6a', 'stroke-width': 1.5,
        }));
    });

    // Clef glyph
    if (state.clef === 'treble') {
        const clef = el('text', { x: 8, y: 86, 'font-size': 72, fill: '#c0b8f8', 'font-family': 'serif' });
        clef.textContent = '𝄞';
        svg.appendChild(clef);
    } else {
        const clef = el('text', { x: 10, y: 60, 'font-size': 38, fill: '#c0b8f8', 'font-family': 'serif' });
        clef.textContent = '𝄢';
        svg.appendChild(clef);
    }

    // End barline
    svg.appendChild(el('line', {
        x1: 374, x2: 374, y1: 30, y2: 78,
        stroke: '#4a4a6a', 'stroke-width': 2,
    }));

    const nx = 200;
    const ny = note.y;

    // Ledger line drawn at the note's own y (works for both above and below staff)
    if (note.ledger) {
        svg.appendChild(el('line', {
            x1: nx - 13, x2: nx + 13, y1: ny, y2: ny,
            stroke: '#4a4a6a', 'stroke-width': 1.5,
        }));
    }

    // Stem: up when note is on/below the middle line (y ≥ 54), down otherwise
    const stemUp = ny >= 54;
    svg.appendChild(el('line', stemUp
        ? { x1: nx + 6, x2: nx + 6, y1: ny - 1, y2: ny - 36, stroke: '#e0e0f0', 'stroke-width': 1.5 }
        : { x1: nx - 6, x2: nx - 6, y1: ny + 1, y2: ny + 36, stroke: '#e0e0f0', 'stroke-width': 1.5 }
    ));

    // Note head
    svg.appendChild(el('ellipse', {
        cx: nx, cy: ny, rx: 7, ry: 5,
        fill: '#e0e0f0',
    }));
}

// ── SVG helper ────────────────────────────────────────────────────────────────

function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}
