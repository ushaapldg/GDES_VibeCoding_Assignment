const KEYS = [
    { sharps: 0, flats: 0, major: 'C major',  minor: 'A minor',   hint: 'No sharps or flats.' },
    { sharps: 1, flats: 0, major: 'G major',  minor: 'E minor',   hint: '1 sharp: F♯' },
    { sharps: 2, flats: 0, major: 'D major',  minor: 'B minor',   hint: '2 sharps: F♯ C♯' },
    { sharps: 3, flats: 0, major: 'A major',  minor: 'F♯ minor',  hint: '3 sharps: F♯ C♯ G♯' },
    { sharps: 4, flats: 0, major: 'E major',  minor: 'C♯ minor',  hint: '4 sharps: F♯ C♯ G♯ D♯' },
    { sharps: 5, flats: 0, major: 'B major',  minor: 'G♯ minor',  hint: '5 sharps: F♯ C♯ G♯ D♯ A♯' },
    { sharps: 6, flats: 0, major: 'F♯ major', minor: 'D♯ minor',  hint: '6 sharps: F♯ C♯ G♯ D♯ A♯ E♯' },
    { sharps: 7, flats: 0, major: 'C♯ major', minor: 'A♯ minor',  hint: '7 sharps: F♯ C♯ G♯ D♯ A♯ E♯ B♯' },
    { sharps: 0, flats: 1, major: 'F major',  minor: 'D minor',   hint: '1 flat: B♭' },
    { sharps: 0, flats: 2, major: 'B♭ major', minor: 'G minor',   hint: '2 flats: B♭ E♭' },
    { sharps: 0, flats: 3, major: 'E♭ major', minor: 'C minor',   hint: '3 flats: B♭ E♭ A♭' },
    { sharps: 0, flats: 4, major: 'A♭ major', minor: 'F minor',   hint: '4 flats: B♭ E♭ A♭ D♭' },
    { sharps: 0, flats: 5, major: 'D♭ major', minor: 'B♭ minor',  hint: '5 flats: B♭ E♭ A♭ D♭ G♭' },
    { sharps: 0, flats: 6, major: 'G♭ major', minor: 'E♭ minor',  hint: '6 flats: B♭ E♭ A♭ D♭ G♭ C♭' },
    { sharps: 0, flats: 7, major: 'C♭ major', minor: 'A♭ minor',  hint: '7 flats: B♭ E♭ A♭ D♭ G♭ C♭ F♭' },
];

// Y positions for each sharp/flat symbol in treble clef
// Staff lines at y = [30, 42, 54, 66, 78], step = 6px
// Order: F C G D A E B
const SHARP_Y = [30, 48, 24, 42, 60, 36, 54];
// Order: B E A D G C F
const FLAT_Y  = [54, 36, 60, 42, 66, 48, 72];

const SYMBOL_X_START = 72;
const SYMBOL_X_GAP   = 14;
const SVG_NS = 'http://www.w3.org/2000/svg';

const state = {
    score: 0,
    total: 0,
    streak: 0,
    answered: false,
    currentKey: null,
    questionType: null,
};

document.addEventListener('DOMContentLoaded', nextQuestion);

function nextQuestion() {
    state.answered = false;

    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    // Remove any leftover next button
    document.querySelector('.next-btn')?.remove();

    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    state.currentKey = key;
    state.questionType = Math.random() < 0.5 ? 'major' : 'minor';

    drawStaff(key);
    document.getElementById('question').textContent =
        `What ${state.questionType} key has this signature?`;

    const correct = key[state.questionType];
    const pool = KEYS
        .filter(k => k !== key)
        .map(k => k[state.questionType])
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
    const options = [...pool, correct].sort(() => Math.random() - 0.5);

    renderOptions(options, correct);
}

function renderOptions(options, correct) {
    const container = document.getElementById('options');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => handleAnswer(btn, opt, correct));
        container.appendChild(btn);
    });
}

function handleAnswer(btn, chosen, correct) {
    if (state.answered) return;
    state.answered = true;
    state.total++;

    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    const feedback = document.getElementById('feedback');

    if (chosen === correct) {
        state.score++;
        state.streak++;
        btn.classList.add('correct');
        feedback.textContent = `Correct! ${state.currentKey.hint}`;
        feedback.className = 'feedback correct';
    } else {
        state.streak = 0;
        btn.classList.add('wrong');
        document.querySelectorAll('.option-btn').forEach(b => {
            if (b.textContent === correct) b.classList.add('correct');
        });
        feedback.textContent = `Not quite — the answer is ${correct}. ${state.currentKey.hint}`;
        feedback.className = 'feedback wrong';
    }

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
    streakEl.className = state.streak >= 3 ? 'streak-active' : '';
}

// --- SVG Staff ---
function drawStaff(key) {
    const svg = document.getElementById('staff-svg');
    svg.innerHTML = '';

    // Staff lines
    [30, 42, 54, 66, 78].forEach(y => {
        const line = el('line', { x1: 5, x2: 375, y1: y, y2: y, stroke: '#4a4a6a', 'stroke-width': 1.5 });
        svg.appendChild(line);
    });

    // Treble clef
    const clef = el('text', { x: 8, y: 86, 'font-size': 72, fill: '#c0b8f8', 'font-family': 'serif' });
    clef.textContent = '𝄞';
    svg.appendChild(clef);

    // Barline at end
    const bar = el('line', { x1: 374, x2: 374, y1: 30, y2: 78, stroke: '#4a4a6a', 'stroke-width': 2 });
    svg.appendChild(bar);

    // Draw symbols
    if (key.sharps > 0) {
        for (let i = 0; i < key.sharps; i++) {
            const sym = el('text', {
                x: SYMBOL_X_START + i * SYMBOL_X_GAP,
                y: SHARP_Y[i] + 8,   // offset for text baseline
                'font-size': 16,
                fill: '#e0e0f0',
                'font-family': 'serif',
            });
            sym.textContent = '♯';
            svg.appendChild(sym);
        }
    } else if (key.flats > 0) {
        for (let i = 0; i < key.flats; i++) {
            const sym = el('text', {
                x: SYMBOL_X_START + i * SYMBOL_X_GAP,
                y: FLAT_Y[i] + 5,    // offset for text baseline
                'font-size': 18,
                fill: '#e0e0f0',
                'font-family': 'serif',
            });
            sym.textContent = '♭';
            svg.appendChild(sym);
        }
    }
}

function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}
