import { initUI } from './ui.js';
import { initAudioListeners, startRain } from './audio.js';
import { initSocketHandlers } from './socket-client.js';
import { loadRooms } from './rooms.js';

// Fetch and display commit hash
fetch('/commit-hash')
    .then(res => res.json())
    .then(data => {
        document.getElementById('commit-hash')!.textContent = data.hash;
    })
    .catch(() => {
        document.getElementById('commit-hash')!.textContent = 'unknown';
    });

// Initialize all modules
initUI();
initAudioListeners();
initSocketHandlers();
loadRooms();

// Start rain audio on first user interaction
document.body.addEventListener('click', function () {
    startRain();
}, { once: true });
