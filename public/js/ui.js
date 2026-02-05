import { state } from './state.js';
import { joinSession, leaveSession } from './webrtc.js';
const joinForm = document.getElementById('join-form');
const sessionInfo = document.getElementById('session-info');
const sessionCodeInput = document.getElementById('session-code');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsOptions = document.getElementById('settings-options');
const sessionToggle = document.getElementById('setting-1');
const roomToggle = document.getElementById('setting-2');
const roomSelector = document.getElementById('room-selector');
const audioToggle = document.getElementById('setting-3');
const audioSettings = document.getElementById('audio-settings');
const flipToggle = document.getElementById('setting-4');
const backgroundLayer = document.getElementById('background-layer');
export function showHint() {
    const hint = document.getElementById('hint');
    const hintArrow = document.getElementById('hint-arrow');
    hint.classList.remove('hidden');
    hintArrow.classList.remove('hidden');
    setTimeout(() => {
        hint.classList.add('hidden');
        hintArrow.classList.add('hidden');
    }, 15000);
}
export function initUI() {
    // Settings toggle
    settingsToggle.addEventListener('click', () => {
        settingsOptions.classList.toggle('open');
        state.sessionUIVisible = false;
        state.roomSelectorVisible = false;
        state.audioSettingsVisible = false;
        joinForm.classList.add('hidden');
        sessionInfo.classList.add('hidden');
        roomSelector.classList.add('hidden');
        audioSettings.classList.add('hidden');
    });
    // Session toggle (bed button)
    sessionToggle.addEventListener('click', () => {
        state.sessionUIVisible = !state.sessionUIVisible;
        state.roomSelectorVisible = false;
        state.audioSettingsVisible = false;
        roomSelector.classList.add('hidden');
        audioSettings.classList.add('hidden');
        if (state.sessionUIVisible) {
            if (state.localStream) {
                sessionInfo.classList.remove('hidden');
            }
            else {
                joinForm.classList.remove('hidden');
            }
        }
        else {
            joinForm.classList.add('hidden');
            sessionInfo.classList.add('hidden');
        }
    });
    // Room toggle (house button)
    roomToggle.addEventListener('click', () => {
        state.roomSelectorVisible = !state.roomSelectorVisible;
        state.sessionUIVisible = false;
        state.audioSettingsVisible = false;
        joinForm.classList.add('hidden');
        sessionInfo.classList.add('hidden');
        audioSettings.classList.add('hidden');
        if (state.roomSelectorVisible) {
            roomSelector.classList.remove('hidden');
        }
        else {
            roomSelector.classList.add('hidden');
        }
    });
    // Audio toggle (speaker button)
    audioToggle.addEventListener('click', () => {
        state.audioSettingsVisible = !state.audioSettingsVisible;
        state.sessionUIVisible = false;
        state.roomSelectorVisible = false;
        joinForm.classList.add('hidden');
        sessionInfo.classList.add('hidden');
        roomSelector.classList.add('hidden');
        if (state.audioSettingsVisible) {
            audioSettings.classList.remove('hidden');
        }
        else {
            audioSettings.classList.add('hidden');
        }
    });
    // Flip toggle (switch sides button)
    flipToggle.addEventListener('click', () => {
        state.isFlipped = !state.isFlipped;
        backgroundLayer.classList.toggle('flipped', state.isFlipped);
    });
    // Join / Leave wiring
    joinBtn.addEventListener('click', joinSession);
    sessionCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter')
            joinSession();
    });
    leaveBtn.addEventListener('click', leaveSession);
}
export function showJoinForm() {
    joinForm.classList.remove('hidden');
}
export function hideJoinForm() {
    joinForm.classList.add('hidden');
}
export function showSessionInfo(code) {
    const currentSession = document.getElementById('current-session');
    currentSession.textContent = code;
    if (state.sessionUIVisible) {
        sessionInfo.classList.remove('hidden');
    }
}
export function hideSessionInfo() {
    sessionInfo.classList.add('hidden');
}
//# sourceMappingURL=ui.js.map