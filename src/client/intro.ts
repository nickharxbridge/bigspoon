import { showHint } from './ui.js';

const STORAGE_KEY = 'bigspoon-visit-count';
const MAX_INTRO_VIEWS = 3;

function trackVisit(): void {
    fetch('/api/visit', { method: 'POST' }).catch(() => {});
}

function getVisitCount(): number {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

export function initIntro(onEnter: () => void): void {
    const overlay = document.getElementById('intro-overlay')!;
    const visitCount = getVisitCount();

    if (visitCount >= MAX_INTRO_VIEWS) {
        overlay.classList.add('hidden');
        showHint();
        return;
    }

    // Track first-time visitor to Supabase
    if (visitCount === 0) {
        trackVisit();
    }

    const enterBtn = document.getElementById('intro-enter')!;
    const notifyLink = document.getElementById('intro-notify-link')!;
    const emailForm = document.getElementById('intro-email-form')!;
    const emailInput = document.getElementById('intro-email') as HTMLInputElement;
    const emailSubmit = document.getElementById('intro-email-submit') as HTMLButtonElement;

    enterBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, String(visitCount + 1));
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

    emailSubmit.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) return;

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
            } else {
                emailSubmit.textContent = 'Error';
                emailInput.disabled = false;
                emailSubmit.disabled = false;
            }
        } catch {
            emailSubmit.textContent = 'Error';
            emailInput.disabled = false;
            emailSubmit.disabled = false;
        }
    });

    emailInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') emailSubmit.click();
    });
}
