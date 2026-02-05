import { state, peers } from './state.js';
import { createPeerConnection, removePeer } from './webrtc.js';
import { showJoinForm, hideSessionInfo } from './ui.js';
const socket = io();
export function getSocket() {
    return socket;
}
export function initSocketHandlers() {
    socket.on('existing-users', async (users) => {
        for (const userId of users) {
            await createPeerConnection(userId, true);
        }
    });
    socket.on('user-joined', async (userId) => {
        await createPeerConnection(userId, false);
    });
    socket.on('offer', async ({ from, offer }) => {
        let pc = peers[from];
        if (!pc) {
            pc = await createPeerConnection(from, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
    });
    socket.on('answer', async ({ from, answer }) => {
        const pc = peers[from];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });
    socket.on('ice-candidate', async ({ from, candidate }) => {
        const pc = peers[from];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
    socket.on('user-left', (userId) => {
        removePeer(userId);
    });
    socket.on('session-full', () => {
        document.getElementById('status').textContent = 'Session is full (max 2 users)';
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
            state.localStream = null;
        }
        if (state.sessionUIVisible) {
            showJoinForm();
        }
        hideSessionInfo();
    });
}
//# sourceMappingURL=socket-client.js.map