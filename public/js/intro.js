import { showHint } from './ui.js';
const STORAGE_KEY = 'bigspoon-visited';
function trackVisit() {
    fetch('/api/visit', { method: 'POST' }).catch(() => { });
}
export function initIntro(onEnter) {
    const overlay = document.getElementById('intro-overlay');
    if (localStorage.getItem(STORAGE_KEY)) {
        overlay.classList.add('hidden');
        showHint();
        return;
    }
    // Track first-time visitor
    trackVisit();
    const enterBtn = document.getElementById('intro-enter');
    const notifyLink = document.getElementById('intro-notify-link');
    const emailForm = document.getElementById('intro-email-form');
    const emailInput = document.getElementById('intro-email');
    const emailSubmit = document.getElementById('intro-email-submit');
    enterBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, '1');
        overlay.classList.add('fade-out');
        overlay.addEventListener('animationend', () => {
            overlay.classList.add('hidden');
            showHint();
            onEnter();
        }, { once: true });
    });
    notifyLink.addEventListener('click', (e) => {
        e.preventDefault();
        emailForm.classList.remove('hidden');
        notifyLink.style.display = 'none';
        emailInput.focus();
    });
    emailSubmit.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email)
            return;
        emailSubmit.disabled = true;
        emailInput.disabled = true;
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                emailSubmit.textContent = 'Thanks!';
            }
            else {
                emailSubmit.textContent = 'Error';
                emailInput.disabled = false;
                emailSubmit.disabled = false;
            }
        }
        catch {
            emailSubmit.textContent = 'Error';
            emailInput.disabled = false;
            emailSubmit.disabled = false;
        }
    });
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter')
            emailSubmit.click();
    });
}
//# sourceMappingURL=intro.js.map