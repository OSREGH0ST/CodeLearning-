/* ============================================
   CODELEARNING — SHARED SCRIPT
   ============================================ */

/* ---- Tab switching ---- */
function switchLang(langId) {
    // Hide all tab contents and remove active class from buttons
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.lang-btn').forEach(el => el.classList.remove('active'));
    
    // Show target tab content and set button as active
    const target = document.getElementById(langId);
    if (target) {
        target.classList.add('active');
        // Find the button that corresponds to this langId
        const btn = document.querySelector(`.lang-btn[data-lang="${langId}"]`);
        if (btn) btn.classList.add('active');

        // Reset inner tabs to the first one in the new section
        const firstInner = target.querySelector('.inner-tab-btn');
        if (firstInner) {
            const tabName = firstInner.dataset.tab;
            if (tabName) openInnerTab(tabName, target);
        }
    }
}

function openInnerTab(tabName, scopeEl) {
    const scope = scopeEl || document;
    
    // Find the parent tab-content of the clicked button to limit scope if not provided
    let currentScope = scope;
    if (!scopeEl) {
        const btn = document.querySelector(`.inner-tab-btn[data-tab="${tabName}"]`);
        if (btn) currentScope = btn.closest('.tab-content');
    }

    // Hide all inner tab contents and remove active class from buttons within the scope
    currentScope.querySelectorAll('.inner-tab-content').forEach(el => el.classList.remove('active'));
    currentScope.querySelectorAll('.inner-tab-btn').forEach(el => el.classList.remove('active'));
    
    // Show target inner tab content and set button as active
    const target = currentScope.querySelector(`#${tabName}`);
    if (target) target.classList.add('active');
    
    const activeBtn = currentScope.querySelector(`.inner-tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

/* ---- Mobile menu (if needed in future) ---- */
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup if needed
});
