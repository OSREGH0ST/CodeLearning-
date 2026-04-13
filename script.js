/* ============================================
   CODELEARNING — SHARED BEHAVIOR & API
   ============================================ */

const PROXY_URL = 'https://codelearning.owensanrios.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar & Mobile Navigation ---
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const navTabs = document.querySelector('.lang-nav');
    if (menuToggle && navTabs) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navTabs.classList.toggle('active');
        });
    }

    // --- Module Completion Tracker ---
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // Extract the path/module name from the onclick attribute or dataset
        const path = card.dataset.module || card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (path && localStorage.getItem(`completed_${path}`)) {
            card.style.borderLeft = '4px solid var(--mobile-green, #10b981)';
            card.classList.add('is-completed');
        }
    });

    // --- Practice Arena Initialization ---
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePractice);
    }
});

/* ============================================
   UI TAB SWITCHING
   ============================================ */

function switchLang(langId) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.lang-btn');
    const targetContent = document.getElementById(langId);
    
    if (!targetContent) return;

    contents.forEach(el => el.classList.remove('active'));
    buttons.forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
    });
    
    targetContent.classList.add('active');
    
    const targetBtn = document.querySelector(`.lang-btn[data-lang="${langId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-selected', 'true');
    }

    // Reset inner tabs to the first one in the new section
    const firstInner = targetContent.querySelector('.inner-tab-btn');
    if (firstInner && firstInner.dataset.tab) {
        openInnerTab(firstInner.dataset.tab, targetContent);
    }
}

function openInnerTab(tabName, scopeEl = null) {
    let scope = scopeEl;
    if (!scope) {
        const btn = document.querySelector(`.inner-tab-btn[data-tab="${tabName}"]`);
        scope = btn ? btn.closest('.tab-content') : document;
    }

    if (!scope) return;

    scope.querySelectorAll('.inner-tab-content').forEach(el => el.classList.remove('active'));
    scope.querySelectorAll('.inner-tab-btn').forEach(el => el.classList.remove('active'));
    
    const targetContent = scope.querySelector(`#${tabName}`);
    if (targetContent) targetContent.classList.add('active');
    
    const targetBtn = scope.querySelector(`.inner-tab-btn[data-tab="${tabName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
}

/* ============================================
   PROGRESS TRACKING
   ============================================ */

function markComplete(pageName) {
    localStorage.setItem(`completed_${pageName}`, 'true');
    // Visually update immediately if the element exists
    const targetCard = document.querySelector(`[data-module="${pageName}"]`);
    if (targetCard) {
        targetCard.style.borderLeft = '4px solid var(--mobile-green, #10b981)';
    }
}

/* ============================================
   PRACTICE ARENA (GEMINI API VIA WORKER)
   ============================================ */

async function generatePractice() {
    const subjectEl = document.getElementById('subject-select');
    const diffEl = document.getElementById('difficulty-slider');
    const outputDiv = document.getElementById('arena-output');
    const generateBtn = document.getElementById('generate-btn');

    if (!subjectEl || !diffEl || !outputDiv) return;

    const subject = subjectEl.value;
    const difficulty = diffEl.value;
    
    const diffMap = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
    const diffText = diffMap[difficulty] || "Intermediate";

    outputDiv.innerHTML = `<span style="color: var(--text-dim);">Establishing connection to proxy...<br>Requesting ${diffText} challenge for ${subject}...</span>`;
    generateBtn.disabled = true;

    // Define the prompt with strict JSON enforcement mirroring Study Hub
    const promptText = `You are a senior software engineer mentoring a junior. Generate a coding challenge for the topic: ${subject} at a ${diffText} difficulty level.
    
    You MUST return STRICT JSON using this format. Do not add markdown backticks outside the JSON.
    {
        "title": "Challenge Title",
        "question": "Detailed task description and scenario.",
        "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]
    }`;

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Format payload to match Gemini's API expectation so the proxy can just pass it through
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    responseMimeType: "application/json" // Forces valid JSON output
                }
            })
        });

        if (!response.ok) throw new Error(`Proxy responded with status: ${response.status}`);
        
        const data = await response.json();
        
        // Safely extract the text from the Gemini response structure
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawJsonText) {
            throw new Error("Malformed response from the LLM proxy.");
        }

        const parsedData = JSON.parse(rawJsonText);
        outputDiv.innerHTML = formatChallenge(parsedData);

    } catch (error) {
        console.error('[Practice Arena Error]', error);
        outputDiv.innerHTML = `<span style="color: #ef4444;">[ERR] Generation failed: ${error.message}<br>Ensure the Cloudflare Worker is running and securely passing the payload to Gemini.</span>`;
    } finally {
        generateBtn.disabled = false;
    }
}

// Safely formats the parsed JSON into the DOM
function formatChallenge(data) {
    if (!data || !data.question) return "<span style='color: #ef4444;'>Invalid payload received from AI.</span>";
    
    let html = `<h3 style="color: var(--accent); margin-bottom: 0.5rem; font-family: var(--font-serif); font-size: 1.25rem;">${data.title || 'Coding Challenge'}</h3>`;
    html += `<p style="margin-bottom: 1rem; color: var(--text-main); font-size: 0.95rem;"><strong>Task:</strong> ${data.question}</p>`;
    
    if (data.requirements && Array.isArray(data.requirements)) {
        html += `<h4 style="margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim);">Requirements</h4>`;
        html += `<ul class="styled-list" style="margin-top: 0;">`;
        data.requirements.forEach(req => {
            // Basic sanitization replacing < and > to prevent XSS if AI outputs raw HTML
            const safeReq = req.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            html += `<li>${safeReq}</li>`;
        });
        html += `</ul>`;
    }
    
    return html;
}