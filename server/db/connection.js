const { PrismaClient } = require('@prisma/client');

// Lazy initialization - only create client when first used
let prismaClient = null;

// Function to get or create Prisma client
const getPrisma = () => {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
};

// Cleanup function
const disconnect = async () => {
  if (prismaClient) {
    await getPrisma().$disconnect();
  }
};

module.exports = { getPrisma, disconnect }; 