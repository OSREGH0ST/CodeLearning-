// script.js
document.addEventListener('DOMContentLoaded', () => {
// Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Practice Arena Logic
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePractice);
    }

    const menuToggle = document.getElementById('menuToggle');
    const navTabs = document.getElementById('navTabs');

    // Mobile Navigation Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navTabs.classList.toggle('active');
        });
    }

    // Module Completion Tracker
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const path = card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (path && localStorage.getItem(`completed_${path}`)) {
            card.style.borderLeft = '4px solid #10b981'; // Green for finished
        }
    });
});

// Function to call when a user finishes a page
function markComplete(pageName) {
    localStorage.setItem(`completed_${pageName}`, 'true');
}


async function generatePractice() {
    const subject = document.getElementById('subject-select').value;
    const difficulty = document.getElementById('difficulty-slider').value;
    const outputDiv = document.getElementById('arena-output');

    // Map slider value to text representation
    const diffMap = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
    const diffText = diffMap[difficulty];

    outputDiv.textContent = `Establishing connection to proxy...\nRequesting ${diffText} challenge for ${subject}...`;
    generateBtn.disabled = true;

    try {
        // Replace with your actual deployed Cloudflare Worker URL
        const workerUrl = 'https://codelearning.owensanrios.workers.dev'; 
        
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject, difficulty: diffText })
        });

        if (!response.ok) throw new Error(`Proxy responded with status: ${response.status}`);
        
        const data = await response.json();
        
        // Render the JSON payload safely
        outputDiv.innerHTML = formatChallenge(data);

    } catch (error) {
        outputDiv.textContent = `[ERR] Generation failed: ${error.message}\nEnsure the Cloudflare Worker is running and CORS is configured.`;
    } finally {
        generateBtn.disabled = false;
    }
}

// Basic parser to turn JSON into readable HTML (to avoid raw Markdown/JSON rendering issues)
function formatChallenge(data) {
    if (!data || !data.question) return "Invalid payload received.";
    
    let html = `<h3>${data.title || 'Challenge'}</h3>`;
    html += `<p><strong>Task:</strong> ${data.question}</p>`;
    
    if (data.requirements && data.requirements.length > 0) {
        html += `<ul>`;
        data.requirements.forEach(req => html += `<li>${req}</li>`);
        html += `</ul>`;
    }
    
    return html;
}