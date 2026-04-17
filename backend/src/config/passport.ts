import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';

import { adminEmails, env, isGoogleAuthConfigured } from './env';
import { User } from '../models/User';

const resolveCompanyName = (profile: Profile, email: string) => {
  const hostedDomain = typeof profile._json.hd === 'string' ? profile._json.hd : undefined;
  if (hostedDomain) {
    return hostedDomain.replace(/\..*$/, '').replace(/[-_]/g, ' ');
  }

  return email.split('@')[0].replace(/[._-]/g, ' ');
};

export const configurePassport = () => {
  if (!isGoogleAuthConfigured) {
    return passport;
  }

  const strategy = new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error('Google account did not provide an email address.'));
        }

        const displayName = profile.displayName || email;
        const avatar = profile.photos?.[0]?.value;
        const companyName = resolveCompanyName(profile, email);

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            name: displayName,
            avatar,
            companyName,
            role: adminEmails.includes(email) ? 'admin' : 'user',
          });
        } else {
          user.email = email;
          user.name = displayName;
          user.avatar = avatar;
          user.companyName = user.companyName || companyName;
          user.role = adminEmails.includes(email) ? 'admin' : user.role;
          await user.save();
        }

        return done(null, user as unknown as Express.User);
      } catch (error) {
        return done(error as Error);
      }
    },
  );

  passport.use(strategy);
  return passport;
};