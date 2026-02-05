import { showHint } from './ui.js';

const STORAGE_KEY = 'bigspoon-visited';

export function initIntro(onEnter: () => void): void {
    const overlay = document.getElementById('intro-overlay')!;

    if (localStorage.getItem(STORAGE_KEY)) {
        overlay.classList.add('hidden');
        showHint();
        return;
    }

    const enterBtn = document.getElementById('intro-enter')!;
    const notifyLink = document.getElementById('intro-notify-link')!;
    const emailForm = document.getElementById('intro-email-form')!;
    const emailInput = document.getElementById('intro-email') as HTMLInputElement;
    const emailSubmit = document.getElementById('intro-email-submit') as HTMLButtonElement;

    enterBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, '1');
        overlay.classList.add('fade-out');
        overlay.addEventListener('animationend', () => {
            overlay.classList.add('hidden');
            showHint();
            onEnter();
        }, { once: true });
    });

    notifyLink.addEventListener('click', (e: Event) => {
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

    emailInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') emailSubmit.click();
    });
}
