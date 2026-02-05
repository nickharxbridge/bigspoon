import { showHint } from './ui.js';
const STORAGE_KEY = 'bigspoon-visited';
export function initIntro(onEnter) {
    const overlay = document.getElementById('intro-overlay');
    if (localStorage.getItem(STORAGE_KEY)) {
        overlay.classList.add('hidden');
        showHint();
        return;
    }
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
    emailSubmit.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (email) {
            emailSubmit.textContent = 'Thanks!';
            emailInput.disabled = true;
            emailSubmit.disabled = true;
        }
    });
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter')
            emailSubmit.click();
    });
}
//# sourceMappingURL=intro.js.map