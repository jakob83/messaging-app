const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
const prisma = require('./prismaClient');

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (jwt_payload, done) => {
      // Extract user ID from the JWT payload
      const userId = jwt_payload.id;
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return done(null, false);
        }

        // Sanitize the user object to exclude sensitive fields
        const { password, ...sanitizedUser } = user;

        return done(null, sanitizedUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
