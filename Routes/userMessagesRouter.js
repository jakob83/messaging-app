const { Router } = require('express');
const passport = require('passport');
const prisma = require('../prismaClient');
const userMessagesRouter = new Router({ mergeParams: true });

userMessagesRouter.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const { contactId } = req.query;
    const user = req.user;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const messagesSent = await prisma.message.findMany({
        where: {
          senderId: userId,
          ...(contactId && { receiverId: contactId }),
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
      });
      const messagesReceived = await prisma.message.findMany({
        where: {
          receiverId: userId,
          ...(contactId && { senderId: contactId }),
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
      });
      return res.json({
        sent: messagesSent,
        received: messagesReceived,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

userMessagesRouter.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    console.log(user);
    const { receiverId, content } = req.body;
    if (user.id !== userId) {
      return res.status(403).json({ error: 'cannot access this data' });
    }
    try {
      const message = await prisma.message.create({
        data: {
          receiverId: receiverId,
          senderId: userId,
          content,
        },
      });
      return res.json(message);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = userMessagesRouter;
