/* ============================================
   CODE HUB — SHARED SCRIPT
   ============================================ */

/* ---- Tab switching ---- */
function switchLang(langId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.lang-btn').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(langId);
    if (target) target.classList.add('active');
    document.querySelectorAll(`.lang-btn[data-lang="${langId}"]`).forEach(el => el.classList.add('active'));

    // reset inner tabs to first
    const firstInner = target && target.querySelector('.inner-tab-btn');
    if (firstInner) {
        const tabName = firstInner.dataset.tab;
        if (tabName) openInnerTab(tabName, target);
    }

    // init practice if open
    const practicePane = target && target.querySelector('.practice-home');
    if (practicePane && practicePane.children.length === 0) {
        const topics = window._practiceTopics && window._practiceTopics[langId];
        if (topics) buildTopicGrid(langId, topics, practicePane.querySelector('.practice-topic-grid'));
    }
}

function openInnerTab(tabName, scopeEl) {
    const scope = scopeEl || document;
    scope.querySelectorAll('.inner-tab-content').forEach(el => el.classList.remove('active'));
    scope.querySelectorAll('.inner-tab-btn').forEach(el => el.classList.remove('active'));
    const target = scope.querySelector(`#${tabName}`);
    if (target) target.classList.add('active');
    scope.querySelectorAll(`.inner-tab-btn[data-tab="${tabName}"]`).forEach(el => el.classList.add('active'));
}

/* ---- Mobile menu ---- */
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('menuToggle');
    const nav    = document.getElementById('langNav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // Close menu on lang select (mobile)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (toggle) toggle.classList.remove('active');
            if (nav) nav.classList.remove('active');
        });
    });
});

/* ============================================
   PRACTICE MODULE
   ============================================ */

const PROXY_URL = 'https://codelearning.owensanrios.workers.dev';

const quizState = {
    questions: [], current: 0, score: 0,
    answered: false, topic: null, answers: [], langId: null
};

function buildTopicGrid(langId, topics, gridEl) {
    if (!gridEl || gridEl.children.length > 0) return;
    gridEl.innerHTML = topics.map(t => `
        <button class="practice-topic-card" onclick="startQuiz('${langId}','${t.id}')" style="--tc:${t.color}">
            <span class="ptc-icon">${t.icon}</span>
            <span>${t.label}</span>
        </button>
    `).join('');
}

async function startQuiz(langId, topicId) {
    const topics = window._practiceTopics[langId];
    const topic  = topics.find(t => t.id === topicId);
    if (!topic) return;

    quizState.topic   = topic;
    quizState.langId  = langId;
    quizState.current = 0;
    quizState.score   = 0;
    quizState.answers = [];

    _showView('quiz', langId);
    document.getElementById('quiz-topic-label').textContent = `${topic.icon} ${topic.label}`;
    document.getElementById('quiz-progress').textContent = '';
    document.getElementById('quiz-loading').style.display = 'flex';
    document.getElementById('quiz-question-area').style.display = 'none';
    document.getElementById('quiz-error').style.display = 'none';

    try {
        const result = await _fetchQuiz(topic, langId);
        quizState.questions = result.questions;
        document.getElementById('quiz-loading').style.display = 'none';
        document.getElementById('quiz-question-area').style.display = 'block';
        _renderQuestion();
    } catch (err) {
        console.error('Quiz error:', err);
        document.getElementById('quiz-loading').style.display = 'none';
        document.getElementById('quiz-error').style.display = 'flex';
    }
}

async function _fetchQuiz(topic, langId) {
    const langName = langId.replace(/-/g, '/').toUpperCase();

    const prompt = `You are a programming quiz generator for a code learning website.
Generate EXACTLY 5 multiple-choice questions based ONLY on the content provided below.
Hard rules:
- Focus on ${langName} syntax, concepts, and best practices from the content.
- Each question has exactly 4 options labeled as plain text (no A/B/C/D prefix needed).
- Exactly ONE option is correct.
- Include code snippets in questions where appropriate (wrap code in backticks).
- Keep difficulty beginner to intermediate.
- Vary styles: "What does X do?", "Which is correct?", "What will this output?", fill-in-the-blank.

RETURN STRICT JSON ONLY — no markdown, no preamble:
{"questions":[{"q":"question","opts":["opt1","opt2","opt3","opt4"],"ans":0,"tip":"short explanation"}]}

Topic: "${topic.label}"
Content:
${topic.content}`;

    const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            }
        })
    });

    const data = await res.json();
    if (!res.ok) {
        const errorMessage = data?.error?.message || data?.error || JSON.stringify(data);
        console.error('Proxy/API Error:', data);
        throw new Error(`HTTP ${res.status}: ${errorMessage}`);
    }

    const rawJsonText = (() => {
        const candidate = data?.candidates?.[0];
        if (!candidate) return null;

        const content = candidate.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content) && content.length > 0) {
            if (typeof content[0]?.text === 'string') return content[0].text;
            if (Array.isArray(content[0]?.parts) && content[0].parts.length > 0) {
                return content[0].parts[0].text;
            }
        }
        if (content?.parts?.length > 0) {
            return content.parts[0].text;
        }
        return null;
    })();

    if (!rawJsonText) {
        console.error('Proxy response did not contain expected text payload:', data);
        throw new Error('Quiz response missing content. Check the console.');
    }

    try {
        let parsed = typeof rawJsonText === 'string'
            ? JSON.parse(rawJsonText.trim())
            : rawJsonText;

        if (Array.isArray(parsed)) {
            parsed = { questions: parsed };
        }

        if (!parsed || !Array.isArray(parsed.questions)) {
            console.error('Unexpected quiz data format from proxy:', parsed);
            throw new Error('Invalid quiz data format received from proxy.');
        }

        return parsed;
    } catch (err) {
        console.error('Failed to parse quiz JSON from proxy response:', rawJsonText, err);
        throw new Error('Could not parse the quiz data. Check the console.');
    }
}

function _renderQuestion() {
    const { questions, current } = quizState;
    const q     = questions[current];
    const total = questions.length;
    document.getElementById('quiz-progress').textContent = `${current + 1} / ${total}`;

    // Convert backtick code in text to <code> tags
    function renderText(str) {
        return str.replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    document.getElementById('quiz-question-area').innerHTML = `
        <div class="quiz-card">
            <p class="quiz-q-label">Question ${current + 1} <span style="opacity:.4">of ${total}</span></p>
            <p class="quiz-q-text">${renderText(q.q)}</p>
            <div class="quiz-options">
                ${q.opts.map((opt, i) => `
                    <button class="quiz-opt-btn" id="qopt-${i}" onclick="selectAnswer(${i})">${renderText(opt)}</button>
                `).join('')}
            </div>
            <div id="quiz-feedback" class="quiz-feedback" style="display:none;"></div>
            <button id="quiz-next-btn" class="quiz-next-btn" onclick="nextQuestion()" style="display:none;">
                ${current + 1 < total ? 'Next →' : 'See Results'}
            </button>
        </div>`;
    quizState.answered = false;
}

function selectAnswer(idx) {
    if (quizState.answered) return;
    quizState.answered = true;
    const q       = quizState.questions[quizState.current];
    const correct = q.ans;
    const isRight = idx === correct;
    if (isRight) quizState.score++;
    quizState.answers.push({ selected: idx, correct, isRight });

    q.opts.forEach((_, i) => {
        const btn = document.getElementById(`qopt-${i}`);
        btn.disabled = true;
        if (i === correct)   btn.classList.add('q-correct');
        else if (i === idx)  btn.classList.add('q-wrong');
        else                 btn.classList.add('q-dim');
    });

    const fb = document.getElementById('quiz-feedback');
    fb.style.display = 'flex';
    fb.className = `quiz-feedback ${isRight ? 'fb-correct' : 'fb-wrong'}`;
    fb.innerHTML = `<span>${isRight ? '✅ Correct!' : `❌ Answer: <strong>${q.opts[correct]}</strong>`}${q.tip ? ` — ${q.tip}` : ''}</span>`;
    document.getElementById('quiz-next-btn').style.display = 'block';
}

function nextQuestion() {
    quizState.current++;
    if (quizState.current < quizState.questions.length) {
        _renderQuestion();
    } else {
        _showResults();
    }
}

function _showResults() {
    _showView('results', quizState.langId);
    const { score, questions } = quizState;
    const total = questions.length;
    const pct   = Math.round((score / total) * 100);
    const [emoji, title] = pct === 100 ? ['🏆','Perfect!'] : pct >= 80 ? ['🌟','Great work!'] : pct >= 60 ? ['👍','Good effort!'] : ['📖','Keep coding!'];

    document.getElementById('results-emoji').textContent = emoji;
    document.getElementById('results-title').textContent = title;
    document.getElementById('results-score').textContent = `${score} / ${total}  ·  ${pct}%`;

    document.getElementById('results-breakdown').innerHTML = quizState.questions.map((q, i) => {
        const a = quizState.answers[i];
        return `<div class="rb-item ${a.isRight ? 'rb-right' : 'rb-wrong'}">
            <span>${a.isRight ? '✅' : '❌'}</span>
            <div><p class="rb-q">${q.q}</p>${!a.isRight ? `<p class="rb-ans">✓ ${q.opts[a.correct]}</p>` : ''}</div>
        </div>`;
    }).join('');
}

function retryQuiz()        { startQuiz(quizState.langId, quizState.topic.id); }
function backToTopics()     { _showView('home', quizState.langId); }

function _showView(view, langId) {
    const scope = langId ? document.getElementById(langId) : document;
    if (!scope) return;
    scope.querySelector('.practice-home') && (scope.querySelector('.practice-home').style.display = view === 'home'    ? 'block' : 'none');
    scope.querySelector('.quiz-view')     && (scope.querySelector('.quiz-view').style.display     = view === 'quiz'    ? 'block' : 'none');
    scope.querySelector('.results-view')  && (scope.querySelector('.results-view').style.display  = view === 'results' ? 'block' : 'none');
}
