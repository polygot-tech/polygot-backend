import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { pool } from "../config/pool.config";
import { PAYMENT_QUERY } from "../controllers/modules/payment";
import { plansConfig } from "../controllers/payments.controller";

export interface User {
  id: number;
  email: string;
  name: string;
  client_id: string;
  profile_image: string;
  subscription?: Subscription;
}
export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  translation_usage: number;
  remaining_usage: number;
  created_at: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    "Missing JWT_SECRET environment variable. Please check your .env file."
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const serverRootUri = process.env.SERVER_ROOT_URI;

if (!googleClientId || !googleClientSecret || !serverRootUri) {
  throw new Error(
    "Missing Google OAuth or Server URI environment variables. Please check your .env file."
  );
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
        console.log("jwt check", jwtPayload);
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          jwtPayload.id,
        ]);
        const user: User = result.rows[0];
        const subscription = await pool.query(
          "SELECT * FROM subscriptions WHERE client_id = $1 AND status = $2 ORDER BY current_period_end ",
          [user.client_id, "active"]
        );
        if (subscription.rows.length > 0) {
          user.subscription = subscription.rows[0];
          if (user.subscription) {
            const plan = await pool.query(
              "SELECT * FROM plans WHERE id = $1 ",
              [user.subscription.plan_id]
            );
            const remaining_usage =
              plan.rows.at(0)?.translation_limit -
              user.subscription.translation_usage;
            user.subscription.remaining_usage = remaining_usage;
          }
        }
        if (result.rows.length > 0) {
          return done(null, user);
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
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done
    ) => {
      const userEmail = (profile.emails as any)?.[0].value;
      if (!userEmail) {
        return done(new Error("No email found in Google profile"), undefined);
      }

      try {
        // Check if the user already exists (this logic remains the same)
        const existingUserResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [userEmail]
        );

        if (existingUserResult.rows.length > 0) {
          const existingUser: User = existingUserResult.rows[0];
          console.log("Existing user found:", existingUser);
          return done(null, existingUser);
        } else {
          // Create a new user (this logic remains the same)
          const userName = profile.displayName;
          const userProfileImage = (profile.photos as any)?.[0].value;

          const newUserResult = await pool.query(
            "INSERT INTO users (email, name, profile_image) VALUES ($1, $2, $3) RETURNING *",
            [userEmail, userName, userProfileImage]
          );

          const newUser: User = newUserResult.rows[0];
          const subscription = await PAYMENT_QUERY.apply_subscription(
            newUser.client_id,
            plansConfig["FREE"].db_p_id,
            "polygot",
            "active",
            new Date()
          );
          console.log("New user created:", newUser);
          return done(null, newUser);
        }
      } catch (err) {
        console.error("Database error during Google auth:", err);
        return done(err, undefined);
      }
    }
  )
);
