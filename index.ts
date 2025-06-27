import express, { type Application, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import translateRoutes from './routes/translate.routes'
import keysRoutes from './routes/keys.routes'
import userRoutes from './routes/user.routes'
import './services/passport.service'; // Passport configuration

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Enable CORS for the frontend application
app.use(
  cors({
    origin: process.env.UI_ROOT_URI || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
  })
);

// To parse cookies
app.use(cookieParser());

// To parse JSON bodies
app.use(express.json());

// Express session middleware
// This is required for Passport's OAuth flow to work.
app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
    },
  })
);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());


// --- Routes ---

app.get('/', (req: Request, res: Response) => {
    res.send('Server is running and ready to authenticate!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/translate', translateRoutes);
app.use('/api/v1/keys', keysRoutes);
app.use('/api/v1/user',userRoutes)


// --- Server Initialization ---

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('Auth routes are available at /api/v1/auth');
});
