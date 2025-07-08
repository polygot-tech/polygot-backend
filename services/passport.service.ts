import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { pool } from '../config/pool.config';

interface User {
    id: number;
    email: string;
    name: string;
    profile_image: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable. Please check your .env file.");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const serverRootUri = process.env.SERVER_ROOT_URI;

if (!googleClientId || !googleClientSecret || !serverRootUri) {
    throw new Error("Missing Google OAuth or Server URI environment variables. Please check your .env file.");
}

// JWT Strategy for protecting routes
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        },
        async (jwtPayload, done) => {
            try {
                const result = await pool.query('SELECT * FROM users WHERE id = $1', [jwtPayload.id]);
                if (result.rows.length > 0) {
                    return done(null, result.rows[0]);
                } else {
                    return done(null, false); // Or create a new user account
                }
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Google OAuth Strategy for initial login/registration
passport.use(
    new GoogleStrategy(
        {
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: `${serverRootUri}/api/v1/auth/google/callback`,
            // scope remains the same
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done) => {
            const userEmail = (profile.emails as any)?.[0].value;
            if (!userEmail) {
                return done(new Error("No email found in Google profile"), undefined);
            }

            try {
                // Check if the user already exists (this logic remains the same)
                const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);

                if (existingUserResult.rows.length > 0) {
                    const existingUser: User = existingUserResult.rows[0];
                    console.log('Existing user found:', existingUser);
                    return done(null, existingUser);
                } else {
                    // Create a new user (this logic remains the same)
                    const userName = profile.displayName;
                    const userProfileImage = (profile.photos as any)?.[0].value;

                    const newUserResult = await pool.query(
                        'INSERT INTO users (email, name, profile_image) VALUES ($1, $2, $3) RETURNING *',
                        [userEmail, userName, userProfileImage]
                    );

                    const newUser: User = newUserResult.rows[0];
                    console.log('New user created:', newUser);
                    return done(null, newUser);
                }
            } catch (err) {
                console.error("Database error during Google auth:", err);
                return done(err, undefined);
            }
        }
    )
);