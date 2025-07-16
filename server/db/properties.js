const { getPrisma } = require('./connection');
const users = require('./users');

const properties = {
  // Property operations
  async getProperties(userId = null) {
    const whereClause = userId ? { ownerId: userId } : {};
    
    const properties = await getPrisma().property.findMany({
      where: whereClause,
      include: {
        units: {
          include: {
            tenantUnits: {
              include: {
                tenant: true
              }
            }
          }
        },
        expenses: true,
        tenantUnits: {
          include: {
            tenant: true,
            unit: true,
          },
        },
        leaseAgreements: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            tenant: true
          }
        }
      },
    });

    return properties.map(property => {
      const mortgage = property.mortgageAmount ? {
        amount: property.mortgageAmount,
        monthlyPayment: property.mortgagePayment,
        lender: property.mortgageLender,
        rate: property.mortgageRate,
        term: property.mortgageTerm,
        startDate: property.mortgageStartDate,
      } : null;

      const miscExpenses = property.expenses.map(expense => ({
        label: expense.label,
        amount: expense.amount,
      }));

      // Check if property has active lease (for single-family)
      const hasActiveLease = property.type === 'SINGLE_FAMILY' && 
        property.leaseAgreements.some(lease => {
          const endDate = new Date(lease.leaseEndDate);
          return endDate > new Date(); // Lease is still active
        });

      let rent = null;
      let tenant = null;
      let leaseStart = null;
      let leaseEnd = null;
      let isAvailable = !hasActiveLease;
      
      if (property.type === 'SINGLE_FAMILY') {
        rent = property.rent; // Always use the property rent field
        const tenantUnit = property.tenantUnits[0];
        if (tenantUnit) {
          tenant = tenantUnit.tenantName;
          leaseStart = tenantUnit.leaseStart;
          leaseEnd = tenantUnit.leaseEnd;
        }
      }

      const units = property.type === 'MULTI_FAMILY' ? property.units.map(unit => {
        // Find tenant unit for this unit
        const tenantUnit = property.tenantUnits.find(tu => tu.unitId === unit.id);
        
        // Check if unit has active lease
        const unitActiveLease = property.leaseAgreements.find(lease => 
          lease.unitId === unit.id && 
          new Date(lease.leaseEndDate) > new Date()
        );
        
        const isUnitAvailable = !unitActiveLease;
        
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          rent: unit.rent,
          tenant: tenantUnit?.tenantName || null,
          leaseStart: tenantUnit?.leaseStart || null,
          leaseEnd: tenantUnit?.leaseEnd || null,
          isAvailable: isUnitAvailable,
          activeTenant: unitActiveLease?.tenant?.firstName + ' ' + unitActiveLease?.tenant?.lastName || null,
          leaseEndDate: unitActiveLease?.leaseEndDate || null,
        };
      }) : [];

      return {
        id: property.id,
        name: property.name,
        address: property.address,
        type: property.type === 'SINGLE_FAMILY' ? 'single-family' : 'multi-family',
        valuation: property.valuation,
        rent: rent,
        tenant: tenant,
        leaseStart: leaseStart,
        leaseEnd: leaseEnd,
        units: units,
        mortgage: mortgage,
        taxRate: property.taxRate,
        miscExpenses: miscExpenses,
        tenantUnits: property.tenantUnits,
        isAvailable: isAvailable,
        activeTenant: hasActiveLease ? property.leaseAgreements[0]?.tenant?.firstName + ' ' + property.leaseAgreements[0]?.tenant?.lastName : null,
        leaseEndDate: hasActiveLease ? property.leaseAgreements[0]?.leaseEndDate : null,
      };
    });
  },

  async createProperty(propertyData) {
    // Convert frontend property type to Prisma enum format
    const convertPropertyType = (type) => {
      if (type === 'single-family') return 'SINGLE_FAMILY';
      if (type === 'multi-family') return 'MULTI_FAMILY';
      return type; // fallback to original value
    };

    // Create the property first
    const property = await getPrisma().property.create({
      data: {
        name: propertyData.name,
        address: propertyData.address,
        valuation: propertyData.valuation,
        ownerId: propertyData.ownerId,
        type: convertPropertyType(propertyData.type),
        mortgageAmount: propertyData.mortgage?.amount ? Number(propertyData.mortgage.amount) : null,
        mortgagePayment: propertyData.mortgage?.monthlyPayment ? Number(propertyData.mortgage.monthlyPayment) : null,
        mortgageLender: propertyData.mortgage?.lender,
        mortgageRate: propertyData.mortgage?.rate ? Number(propertyData.mortgage.rate) : null,
        mortgageTerm: propertyData.mortgage?.term ? Number(propertyData.mortgage.term) : null,
        mortgageStartDate: propertyData.mortgage?.startDate,
        taxRate: propertyData.taxRate,
        rent: propertyData.type === 'single-family' || propertyData.type === 'SINGLE_FAMILY' ? (propertyData.rent !== '' ? Number(propertyData.rent) : null) : null,
        units: propertyData.units ? {
          create: propertyData.units.map(unit => ({
            unitNumber: unit.unitNumber,
            rent: unit.rent,
          })),
        } : undefined,
        expenses: propertyData.miscExpenses && propertyData.miscExpenses.length > 0 ? {
          create: propertyData.miscExpenses.map(expense => ({
            label: expense.label,
            amount: Number(expense.amount),
          })),
        } : undefined,
      },
      include: {
        units: true,
        expenses: true,
      },
    });

    // Handle tenant info for single-family property
    if (
      (propertyData.type === 'single-family' || propertyData.type === 'SINGLE_FAMILY') &&
      propertyData.tenant && propertyData.tenant.trim()
    ) {
      // Find or create tenant user
      let tenantUser = await getPrisma().user.findFirst({
        where: {
          username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
          role: 'TENANT',
        },
      });
      if (!tenantUser) {
        tenantUser = await getPrisma().user.create({
          data: {
            username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
            password: 'default_password', // In production, generate a proper password
            role: 'TENANT',
            firstName: propertyData.tenant.split(' ')[0] || '',
            lastName: propertyData.tenant.split(' ').slice(1).join(' ') || '',
          },
        });
      }
      // Create tenant unit
      await getPrisma().tenantUnit.create({
        data: {
          tenantId: tenantUser.id,
          propertyId: property.id,
          rent: propertyData.rent ? Number(propertyData.rent) : null,
          tenantName: propertyData.tenant,
          leaseStart: propertyData.leaseStart || null,
          leaseEnd: propertyData.leaseEnd || null,
        },
      });
    }

    // Handle tenant info for multi-family property
    if (
      (propertyData.type === 'multi-family' || propertyData.type === 'MULTI_FAMILY') &&
      Array.isArray(propertyData.units)
    ) {
      for (const unit of propertyData.units) {
        if (unit.tenant && unit.tenant.trim()) {
          // Find or create tenant user
          let tenantUser = await getPrisma().user.findFirst({
            where: {
              username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
              role: 'TENANT',
            },
          });
          if (!tenantUser) {
            tenantUser = await getPrisma().user.create({
              data: {
                username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
                password: 'default_password',
                role: 'TENANT',
                firstName: unit.tenant.split(' ')[0] || '',
                lastName: unit.tenant.split(' ').slice(1).join(' ') || '',
              },
            });
          }
          // Find the unit we just created (by unitNumber and propertyId)
          const createdUnit = property.units.find(
            (u) => u.unitNumber === unit.unitNumber
          );
          if (createdUnit) {
            await getPrisma().tenantUnit.create({
              data: {
                tenantId: tenantUser.id,
                propertyId: property.id,
                unitId: createdUnit.id,
                rent: unit.rent ? Number(unit.rent) : null,
                tenantName: unit.tenant,
                leaseStart: unit.leaseStart || null,
                leaseEnd: unit.leaseEnd || null,
              },
            });
          }
        }
      }
    }

    return property;
  },

  async updateProperty(propertyId, propertyData) {
    // Convert frontend property type to Prisma enum format
    const convertPropertyType = (type) => {
      if (type === 'single-family') return 'SINGLE_FAMILY';
      if (type === 'multi-family') return 'MULTI_FAMILY';
      return type; // fallback to original value
    };

    // Delete existing units and tenant units first
    await getPrisma().unit.deleteMany({
      where: { propertyId: parseInt(propertyId) }
    });
    await getPrisma().tenantUnit.deleteMany({
      where: { propertyId: parseInt(propertyId) }
    });

    // Handle tenant info for single-family property
    if (
      (propertyData.type === 'single-family' || propertyData.type === 'SINGLE_FAMILY') &&
      propertyData.tenant && propertyData.tenant.trim()
    ) {
      // Find or create tenant user
      let tenantUser = await getPrisma().user.findFirst({
        where: {
          username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
          role: 'TENANT',
        },
      });
      if (!tenantUser) {
        tenantUser = await getPrisma().user.create({
          data: {
            username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
            password: 'default_password',
            role: 'TENANT',
            firstName: propertyData.tenant.split(' ')[0] || '',
            lastName: propertyData.tenant.split(' ').slice(1).join(' ') || '',
          },
        });
      }
      // Create tenant unit
      await getPrisma().tenantUnit.create({
        data: {
          tenantId: tenantUser.id,
          propertyId: parseInt(propertyId),
          rent: propertyData.rent ? Number(propertyData.rent) : null,
          tenantName: propertyData.tenant,
          leaseStart: propertyData.leaseStart || null,
          leaseEnd: propertyData.leaseEnd || null,
        },
      });
    }

    // Handle tenant info for multi-family property
    if (
      (propertyData.type === 'multi-family' || propertyData.type === 'MULTI_FAMILY') &&
      Array.isArray(propertyData.units)
    ) {
      for (const unit of propertyData.units) {
        if (unit.tenant && unit.tenant.trim()) {
          // Find or create tenant user
          let tenantUser = await getPrisma().user.findFirst({
            where: {
              username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
              role: 'TENANT',
            },
          });
          if (!tenantUser) {
            tenantUser = await getPrisma().user.create({
              data: {
                username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
                password: 'default_password',
                role: 'TENANT',
                firstName: unit.tenant.split(' ')[0] || '',
                lastName: unit.tenant.split(' ').slice(1).join(' ') || '',
              },
            });
          }
          // Create unit first
          const createdUnit = await getPrisma().unit.findFirst({
            where: {
              propertyId: parseInt(propertyId),
              unitNumber: unit.unitNumber
            }
          });
          if (createdUnit) {
            await getPrisma().tenantUnit.create({
              data: {
                tenantId: tenantUser.id,
                propertyId: parseInt(propertyId),
                unitId: createdUnit.id,
                rent: unit.rent ? Number(unit.rent) : null,
                tenantName: unit.tenant,
                leaseStart: unit.leaseStart || null,
                leaseEnd: unit.leaseEnd || null,
              },
            });
          }
        }
      }
    }

    return await getPrisma().property.update({
      where: { id: parseInt(propertyId) },
      data: {
        name: propertyData.name,
        address: propertyData.address,
        valuation: propertyData.valuation,
        type: convertPropertyType(propertyData.type),
        mortgageAmount: propertyData.mortgage?.amount ? Number(propertyData.mortgage.amount) : null,
        mortgagePayment: propertyData.mortgage?.monthlyPayment ? Number(propertyData.mortgage.monthlyPayment) : null,
        mortgageLender: propertyData.mortgage?.lender,
        mortgageRate: propertyData.mortgage?.rate ? Number(propertyData.mortgage.rate) : null,
        mortgageTerm: propertyData.mortgage?.term ? Number(propertyData.mortgage.term) : null,
        mortgageStartDate: propertyData.mortgage?.startDate,
        taxRate: propertyData.taxRate,
        rent: propertyData.type === 'single-family' || propertyData.type === 'SINGLE_FAMILY' ? (propertyData.rent !== '' ? Number(propertyData.rent) : null) : null,
        units: propertyData.units ? {
          create: propertyData.units.map(unit => ({
            unitNumber: unit.unitNumber,
            rent: unit.rent,
          })),
        } : undefined,
        expenses: propertyData.miscExpenses && propertyData.miscExpenses.length > 0 ? {
          create: propertyData.miscExpenses.map(expense => ({
            label: expense.label,
            amount: Number(expense.amount),
          })),
        } : undefined,
      },
      include: {
        units: true,
        expenses: true,
      },
    });
  },

  async deleteProperty(propertyId) {
    // Delete all related records first
    await getPrisma().tenantUnit.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().unit.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().expense.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().payment.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().workOrder.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().leaseAgreement.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    await getPrisma().tenantDocument.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });

    // Finally delete the property
    return await getPrisma().property.delete({
      where: { id: parseInt(propertyId) },
    });
  },

  // Property-specific tenant operations
  async updateTenantUnit(propertyId, unitNumber, updateData) {
    const property = await getPrisma().property.findUnique({
      where: { id: parseInt(propertyId) },
      include: {
        units: {
          where: { unitNumber: unitNumber },
          include: {
            tenantUnits: true
          }
        }
      }
    });

    if (!property) throw new Error('Property not found');

    let unit = property.units[0];
    if (!unit) {
      // Create unit if it doesn't exist
      unit = await getPrisma().unit.create({
        data: {
          unitNumber: unitNumber,
          propertyId: parseInt(propertyId),
          rent: updateData.rent ? Number(updateData.rent) : null,
        }
      });
    }

    // Update or create tenant unit
    if (updateData.payments) {
      // Update payments for existing tenant unit
      const tenantUnit = unit.tenantUnits[0];
      if (tenantUnit) {
        // Clear existing payments and create new ones
        await getPrisma().payment.deleteMany({
          where: { 
            tenantId: tenantUnit.tenantId,
            propertyId: parseInt(propertyId),
            unitId: unit.id
          }
        });

        for (const payment of updateData.payments) {
          await getPrisma().payment.create({
            data: {
              tenantId: tenantUnit.tenantId,
              propertyId: parseInt(propertyId),
              unitId: unit.id,
              amount: Number(payment.amount || tenantUnit.rent),
              dueDate: payment.dueDate,
              paidDate: payment.paid ? payment.paidDate : null,
              status: payment.paid ? 'PAID' : 'PENDING',
            }
          });
        }
      }
    }

    return { success: true };
  },

  // Get property by ID
  async getPropertyById(propertyId) {
    return await getPrisma().property.findUnique({
      where: { id: Number(propertyId) }
    });
  },

  // Get unit by ID
  async getUnitById(unitId) {
    return await getPrisma().unit.findUnique({
      where: { id: Number(unitId) }
    });
  },
};

module.exports = properties; 