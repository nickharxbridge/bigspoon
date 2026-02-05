import { state, peers } from './state.js';

const roomSelector = document.getElementById('room-selector')!;
const backgroundLayer = document.getElementById('background-layer')!;

export async function loadRooms(): Promise<void> {
    try {
        const response = await fetch('/rooms');
        const data = await response.json();
        const rooms: string[] = data.rooms;

        roomSelector.innerHTML = '';
        rooms.forEach((room, index) => {
            const img = document.createElement('img');
            img.className = 'room-thumbnail' + (index === 0 ? ' selected' : '');
            img.src = `assets/images/rooms/${room}`;
            img.dataset.room = room;
            img.alt = room.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

            img.addEventListener('click', () => {
                document.querySelectorAll('.room-thumbnail').forEach(t => t.classList.remove('selected'));
                img.classList.add('selected');
                state.currentRoom = img.dataset.room!;
                updateBackground();
            });

            roomSelector.appendChild(img);
        });

        if (rooms.length > 0) {
            state.currentRoom = rooms[0];
            updateBackground();
        }
    } catch (err) {
        console.error('Failed to load rooms:', err);
    }
}

export function updateBackground(): void {
    const count = Object.keys(peers).length;
    const totalUsers = count + 1;
    const overlayImage = totalUsers >= 2 ? 'assets/images/full.png' : 'assets/images/empty.png';
    backgroundLayer.style.backgroundImage = `url('${overlayImage}'), url('assets/images/rooms/${state.currentRoom}')`;
}
