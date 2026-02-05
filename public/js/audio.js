import { state } from './state.js';
const rainAudio = document.getElementById('rain');
const rainVolumeSlider = document.getElementById('rain-volume');
const speakerVolumeSlider = document.getElementById('speaker-volume');
const micVolumeSlider = document.getElementById('mic-volume');
const rainVolumeLabel = document.getElementById('rain-volume-label');
const speakerVolumeLabel = document.getElementById('speaker-volume-label');
const micVolumeLabel = document.getElementById('mic-volume-label');
function initRainAudio() {
    if (state.rainAudioContext)
        return;
    state.rainAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = state.rainAudioContext.createMediaElementSource(rainAudio);
    state.rainGainNode = state.rainAudioContext.createGain();
    state.rainGainNode.gain.value = Number(rainVolumeSlider.value) / 100;
    source.connect(state.rainGainNode);
    state.rainGainNode.connect(state.rainAudioContext.destination);
}
export function startRain() {
    initRainAudio();
    rainAudio.play();
}
export function getMicVolume() {
    return Number(micVolumeSlider.value) / 100;
}
export function getSpeakerVolume() {
    return Number(speakerVolumeSlider.value) / 100;
}
export function initAudioListeners() {
    rainVolumeSlider.addEventListener('input', () => {
        const volume = Number(rainVolumeSlider.value) / 100;
        if (state.rainGainNode) {
            state.rainGainNode.gain.value = volume;
        }
        rainVolumeLabel.textContent = `${rainVolumeSlider.value}%`;
    });
    speakerVolumeSlider.addEventListener('input', () => {
        const volume = Number(speakerVolumeSlider.value) / 100;
        document.querySelectorAll('#audio-container audio').forEach(audio => {
            audio.volume = volume;
        });
        speakerVolumeLabel.textContent = `${speakerVolumeSlider.value}%`;
    });
    micVolumeSlider.addEventListener('input', () => {
        const volume = Number(micVolumeSlider.value) / 100;
        if (state.micGainNode) {
            state.micGainNode.gain.value = volume;
        }
        micVolumeLabel.textContent = `${micVolumeSlider.value}%`;
    });
}
//# sourceMappingURL=audio.js.map