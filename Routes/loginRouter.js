const { Router } = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const prisma = require('../prismaClient');

const loginRouter = new Router();

loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists:
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(user);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Check if passwords match:
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // generate JWT
    const payload = {
      id: user.id,
      email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json(token);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = loginRouter;
