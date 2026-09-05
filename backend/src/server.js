const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database connection check
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Access the server at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error);
    process.exit(1);
  }
}

// Handle shutdown signals gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing server database connections');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing server database connections');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
