const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthService {
  async register({ name, email, password }) {
    if (!name || !email || !password) {
      const error = new Error('All fields (name, email, password) are required.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (trimmedName.length < 2) {
      const error = new Error('Name must be at least 2 characters long.');
      error.statusCode = 400;
      throw error;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      const error = new Error('Please enter a valid email address.');
      error.statusCode = 400;
      throw error;
    }

    if (typeof password !== 'string' || password.length < 6) {
      const error = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      const error = new Error('Email is already registered.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: cleanEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Email and password are required.');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!EMAIL_REGEX.test(cleanEmail)) {
      const error = new Error('Please enter a valid email address.');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
}

module.exports = new AuthService();
