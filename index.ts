import express, { type Application, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import translateRoutes from './routes/translate.routes'
import keysRoutes from './routes/keys.routes'
import userRoutes from './routes/user.routes'
import './services/passport.service'; // Passport configuration
import { Pool } from 'pg';
import { connectRedis } from './config/redis.config';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(
  cors({
     origin: (origin, callback) => {
      callback(null, origin); // Allow all origins
    },
    credentials: true, // Allow cookies to be sent
  })
);

app.use(cookieParser());

app.use(express.json());

connectRedis();

const pgPool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const PgSession = pgSession(session);


app.use(
  session({
    store: new PgSession({
      pool: pgPool,              // 🔁 Use your existing DB
      tableName: 'user_sessions' // or anything you like
    }),
    secret: process.env.COOKIE_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
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

console.log('COOKIE_SECRET is:', process.env.COOKIE_SECRET);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('Auth routes are available at /api/v1/auth');
});
