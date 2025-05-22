const express = require('express');
const userRouter = require('./Routes/userRouter');
const loginRouter = require('./Routes/loginRouter');
const userMessagesRouter = require('./Routes/userMessagesRouter');
const app = express();

// For json req
app.use(express.json());

// passport setup with JWT
require('./passport-config');

app.get('/', (req, res) => {
  res.json({ hi: 'hi' });
});

app.use('/users', userRouter);
app.use('/login', loginRouter);
app.use('/users/:userId/messages', userMessagesRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
