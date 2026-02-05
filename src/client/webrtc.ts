import { state, peers, dataChannels } from './state.js';
import { getSocket } from './socket-client.js';
import { updateBackground } from './rooms.js';
import { getMicVolume, getSpeakerVolume } from './audio.js';
import { showJoinForm, hideJoinForm, showSessionInfo, hideSessionInfo } from './ui.js';

const audioContainer = document.getElementById('audio-container')!;
const sessionCodeInput = document.getElementById('session-code') as HTMLInputElement;
const statusEl = document.getElementById('status')!;
const userCountEl = document.getElementById('user-count')!;

function setupDataChannel(dc: RTCDataChannel, peerId: string): void {
    dataChannels[peerId] = dc;

    dc.onmessage = (event: MessageEvent) => {
        try {
            JSON.parse(event.data);
            // Handle incoming data channel messages here if needed
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };

    dc.onclose = () => {
        delete dataChannels[peerId];
    };
}

export async function joinSession(): Promise<void> {
    const code = sessionCodeInput.value.trim().toUpperCase();
    if (!code) {
        statusEl.textContent = 'Please enter a shared phrase';
        return;
    }

    try {
        const rawStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = state.audioContext.createMediaStreamSource(rawStream);
        state.micGainNode = state.audioContext.createGain();
        state.micGainNode.gain.value = getMicVolume();
        const destination = state.audioContext.createMediaStreamDestination();
        source.connect(state.micGainNode);
        state.micGainNode.connect(destination);

        state.localStream = destination.stream;
        getSocket().emit('join-session', code);

        hideJoinForm();
        showSessionInfo(code);
    } catch (err) {
        statusEl.textContent = 'Microphone access denied';
        console.error('Error accessing microphone:', err);
    }
}

export function leaveSession(): void {
    Object.values(peers).forEach(pc => pc.close());
    Object.keys(peers).forEach(id => delete peers[id]);

    Object.values(dataChannels).forEach(dc => dc.close());
    Object.keys(dataChannels).forEach(id => delete dataChannels[id]);

    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
    }

    if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
        state.micGainNode = null;
    }

    audioContainer.innerHTML = '';

    const socket = getSocket();
    socket.disconnect();
    socket.connect();

    hideSessionInfo();
    if (state.sessionUIVisible) {
        showJoinForm();
    }
    sessionCodeInput.value = '';
    statusEl.textContent = 'Enter a shared phrase to connect';

    updateBackground();
}

export function updateUserCount(): void {
    const count = Object.keys(peers).length;
    userCountEl.textContent = `${count} bedfellow${count !== 1 ? 's' : ''}`;
    updateBackground();
}

export async function createPeerConnection(userId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    peers[userId] = pc;

    if (isInitiator) {
        const dc = pc.createDataChannel('chat');
        setupDataChannel(dc, userId);
    }

    pc.ondatachannel = (event: RTCDataChannelEvent) => {
        setupDataChannel(event.channel, userId);
    };

    state.localStream!.getTracks().forEach(track => {
        pc.addTrack(track, state.localStream!);
    });

    pc.ontrack = (event: RTCTrackEvent) => {
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.id = `audio-${userId}`;
        audio.volume = getSpeakerVolume();
        audioContainer.appendChild(audio);
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            getSocket().emit('ice-candidate', { to: userId, candidate: event.candidate });
        }
    };

    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            removePeer(userId);
        }
    };

    if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit('offer', { to: userId, offer });
    }

    updateUserCount();
    return pc;
}

export function removePeer(userId: string): void {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
    }
    if (dataChannels[userId]) {
        dataChannels[userId].close();
        delete dataChannels[userId];
    }
    const audio = document.getElementById(`audio-${userId}`);
    if (audio) audio.remove();
    updateUserCount();
}
