const { getPrisma } = require('./connection');

const users = {
  // User operations
  async createUser(userData) {
    return await getPrisma().user.create({
      data: {
        username: userData.username,
        password: userData.password, // In production, hash this
        role: userData.role || 'LANDLORD',
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
      },
    });
  },

  async findUserByUsername(username) {
    return await getPrisma().user.findUnique({
      where: { username },
    });
  },

  async verifyUser(username, password) {
    const user = await this.findUserByUsername(username);
    if (!user) return null;
    
    if (password === user.password) {
      return user;
    }
    return null;
  },

  async getContractors() {
    return await getPrisma().user.findMany({
      where: { role: 'CONTRACTOR' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  },

  async getTenantInfo(tenantId) {
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: {
          include: {
            property: true,
            unit: true,
          },
        },
        payments: {
          include: {
            property: true,
            unit: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        leaseAgreements: {
          include: {
            property: true,
            unit: true,
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      username: tenant.username,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      role: tenant.role,
      properties: tenant.tenantUnits.map(tu => ({
        property: tu.property,
        unit: tu.unit,
        rent: tu.rent,
        leaseStart: tu.leaseStart,
        leaseEnd: tu.leaseEnd,
      })),
      payments: tenant.payments,
      leases: tenant.leaseAgreements,
    };
  },

  // Enhanced Tenant Management Operations
  async getAllTenants(landlordId) {
    const properties = await getPrisma().property.findMany({
      where: { ownerId: parseInt(landlordId) },
      include: {
        tenantUnits: {
          include: {
            tenant: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              }
            },
            unit: true
          }
        },
        units: {
          include: {
            tenantUnits: {
              include: {
                tenant: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                  }
                },
                unit: true
              }
            }
          }
        }
      }
    });

    // Aggregate by unique tenant
    const tenantMap = new Map();
    for (const property of properties) {
      for (const tenantUnit of property.tenantUnits) {
        if (!tenantUnit.tenant) continue;
        const id = tenantUnit.tenant.id;
        if (!tenantMap.has(id)) {
          tenantMap.set(id, {
            id,
            username: tenantUnit.tenant.username,
            firstName: tenantUnit.tenant.firstName,
            lastName: tenantUnit.tenant.lastName,
            email: tenantUnit.tenant.email,
            phone: tenantUnit.tenant.phone,
            role: tenantUnit.tenant.role,
            assignments: [],
            payments: [],
          });
        }
        tenantMap.get(id).assignments.push({
          propertyId: property.id,
          propertyName: property.name,
          propertyAddress: property.address,
          unitId: tenantUnit.unit?.id || null,
          unitNumber: tenantUnit.unit?.unitNumber || null,
          rent: tenantUnit.rent || 0,
          leaseStart: tenantUnit.leaseStart || '',
          leaseEnd: tenantUnit.leaseEnd || '',
          type: property.type === 'SINGLE_FAMILY' ? 'single-family' : 'multi-family',
        });
      }
    }

    // Add payment information for each tenant
    for (const tenant of tenantMap.values()) {
      const payments = await getPrisma().payment.findMany({
        where: { tenantId: tenant.id },
        orderBy: { dueDate: 'desc' }
      });
      tenant.payments = payments || [];
    }

    return Array.from(tenantMap.values());
  },

  // Flat array for rent tracking
  async getTenantAssignmentsFlat(landlordId) {
    const properties = await getPrisma().property.findMany({
      where: { ownerId: parseInt(landlordId) },
      include: {
        tenantUnits: {
          include: {
            tenant: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              }
            },
            unit: true
          }
        },
        units: true
      }
    });
    const rows = [];
    for (const property of properties) {
      for (const tenantUnit of property.tenantUnits) {
        if (!tenantUnit.tenant) continue;
        const payments = await getPrisma().payment.findMany({
          where: {
            tenantId: tenantUnit.tenant.id,
            propertyId: property.id,
            unitId: tenantUnit.unitId || undefined,
          },
          orderBy: { dueDate: 'asc' }
        });
        rows.push({
          tenant: `${tenantUnit.tenant.firstName || ''} ${tenantUnit.tenant.lastName || ''}`.trim() || tenantUnit.tenant.username,
          tenantId: tenantUnit.tenant.id,
          propertyName: property.name,
          propertyId: property.id,
          unitId: tenantUnit.unitId,
          unitNumber: tenantUnit.unit?.unitNumber || null,
          rent: tenantUnit.rent || 0,
          leaseStart: tenantUnit.leaseStart || '',
          leaseEnd: tenantUnit.leaseEnd || '',
          payments: payments || [],
          type: property.type === 'SINGLE_FAMILY' ? 'single-family' : 'multi-family',
        });
      }
    }
    return rows;
  },

  async createTenant(tenantData) {
    const { landlordId, ...userData } = tenantData;
    // Always create a new user account for tenant
    const tenant = await getPrisma().user.create({
      data: {
        username: userData.username,
        password: userData.password || 'default_password',
        role: 'TENANT',
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
      }
    });
    // Create tenant unit if property and unit info provided
    if (userData.propertyId) {
      await getPrisma().tenantUnit.create({
        data: {
          tenantId: tenant.id,
          propertyId: parseInt(userData.propertyId),
          unitId: userData.unitId ? parseInt(userData.unitId) : null,
          rent: userData.rentAmount ? Number(userData.rentAmount) : null,
          tenantName: `${userData.firstName} ${userData.lastName}`,
        }
      });
      // Create a lease agreement for this tenant
      if (userData.leaseStartDate && userData.leaseEndDate) {
        await getPrisma().leaseAgreement.create({
          data: {
            tenantId: tenant.id,
            propertyId: parseInt(userData.propertyId),
            unitId: userData.unitId ? parseInt(userData.unitId) : null,
            rentAmount: userData.rentAmount ? Number(userData.rentAmount) : null,
            securityDeposit: userData.securityDeposit ? Number(userData.securityDeposit) : null,
            leaseStartDate: userData.leaseStartDate,
            leaseEndDate: userData.leaseEndDate,
            status: 'ACTIVE',
          }
        });
      }
    }
    return {
      ...tenant,
      password: undefined
    };
  },

  async getTenantById(tenantId, userId, userRole) {
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: {
          include: {
            property: true,
            unit: true,
          }
        },
        payments: {
          orderBy: { dueDate: 'desc' }
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' }
        },
        leaseAgreements: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tenant) return null;

    // Check access permissions
    if (userRole === 'TENANT' && tenant.id !== userId) {
      return null; // Tenants can only see their own data
    }

    if (userRole === 'LANDLORD') {
      // Check if landlord owns any property this tenant is associated with
      const hasAccess = tenant.tenantUnits.some(tu => 
        tu.property.ownerId === userId
      );
      if (!hasAccess) return null;
    }

    // Fetch all lease documents for this tenant
    const leaseDocuments = await getPrisma().tenantDocument.findMany({
      where: {
        tenantId: tenant.id,
        type: 'LEASE_AGREEMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach documents to leases
    for (const lease of tenant.leaseAgreements) {
      lease.documents = leaseDocuments.filter(doc => Number(doc.leaseId) === Number(lease.id));
    }

    return {
      ...tenant,
      password: undefined,
      leaseDocuments,
      leaseAgreements: tenant.leaseAgreements,
    };
  },

  async updateTenant(tenantId, updateData, landlordId) {
    // Verify landlord owns property where tenant lives
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: {
          include: { property: true }
        }
      }
    });

    if (!tenant) throw new Error('Tenant not found');

    // Check if landlord owns any property where this tenant lives
    const hasAccess = tenant.tenantUnits.some(tu => tu.property.ownerId === parseInt(landlordId));
    if (!hasAccess) throw new Error('Access denied');

    return await getPrisma().user.update({
      where: { id: parseInt(tenantId) },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
      },
    });
  },

  async deleteTenantCascade(tenantId, landlordId) {
    // Only allow if landlord owns at least one property for this tenant
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: { include: { property: true } },
        leaseAgreements: true,
        payments: true,
      }
    });
    if (!tenant) throw new Error('Tenant not found');
    const ownsAny = tenant.tenantUnits.some(tu => tu.property.ownerId === parseInt(landlordId));
    if (!ownsAny) throw new Error('Access denied');
    // Delete all related records
    await getPrisma().tenantUnit.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().leaseAgreement.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().payment.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().user.delete({ where: { id: parseInt(tenantId) } });
  },

  // Lease Management
  async createLease(tenantId, leaseData, landlordId) {
    // Verify landlord owns the property
    const property = await getPrisma().property.findFirst({
      where: { 
        id: parseInt(leaseData.propertyId),
        ownerId: parseInt(landlordId)
      }
    });
    if (!property) throw new Error('Property not found or access denied');
    // Terminate any existing assignments for this tenant
    await getPrisma().tenantUnit.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().leaseAgreement.updateMany({
      where: { tenantId: parseInt(tenantId), status: 'ACTIVE' },
      data: { status: 'TERMINATED' }
    });
    // Upsert TenantUnit assignment
    await getPrisma().tenantUnit.create({
      data: {
        tenantId: parseInt(tenantId),
        propertyId: parseInt(leaseData.propertyId),
        unitId: leaseData.unitId ? parseInt(leaseData.unitId) : null,
        rent: Number(leaseData.rentAmount),
        leaseStart: leaseData.leaseStartDate,
        leaseEnd: leaseData.leaseEndDate,
      }
    });
    return await getPrisma().leaseAgreement.create({
      data: {
        tenantId: parseInt(tenantId),
        propertyId: parseInt(leaseData.propertyId),
        unitId: leaseData.unitId ? parseInt(leaseData.unitId) : null,
        rentAmount: Number(leaseData.rentAmount),
        securityDeposit: leaseData.securityDeposit ? Number(leaseData.securityDeposit) : null,
        leaseStartDate: leaseData.leaseStartDate,
        leaseEndDate: leaseData.leaseEndDate,
        lateFeeAmount: leaseData.lateFeeAmount ? Number(leaseData.lateFeeAmount) : null,
        gracePeriodDays: leaseData.gracePeriodDays ? parseInt(leaseData.gracePeriodDays) : null,
        utilitiesIncluded: leaseData.utilitiesIncluded || false,
        petPolicy: leaseData.petPolicy,
        parkingSpaces: leaseData.parkingSpaces ? parseInt(leaseData.parkingSpaces) : null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        property: true,
        unit: true
      }
    });
  },

  async updateLease(leaseId, updateData, landlordId) {
    // Find lease and check landlord owns the property
    const lease = await getPrisma().leaseAgreement.findUnique({
      where: { id: parseInt(leaseId) },
      include: { property: true }
    });
    if (!lease) throw new Error('Lease not found');
    if (lease.property.ownerId !== parseInt(landlordId)) throw new Error('Access denied');
    return await getPrisma().leaseAgreement.update({
      where: { id: parseInt(leaseId) },
      data: {
        leaseStartDate: updateData.leaseStartDate,
        leaseEndDate: updateData.leaseEndDate,
      }
    });
  },

  async getLeaseById(leaseId) {
    return await getPrisma().leaseAgreement.findUnique({
      where: { id: parseInt(leaseId) },
    });
  },

  async createTenantDocument({ tenantId, type, filename, fileUrl, uploadedBy }) {
    return await getPrisma().tenantDocument.create({
      data: {
        tenantId: parseInt(tenantId),
        type,
        filename,
        fileUrl,
        uploadedBy: parseInt(uploadedBy),
      },
    });
  },

  async getTenantDocumentsForLease(leaseId) {
    // Find the lease to get tenantId, propertyId, unitId
    const lease = await getPrisma().leaseAgreement.findUnique({
      where: { id: parseInt(leaseId) },
    });
    if (!lease) return [];
    // Return all documents for this tenant (optionally filter by type or property/unit)
    return await getPrisma().tenantDocument.findMany({
      where: {
        tenantId: lease.tenantId,
        // Optionally, filter by type: type: 'LEASE_AGREEMENT',
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // End active lease agreement for a tenant/property/unit
  async endLeaseAgreement(tenantId, propertyId, unitId) {
    await getPrisma().leaseAgreement.updateMany({
      where: {
        tenantId,
        propertyId,
        unitId: unitId || undefined,
        status: 'ACTIVE',
      },
      data: { status: 'TERMINATED' }
    });
  },

  // Delete tenantUnit assignment for a tenant/property/unit
  async deleteTenantUnit(tenantId, propertyId, unitId) {
    await getPrisma().tenantUnit.deleteMany({
      where: {
        tenantId,
        propertyId,
        unitId: unitId || undefined,
      }
    });
  },
};

module.exports = users; 