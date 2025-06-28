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

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(
  cors({
    origin: [
      'https://polygot-react.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true, // Allow cookies to be sent
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());



app.get('/', (req: Request, res: Response) => {
    res.send('Server is running and ready to authenticate!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/translate', translateRoutes);
app.use('/api/v1/keys', keysRoutes);
app.use('/api/v1/user',userRoutes)



app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('Auth routes are available at /api/v1/auth');
});
