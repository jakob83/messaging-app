const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');
const bcryptjs = require('bcryptjs');
const passport = require('passport');

const userRouter = new Router();

userRouter.post(
  '/',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email } = req.body;
    const hash = await bcryptjs.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          password: hash,
          name: username,
          email,
        },
      });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

userRouter.post(
  '/userId/requests',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const { receiverId } = req.body;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const request = await prisma.friendRequest.create({
        data: {
          userId,
          receiverId,
        },
      });
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get(
  '/userId/requests',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const requests = await prisma.friendRequest.findMany();
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = userRouter;
