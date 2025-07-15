const { getPrisma } = require('./connection');

const payments = {
  async getAllPayments(userId, userRole) {
    if (userRole === 'TENANT') {
      return await getPrisma().payment.findMany({
        where: { tenantId: userId },
        include: {
          property: true,
          unit: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // For landlords, get all payments
      const properties = await getPrisma().property.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });

      const propertyIds = properties.map(p => p.id);
      
      return await getPrisma().payment.findMany({
        where: { propertyId: { in: propertyIds } },
        include: {
          property: true,
          unit: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  async createPayment(paymentData) {
    return await getPrisma().payment.create({
      data: {
        tenantId: paymentData.tenantId,
        propertyId: paymentData.propertyId,
        unitId: paymentData.unitId,
        amount: Number(paymentData.amount),
        dueDate: paymentData.dueDate,
        paidDate: paymentData.paidDate,
        status: paymentData.paid ? 'PAID' : 'PENDING',
        method: paymentData.method,
      },
    });
  },

  async updatePayment(paymentId, updateData, userId, userRole) {
    const payment = await getPrisma().payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: { property: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check permissions
    if (userRole === 'TENANT' && payment.tenantId !== userId) {
      throw new Error('Unauthorized');
    }

    return await getPrisma().payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        amount: updateData.amount ? Number(updateData.amount) : undefined,
        dueDate: updateData.dueDate,
        paidDate: updateData.paidDate,
        status: updateData.paid ? 'PAID' : 'PENDING',
        method: updateData.method,
      },
    });
  },

  async getTenantPayments(tenantId) {
    return await getPrisma().payment.findMany({
      where: { tenantId: parseInt(tenantId) },
      include: {
        property: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  },
};

module.exports = payments; 