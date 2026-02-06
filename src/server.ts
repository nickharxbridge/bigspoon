import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SessionSocket extends Socket {
    sessionCode?: string;
}

interface Sessions {
    [key: string]: string[];
}

interface SignalData {
    to: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server);

// Supabase client (optional - only initializes if env vars are set)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

app.use(express.json());

function getCommitHash(): string {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        return '';
    }
}

app.get('/commit-hash', (_req: Request, res: Response) => {
    res.json({ hash: getCommitHash() });
});

// Track intro overlay views
app.post('/api/visit', async (_req: Request, res: Response) => {
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
app.post('/api/subscribe', async (req: Request, res: Response) => {
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
app.get('/api/stats', async (req: Request, res: Response) => {
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

app.get('/rooms', (_req: Request, res: Response) => {
    const roomsDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'rooms');
    try {
        const files = fs.readdirSync(roomsDir);
        const imageFiles = files.filter(file =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        res.json({ rooms: imageFiles });
    } catch {
        res.json({ rooms: [] });
    }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const sessions: Sessions = {};

io.on('connection', (socket: SessionSocket) => {
    console.log('User connected:', socket.id);

    socket.on('join-session', (sessionCode: string) => {
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

    socket.on('offer', ({ to, offer }: SignalData) => {
        socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }: SignalData) => {
        socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }: SignalData) => {
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
