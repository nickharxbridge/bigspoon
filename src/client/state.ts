interface AppState {
    localStream: MediaStream | null;
    sessionUIVisible: boolean;
    isFlipped: boolean;
    roomSelectorVisible: boolean;
    audioSettingsVisible: boolean;
    currentRoom: string | null;
    micGainNode: GainNode | null;
    audioContext: AudioContext | null;
    rainGainNode: GainNode | null;
    rainAudioContext: AudioContext | null;
}

export const peers: Record<string, RTCPeerConnection> = {};
export const dataChannels: Record<string, RTCDataChannel> = {};

export const state: AppState = {
    localStream: null,
    sessionUIVisible: false,
    isFlipped: false,
    roomSelectorVisible: false,
    audioSettingsVisible: false,
    currentRoom: null,
    micGainNode: null,
    audioContext: null,
    rainGainNode: null,
    rainAudioContext: null,
};
