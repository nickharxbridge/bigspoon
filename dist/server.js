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
const supabase_js_1 = require("@supabase/supabase-js");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// Supabase client (optional - only initializes if env vars are set)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey)
    : null;
app.use(express_1.default.json());
function getCommitHash() {
    try {
        return (0, child_process_1.execSync)('git rev-parse --short HEAD').toString().trim();
    }
    catch {
        return '';
    }
}
app.get('/commit-hash', (_req, res) => {
    res.json({ hash: getCommitHash() });
});
// Track intro overlay views
app.post('/api/visit', async (_req, res) => {
    if (!supabase) {
        res.status(503).json({ error: 'Supabase not configured' });
        return;
    }
    const { error } = await supabase
        .from('visits')
        .insert({ visited_at: new Date().toISOString() });
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json({ ok: true });
});
// Record email signup
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email required' });
        return;
    }
    if (!supabase) {
        res.status(503).json({ error: 'Supabase not configured' });
        return;
    }
    const { error } = await supabase
        .from('signups')
        .insert({ email: email.trim().toLowerCase() });
    if (error) {
        // Duplicate email (unique constraint) is not an error for the user
        if (error.code === '23505') {
            res.json({ ok: true, duplicate: true });
            return;
        }
        res.status(500).json({ error: error.message });
        return;
    }
    res.json({ ok: true });
});
// Get stats (protected by simple secret)
app.get('/api/stats', async (req, res) => {
    const secret = process.env.STATS_SECRET;
    if (!secret || req.query.secret !== secret) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (!supabase) {
        res.status(503).json({ error: 'Supabase not configured' });
        return;
    }
    const [visits, signups] = await Promise.all([
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('signups').select('*', { count: 'exact', head: true })
    ]);
    const visitCount = visits.count ?? 0;
    const signupCount = signups.count ?? 0;
    res.json({
        visits: visitCount,
        signups: signupCount,
        ratio: visitCount > 0 ? (signupCount / visitCount).toFixed(3) : 0
    });
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