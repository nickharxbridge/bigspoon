import { state } from './state.js';

const rainAudio = document.getElementById('rain') as HTMLAudioElement;
const rainVolumeSlider = document.getElementById('rain-volume') as HTMLInputElement;
const speakerVolumeSlider = document.getElementById('speaker-volume') as HTMLInputElement;
const micVolumeSlider = document.getElementById('mic-volume') as HTMLInputElement;
const rainVolumeLabel = document.getElementById('rain-volume-label')!;
const speakerVolumeLabel = document.getElementById('speaker-volume-label')!;
const micVolumeLabel = document.getElementById('mic-volume-label')!;

function initRainAudio(): void {
    if (state.rainAudioContext) return;
    state.rainAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = state.rainAudioContext.createMediaElementSource(rainAudio);
    state.rainGainNode = state.rainAudioContext.createGain();
    state.rainGainNode.gain.value = Number(rainVolumeSlider.value) / 100;
    source.connect(state.rainGainNode);
    state.rainGainNode.connect(state.rainAudioContext.destination);
}

export function startRain(): void {
    initRainAudio();
    rainAudio.play();
}

export function getMicVolume(): number {
    return Number(micVolumeSlider.value) / 100;
}

export function getSpeakerVolume(): number {
    return Number(speakerVolumeSlider.value) / 100;
}

export function initAudioListeners(): void {
    rainVolumeSlider.addEventListener('input', () => {
        const volume = Number(rainVolumeSlider.value) / 100;
        if (state.rainGainNode) {
            state.rainGainNode.gain.value = volume;
        }
        rainVolumeLabel.textContent = `${rainVolumeSlider.value}%`;
    });

    speakerVolumeSlider.addEventListener('input', () => {
        const volume = Number(speakerVolumeSlider.value) / 100;
        document.querySelectorAll<HTMLAudioElement>('#audio-container audio').forEach(audio => {
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
