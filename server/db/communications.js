const { getPrisma } = require('./connection');

const communications = {
  // Communication System
  async createCommunication(communicationData) {
    return await getPrisma().communication.create({
      data: {
        senderId: parseInt(communicationData.senderId),
        receiverId: parseInt(communicationData.receiverId),
        subject: communicationData.subject,
        message: communicationData.message,
        type: communicationData.type || 'MESSAGE',
        priority: communicationData.priority || 'MEDIUM',
        relatedTo: communicationData.relatedTo,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  },

  async getCommunications(userId, userRole) {
    return await getPrisma().communication.findMany({
      where: {
        OR: [
          { senderId: parseInt(userId) },
          { receiverId: parseInt(userId) }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
};

module.exports = communications; 