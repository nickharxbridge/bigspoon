"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
function getCommitHash() {
    try {
        return (0, child_process_1.execSync)('git rev-parse --short HEAD').toString().trim();
    }
    catch {
        return 'unknown';
    }
}
app.get('/commit-hash', (_req, res) => {
    res.json({ hash: getCommitHash() });
});
app.get('/rooms', (_req, res) => {
    const roomsDir = path_1.default.join(__dirname, '..', 'public', 'assets', 'images', 'rooms');
    try {
        const files = fs_1.default.readdirSync(roomsDir);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        res.json({ rooms: imageFiles });
    }
    catch {
        res.json({ rooms: [] });
    }
});
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
const sessions = {};
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-session', (sessionCode) => {
        if (!sessions[sessionCode]) {
            sessions[sessionCode] = [];
        }
        // Limit sessions to 2 users
        if (sessions[sessionCode].length >= 2) {
            socket.emit('session-full');
            return;
        }
        socket.join(sessionCode);
        sessions[sessionCode].push(socket.id);
        // Notify others in the session
        socket.to(sessionCode).emit('user-joined', socket.id);
        // Send list of existing users to the new user
        const otherUsers = sessions[sessionCode].filter(id => id !== socket.id);
        socket.emit('existing-users', otherUsers);
        socket.sessionCode = sessionCode;
        console.log(`User ${socket.id} joined session: ${sessionCode}`);
    });
    socket.on('offer', ({ to, offer }) => {
        socket.to(to).emit('offer', { from: socket.id, offer });
    });
    socket.on('answer', ({ to, answer }) => {
        socket.to(to).emit('answer', { from: socket.id, answer });
    });
    socket.on('ice-candidate', ({ to, candidate }) => {
        socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });
    socket.on('disconnect', () => {
        if (socket.sessionCode && sessions[socket.sessionCode]) {
            sessions[socket.sessionCode] = sessions[socket.sessionCode].filter(id => id !== socket.id);
            socket.to(socket.sessionCode).emit('user-left', socket.id);
            if (sessions[socket.sessionCode].length === 0) {
                delete sessions[socket.sessionCode];
            }
        }
        console.log('User disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map