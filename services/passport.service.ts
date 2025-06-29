import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { pool } from '../config/pool.config';

interface User {
    id: number;
    email: string;
    name: string;
    profile_image: string;
}


passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(new Error('User not found'), null);
        }
    } catch (err) {
        done(err, null);
    }
});



const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const serverRootUri = process.env.SERVER_ROOT_URI;
console.log(serverRootUri,"SERVER_ROOT_URI")
if (!googleClientId || !googleClientSecret || !serverRootUri) {
    throw new Error("Missing Google OAuth or Server URI environment variables. Please check your .env file.");
}

passport.use(
    new GoogleStrategy(
        {
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: `${serverRootUri}/api/v1/auth/google/callback`,
            scope: ['profile', 'email'],
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done) => {
            const userEmail = (profile.emails as any)?.[0].value;
            if (!userEmail) {
                return done(new Error("No email found in Google profile"), undefined);
            }

            try {
                // Check if the user already exists in our database
                const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);

                if (existingUserResult.rows.length > 0) {
                    // User exists, pass the existing user to the next step
                    const existingUser: User = existingUserResult.rows[0];
                    console.log('Existing user found:', existingUser);
                    return done(null, existingUser);
                } else {
                    // User doesn't exist, create a new user in our database
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
