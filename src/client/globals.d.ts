import type { Socket } from 'socket.io-client';

declare global {
    function io(): Socket;

    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}
