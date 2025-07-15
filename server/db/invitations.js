const { getPrisma } = require('./connection');

const invitations = {
  // Get invitation by ID
  async getInvitationById(invitationId) {
    return await getPrisma().invitation.findUnique({
      where: { id: Number(invitationId) }
    });
  },

  // Create invitation
  async createInvitation(invitationData) {
    return await getPrisma().invitation.create({
      data: {
        email: invitationData.email,
        role: invitationData.role || 'TENANT',
        invitedBy: invitationData.invitedBy,
        propertyId: invitationData.propertyId ? Number(invitationData.propertyId) : null,
        unitId: invitationData.unitId ? Number(invitationData.unitId) : null,
        status: 'PENDING',
      },
    });
  },

  // Update invitation
  async updateInvitation(invitationId, updateData) {
    return await getPrisma().invitation.update({
      where: { id: Number(invitationId) },
      data: updateData,
    });
  },

  // Delete invitation
  async deleteInvitation(invitationId) {
    return await getPrisma().invitation.delete({
      where: { id: Number(invitationId) },
    });
  },

  // Get all invitations for a user
  async getInvitationsByUser(userId) {
    return await getPrisma().invitation.findMany({
      where: { invitedBy: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get invitation by email
  async getInvitationByEmail(email) {
    return await getPrisma().invitation.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  },
};

module.exports = invitations; 