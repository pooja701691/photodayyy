const app = require('./app');
const prisma = require('./config/database');
const { initQdrantCollection } = require('./config/qdrant');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database connection check
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Ensure Qdrant collection is ready
    try {
      await initQdrantCollection();
    } catch (qdrantErr) {
      console.warn('Qdrant collection initialization warning:', qdrantErr.message);
    }

    // Start background AI face embedding worker
    if (process.env.START_WORKER !== 'false') {
      try {
        require('./workers/faceEmbedding.worker');
      } catch (wErr) {
        console.warn('[Server] AI Worker startup warning:', wErr.message);
      }
    }

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
