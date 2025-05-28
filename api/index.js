const express = require('express');
const userRouter = require('./Routes/userRouter');
const loginRouter = require('./Routes/loginRouter');
const userMessagesRouter = require('./Routes/userMessagesRouter');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const app = express();

// For json req
app.use(express.json());

// to server profile pics
app.use('/static', express.static(path.join(__dirname, 'public')));

// passport setup with JWT
require('./passport-config');

const allowlist = (process.env.CORS_ORIGIN || '').split(',');
function corsOptionsDelegate(req, callback) {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
}

app.use(cors(corsOptionsDelegate));

app.get('/', (req, res) => {
  res.json({ hi: 'hi' });
});

app.use('/users', userRouter);
app.use('/login', loginRouter);
app.use('/users/:userId/messages', userMessagesRouter);
app.get('/me', (req, res) => {
  // Call Passport's authenticate manually
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      res.json({ user: null }); // optional: handle error
    }
    if (user) {
      return res.json({ user });
    } else {
      return res.json({ user: null });
    }
  })(req, res);
});

module.exports = (req, res) => {
  app(req, res);
};
