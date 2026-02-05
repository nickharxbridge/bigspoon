import { initUI } from './ui.js';
import { initAudioListeners, startRain } from './audio.js';
import { initSocketHandlers } from './socket-client.js';
import { loadRooms } from './rooms.js';
import { initIntro } from './intro.js';
// Fetch and display commit hash — hide if unavailable
const commitEl = document.getElementById('commit-hash');
fetch('/commit-hash')
    .then(res => res.json())
    .then(data => {
    commitEl.textContent = data.hash;
})
    .catch(() => {
    commitEl.style.display = 'none';
});
// Initialize all modules
initUI();
initAudioListeners();
initSocketHandlers();
loadRooms();
// Show intro on first visit; start rain when user enters or on first click
initIntro(() => startRain());
document.body.addEventListener('click', () => startRain(), { once: true });
//# sourceMappingURL=main.js.map