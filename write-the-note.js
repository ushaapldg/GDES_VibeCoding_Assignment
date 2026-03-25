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

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
    score: 0,
    total: 0,
    streak: 0,
    answered: false,
    currentNote: null,
    clef: 'treble',
    showName: false,
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-treble').addEventListener('click', () => switchClef('treble'));
    document.getElementById('btn-bass').addEventListener('click',   () => switchClef('bass'));
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('play-btn').addEventListener('click', () => {
        if (state.currentNote) playNote(state.currentNote.name);
    });
    document.getElementById('toggle-name').addEventListener('change', function () {
        state.showName = this.checked;
        updateNameDisplay();
    });
    nextQuestion();
});

function switchClef(clef) {
    if (state.clef === clef) return;
    state.clef = clef;
    document.getElementById('btn-treble').classList.toggle('active', clef === 'treble');
    document.getElementById('btn-bass').classList.toggle('active',   clef === 'bass');
    nextQuestion();
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function nextQuestion() {
    state.answered = false;

    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
    document.getElementById('next-btn').hidden = true;

    const notes = state.clef === 'bass' ? BASS_NOTES : TREBLE_NOTES;
    state.currentNote = notes[Math.floor(Math.random() * notes.length)];

    updateNameDisplay();
    drawInteractiveStaff();
    playNote(state.currentNote.name);
}

function updateNameDisplay() {
    document.getElementById('note-name').textContent =
        state.showName ? state.currentNote.name : '?';
}

function handleNoteClick(note) {
    if (state.answered) return;
    state.answered = true;
    state.total++;

    const correct   = state.currentNote;
    const isCorrect = note.name === correct.name;

    if (isCorrect) {
        state.score++;
        state.streak++;
    } else {
        state.streak = 0;
    }

    drawResultStaff(note, correct, isCorrect);

    const feedback = document.getElementById('feedback');
    if (isCorrect) {
        feedback.textContent = `Correct! That's ${correct.name}.`;
        feedback.className   = 'feedback correct';
    } else {
        feedback.textContent = `Not quite — the note is ${correct.name}.`;
        feedback.className   = 'feedback wrong';
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

// ── Staff drawing ─────────────────────────────────────────────────────────────

function drawStaffBase(svg) {
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
}

function drawNoteAt(parent, note, color, opacity) {
    const nx  = 200;
    const ny  = note.y;
    const op  = opacity ?? 1;

    if (note.ledger) {
        parent.appendChild(el('line', {
            x1: nx - 13, x2: nx + 13, y1: ny, y2: ny,
            stroke: color, 'stroke-width': 1.5, opacity: op,
        }));
    }

    const stemUp = ny >= 54;
    parent.appendChild(el('line', stemUp
        ? { x1: nx + 6, x2: nx + 6, y1: ny - 1, y2: ny - 36, stroke: color, 'stroke-width': 1.5, opacity: op }
        : { x1: nx - 6, x2: nx - 6, y1: ny + 1, y2: ny + 36, stroke: color, 'stroke-width': 1.5, opacity: op }
    ));

    parent.appendChild(el('ellipse', {
        cx: nx, cy: ny, rx: 7, ry: 5,
        fill: color, opacity: op,
    }));
}

function drawInteractiveStaff() {
    const svg = document.getElementById('staff-svg');
    drawStaffBase(svg);

    const notes = state.clef === 'bass' ? BASS_NOTES : TREBLE_NOTES;

    // Subtle position-hint ticks at each note row
    notes.forEach(note => {
        svg.appendChild(el('line', {
            x1: 58, x2: 63, y1: note.y, y2: note.y,
            stroke: '#3a3a5c', 'stroke-width': 1,
        }));
    });

    // Ghost-note group rendered above the hit zone (pointer-events disabled so
    // all mouse events fall through to the hit zone below)
    const ghostGroup = document.createElementNS(SVG_NS, 'g');
    ghostGroup.setAttribute('id', 'ghost-note');
    ghostGroup.setAttribute('pointer-events', 'none');
    svg.appendChild(ghostGroup);

    // Full-area hit zone (transparent)
    const hitZone = el('rect', {
        x: 60, y: 8,
        width: 305, height: 100,
        fill: 'transparent',
        cursor: 'crosshair',
    });

    hitZone.addEventListener('mousemove', e => {
        if (state.answered) return;
        const note  = nearestNote(e, svg, notes);
        const ghost = document.getElementById('ghost-note');
        ghost.innerHTML = '';
        drawNoteAt(ghost, note, '#a89cf7', 0.45);
    });

    hitZone.addEventListener('mouseleave', () => {
        const ghost = document.getElementById('ghost-note');
        if (ghost) ghost.innerHTML = '';
    });

    hitZone.addEventListener('click', e => {
        if (state.answered) return;
        handleNoteClick(nearestNote(e, svg, notes));
    });

    svg.appendChild(hitZone);
}

function drawResultStaff(attempted, correct, isCorrect) {
    const svg = document.getElementById('staff-svg');
    drawStaffBase(svg);

    if (isCorrect) {
        drawNoteAt(svg, correct, '#7ee89e');
    } else {
        drawNoteAt(svg, attempted, '#e07070');
        drawNoteAt(svg, correct, '#7ee89e');
    }
}

// Convert a mouse event's clientY into SVG-space Y, then snap to nearest note.
function nearestNote(e, svg, notes) {
    const rect = svg.getBoundingClientRect();
    const svgY = (e.clientY - rect.top) / rect.height * 108;
    return notes.reduce((best, note) =>
        Math.abs(note.y - svgY) < Math.abs(best.y - svgY) ? note : best
    );
}

// ── SVG helper ────────────────────────────────────────────────────────────────

function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}
