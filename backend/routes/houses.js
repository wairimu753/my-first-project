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

router.get('/', async (req, res) => {
  try {
    const { neighbourhood, minPrice, maxPrice, bedrooms } = req.query;
    const filters = { available: true };
    if (neighbourhood) filters.neighbourhood = neighbourhood;
    if (bedrooms) filters.bedrooms = parseInt(bedrooms);
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = parseFloat(minPrice);
      if (maxPrice) filters.price.lte = parseFloat(maxPrice);
    }
    const houses = await prisma.house.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' }
    });
    res.json(houses);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const house = await prisma.house.findUnique({
      where: { id: req.params.id }
    });
    if (!house) return res.status(404).json({ error: 'House not found' });
    res.json(house);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      title, description, price, location,
      neighbourhood, bedrooms, bathrooms,
      images, landlordName, landlordPhone
    } = req.body;
    const house = await prisma.house.create({
      data: {
        title, description, price, location,
        neighbourhood, bedrooms, bathrooms,
        images, landlordName, landlordPhone
      }
    });
    res.json({ message: 'House listed successfully!', house });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.house.delete({ where: { id: req.params.id } });
    res.json({ message: 'House removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;