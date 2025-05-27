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
      if ((error.code = 'P2002')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get('/', async (req, res) => {
  const { id, keyword } = req.query;
  let clause = {};
  if (keyword) {
    clause = {
      name: {
        contains: keyword,
      },
    };
  }
  try {
    const users = await prisma.user.findMany({
      where: id ? { id, ...clause } : { ...clause },
      select: {
        id: true,
        name: true,
        ppic: true,
      },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

userRouter.post(
  '/:userId/requests',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const { receiverId } = req.body;
    if (receiverId === userId) {
      return res.status(409).json({ error: "Can't send self request" });
    }
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const request = await prisma.friendRequest.create({
        data: {
          receiverId,
          senderId: userId,
          state: 'pending',
        },
      });
      res.json(request);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Request already sent' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get(
  '/:userId/requests',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const requests = await prisma.friendRequest.findMany({
        where: {
          state: 'pending',
          receiverId: userId,
        },
        include: {
          sender: { select: { name: true, id: true, ppic: true } },
        },
      });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

async function makeFriends(receiverId, senderId) {
  try {
    // Add sender to receiver's contacts
    await prisma.user.update({
      where: { id: receiverId },
      data: {
        contacts: {
          connect: {
            id: senderId,
          },
        },
      },
    });

    // Add receiver to sender's contacts
    await prisma.user.update({
      where: { id: senderId },
      data: {
        contacts: {
          connect: { id: receiverId },
        },
      },
    });
  } catch (error) {
    throw new Error('Failed to create contacts');
  }
}
userRouter.put(
  '/:userId/requests/:requestId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId, requestId } = req.params;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    const { status } = req.body;
    try {
      const updatedReq = await prisma.friendRequest.update({
        where: {
          id: requestId,
          receiverId: userId,
        },
        data: {
          state: status,
        },
      });
      if (updatedReq.state === 'accepted') {
        await makeFriends(userId, updatedReq.senderId);
      }
      res.json(updatedReq);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get(
  '/:userId/contacts',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const contacts = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          contacts: {
            select: {
              name: true,
              id: true,
              ppic: true,
              messagesReceived: {
                where: {
                  senderId: userId,
                },
                include: {
                  sender: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                  receiver: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
              messagesSent: {
                where: {
                  receiverId: userId,
                },
                include: {
                  sender: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                  receiver: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      res.json(contacts.contacts);
    } catch (error) {
      return res.json({ error: 'Internal Server Error' });
    }
  }
);

userRouter.get(
  '/:userId/contacts/:contactId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId, contactId } = req.params;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          contacts: {
            where: {
              id: contactId,
            },
            select: {
              name: true,
              id: true,
              ppic: true,
              messagesReceived: {
                where: {
                  senderId: userId,
                },
                include: {
                  receiver: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                  sender: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
              messagesSent: {
                where: {
                  receiverId: userId,
                },
                include: {
                  receiver: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                  sender: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      res.json(user.contacts[0]);
    } catch (error) {
      return res.json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = userRouter;
