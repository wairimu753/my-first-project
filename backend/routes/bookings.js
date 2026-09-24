const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://fc23b4c5a5adebd5f7b18b547966f280c1e30f64762b2b51dccf27334f84301d:sk_j4Ae1NMprDsPJPWZSUdoy@pooled.db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/', auth, async (req, res) => {
  try {
    const { houseId, visitDate } = req.body;
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        houseId,
        visitDate: new Date(visitDate)
      },
      include: { house: true }
    });
    res.json({ message: 'Viewing booked successfully!', booking });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: { house: true }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;