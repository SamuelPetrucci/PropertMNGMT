const { PrismaClient } = require('@prisma/client');

// Lazy initialization - only create client when first used
let prismaClient = null;

const getPrisma = () => {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
};

// Database service functions
const db = {
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

  // Property operations
  async getProperties() {
    const properties = await getPrisma().property.findMany({
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

      let rent = null;
      let tenant = null;
      let leaseStart = null;
      let leaseEnd = null;
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
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          rent: unit.rent,
          tenant: tenantUnit?.tenantName || null,
          leaseStart: tenantUnit?.leaseStart || null,
          leaseEnd: tenantUnit?.leaseEnd || null,
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

    // First, delete existing units if this is a multi-family property with new units
    await getPrisma().unit.deleteMany({
      where: { propertyId: parseInt(propertyId) }
    });

    // Handle tenant data for single-family properties
    if (propertyData.type === 'single-family' && propertyData.tenant) {
      // Delete existing tenant units for this property
      await getPrisma().tenantUnit.deleteMany({
        where: { propertyId: parseInt(propertyId) }
      });

      // Create new tenant unit if tenant name is provided
      if (propertyData.tenant.trim()) {
        // Find or create a tenant user
        let tenantUser = await getPrisma().user.findFirst({
          where: { 
            username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
            role: 'TENANT'
          }
        });

        if (!tenantUser) {
          tenantUser = await getPrisma().user.create({
            data: {
              username: propertyData.tenant.toLowerCase().replace(/\s+/g, '_'),
              password: 'default_password', // In production, generate a proper password
              role: 'TENANT',
              firstName: propertyData.tenant.split(' ')[0] || '',
              lastName: propertyData.tenant.split(' ').slice(1).join(' ') || '',
            }
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
          }
        });
      }
    }

    // Handle tenant data for multi-family properties
    if (propertyData.type === 'multi-family' && propertyData.units) {
      // Delete existing tenant units for this property
      await getPrisma().tenantUnit.deleteMany({
        where: { propertyId: parseInt(propertyId) }
      });

      // Create tenant units for each unit that has tenant info
      for (const unit of propertyData.units) {
        if (unit.tenant && unit.tenant.trim()) {
          // Find or create a tenant user
          let tenantUser = await getPrisma().user.findFirst({
            where: { 
              username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
              role: 'TENANT'
            }
          });

          if (!tenantUser) {
            tenantUser = await getPrisma().user.create({
              data: {
                username: unit.tenant.toLowerCase().replace(/\s+/g, '_'),
                password: 'default_password',
                role: 'TENANT',
                firstName: unit.tenant.split(' ')[0] || '',
                lastName: unit.tenant.split(' ').slice(1).join(' ') || '',
              }
            });
          }

          // Find the unit we just created
          const createdUnit = await getPrisma().unit.findFirst({
            where: { 
              propertyId: parseInt(propertyId),
              unitNumber: unit.unitNumber
            }
          });

          if (createdUnit) {
            // Create tenant unit linked to this unit
            await getPrisma().tenantUnit.create({
              data: {
                tenantId: tenantUser.id,
                propertyId: parseInt(propertyId),
                unitId: createdUnit.id,
                rent: unit.rent ? Number(unit.rent) : null,
                tenantName: unit.tenant,
                leaseStart: unit.leaseStart || null,
                leaseEnd: unit.leaseEnd || null,
              }
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
        // Handle units for multi-family properties
        units: propertyData.type === 'multi-family' && propertyData.units ? {
          create: propertyData.units.map(unit => ({
            unitNumber: unit.unitNumber,
            rent: unit.rent ? Number(unit.rent) : null,
          })),
        } : undefined,
        // Handle expenses
        expenses: propertyData.miscExpenses && propertyData.miscExpenses.length > 0 ? {
          deleteMany: {}, // Delete existing expenses
          create: propertyData.miscExpenses.map(expense => ({
            label: expense.label,
            amount: Number(expense.amount),
          })),
        } : undefined,
      },
      include: {
        units: true,
        expenses: true,
        tenantUnits: {
          include: {
            tenant: true
          }
        }
      },
    });
  },

  async deleteProperty(propertyId) {
    // Delete related records first to avoid foreign key constraint errors
    await getPrisma().tenantUnit.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    
    await getPrisma().unit.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    
    await getPrisma().miscExpense.deleteMany({
      where: { propertyId: parseInt(propertyId) },
    });
    
    // Now delete the property
    return await getPrisma().property.delete({
      where: { id: parseInt(propertyId) },
    });
  },

  // Standalone Project operations
  async getStandaloneProjects() {
    const projects = await getPrisma().standaloneProject.findMany({
      include: {
        jobs: true,
        costs: true,
      },
    });

    // Calculate budget utilization and costs for each project
    return projects.map(project => {
      // Calculate total cost from both project costs and job costs
      const projectCostsTotal = project.costs.reduce((sum, cost) => sum + cost.amount, 0);
      const jobCostsTotal = project.jobs.reduce((sum, job) => {
        // Use actualCost if available, otherwise use estimatedCost
        const jobCost = job.actualCost || job.estimatedCost || 0;
        return sum + jobCost;
      }, 0);
      
      const totalCost = projectCostsTotal + jobCostsTotal;
      const budgetUtilization = project.budget ? (totalCost / project.budget) * 100 : 0;
      const budgetRemaining = project.budget ? project.budget - totalCost : 0;

      // Add laborCost and materialCost to each job for frontend compatibility
      const jobsWithCosts = project.jobs.map(job => {
        const estimatedCost = job.estimatedCost || 0;
        // Split estimated cost 50/50 between labor and materials (you can adjust this ratio)
        const laborCost = estimatedCost * 0.5;
        const materialCost = estimatedCost * 0.5;
        
        return {
          ...job,
          laborCost,
          materialCost,
        };
      });

      return {
        ...project,
        jobs: jobsWithCosts,
        totalCost,
        budgetUtilization,
        budgetRemaining,
        projectCostsTotal,
        jobCostsTotal,
      };
    });
  },

  async getStandaloneProjectById(projectId) {
    const project = await getPrisma().standaloneProject.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        jobs: true, // costs include removed
        costs: true,
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) return null;

    // Calculate total cost from both project costs, job costs, and job-attached costs
    const projectCostsTotal = project.costs.reduce((sum, cost) => sum + cost.amount, 0);
    let jobCostsTotal = 0;
    let jobAttachedCostsTotal = 0;
    const jobsWithCosts = project.jobs.map(job => {
      // Sum all additional costs attached to this job
      const additionalCosts = job.costs ? job.costs.reduce((sum, cost) => sum + cost.amount, 0) : 0;
      jobAttachedCostsTotal += additionalCosts;
      // Use actualCost if available, otherwise use estimatedCost
      const jobCost = job.actualCost || job.estimatedCost || 0;
      jobCostsTotal += jobCost;
      // Split estimated cost 50/50 between labor and materials (for display)
      const estimatedCost = job.estimatedCost || 0;
      const laborCost = estimatedCost * 0.5;
      const materialCost = estimatedCost * 0.5;
      return {
        ...job,
        laborCost,
        materialCost,
      };
    });
    const totalCost = projectCostsTotal + jobCostsTotal + jobAttachedCostsTotal;
    const budgetUtilization = project.budget ? (totalCost / project.budget) * 100 : 0;
    const budgetRemaining = project.budget ? project.budget - totalCost : 0;

    // Group costs by type (project-level only)
    const costByType = project.costs.reduce((acc, cost) => {
      acc[cost.type] = (acc[cost.type] || 0) + cost.amount;
      return acc;
    }, {});

    return {
      ...project,
      jobs: jobsWithCosts,
      totalCost,
      budgetUtilization,
      budgetRemaining,
      costByType,
      projectCostsTotal,
      jobCostsTotal,
      jobAttachedCostsTotal,
    };
  },

  async createStandaloneProject(projectData) {
    return await getPrisma().standaloneProject.create({
      data: {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'PLANNING',
        startDate: projectData.startDate ? new Date(projectData.startDate) : null,
        endDate: projectData.endDate ? new Date(projectData.endDate) : null,
        budget: projectData.budget ? Number(projectData.budget) : null,
        location: projectData.location,
        ownerId: projectData.ownerId,
      },
    });
  },

  async updateStandaloneProject(projectId, projectData) {
    return await getPrisma().standaloneProject.update({
      where: { id: parseInt(projectId) },
      data: {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
        endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
        budget: projectData.budget !== undefined ? Number(projectData.budget) : undefined,
        location: projectData.location,
      },
    });
  },

  async deleteStandaloneProject(projectId) {
    // Delete in order to handle foreign key constraints
    // First delete all costs associated with the project
    await getPrisma().projectCost.deleteMany({
      where: { projectId: parseInt(projectId) },
    });

    // Delete all jobs associated with the project
    await getPrisma().projectJob.deleteMany({
      where: { projectId: parseInt(projectId) },
    });

    // Finally delete the project itself
    return await getPrisma().standaloneProject.delete({
      where: { id: parseInt(projectId) },
    });
  },

  async getProjectJobs(projectId) {
    return await getPrisma().projectJob.findMany({
      where: { projectId: parseInt(projectId) },
    });
  },

  async createProjectJob(jobData) {
    // Calculate estimated cost from labor and material costs
    const laborCost = jobData.laborCost ? Number(jobData.laborCost) : 0;
    const materialCost = jobData.materialCost ? Number(jobData.materialCost) : 0;
    const estimatedCost = laborCost + materialCost;

    return await getPrisma().projectJob.create({
      data: {
        projectId: parseInt(jobData.projectId),
        name: jobData.name,
        description: jobData.description,
        status: jobData.status || 'PENDING',
        priority: jobData.priority || 'MEDIUM',
        startDate: jobData.startDate ? new Date(jobData.startDate) : null,
        endDate: jobData.endDate ? new Date(jobData.endDate) : null,
        assignedTo: jobData.assignedTo,
        estimatedCost: estimatedCost > 0 ? estimatedCost : null,
        actualCost: jobData.actualCost ? Number(jobData.actualCost) : null,
      },
    });
  },

  async updateProjectJob(jobId, jobData) {
    // Calculate estimated cost from labor and material costs
    const laborCost = jobData.laborCost ? Number(jobData.laborCost) : 0;
    const materialCost = jobData.materialCost ? Number(jobData.materialCost) : 0;
    const estimatedCost = laborCost + materialCost;

    return await getPrisma().projectJob.update({
      where: { id: parseInt(jobId) },
      data: {
        name: jobData.name,
        description: jobData.description,
        status: jobData.status,
        priority: jobData.priority,
        startDate: jobData.startDate,
        endDate: jobData.endDate,
        assignedTo: jobData.assignedTo,
        estimatedCost: estimatedCost > 0 ? estimatedCost : null,
        actualCost: jobData.actualCost ? Number(jobData.actualCost) : null,
      },
    });
  },

  async deleteProjectJob(jobId) {
    return await getPrisma().projectJob.delete({
      where: { id: parseInt(jobId) },
    });
  },

  async getProjectCosts(projectId) {
    return await getPrisma().projectCost.findMany({
      where: { projectId: parseInt(projectId) },
    });
  },

  async createProjectCost(costData) {
    return await getPrisma().projectCost.create({
      data: {
        projectId: parseInt(costData.projectId),
        jobId: costData.jobId ? parseInt(costData.jobId) : null,
        description: costData.description,
        amount: Number(costData.amount),
        type: costData.type || 'MATERIAL',
        date: costData.date ? new Date(costData.date) : new Date(),
      },
    });
  },

  async deleteProjectCost(costId) {
    return await getPrisma().projectCost.delete({
      where: { id: parseInt(costId) },
    });
  },

  // Work order operations
  async getWorkOrders() {
    return await getPrisma().workOrder.findMany({
      include: {
        property: true,
        unit: true,
        tenantUnit: true,
        createdBy: true,
        assignedTo: true,
      },
    });
  },

  async createWorkOrder(workOrderData) {
    // Validate required fields
    if (!workOrderData.createdById || isNaN(workOrderData.createdById)) {
      throw new Error('Valid createdById is required');
    }
    
    if (!workOrderData.propertyId || isNaN(workOrderData.propertyId)) {
      throw new Error('Valid propertyId is required');
    }

    return await getPrisma().workOrder.create({
      data: {
        title: workOrderData.title,
        description: workOrderData.description,
        status: workOrderData.status || 'OPEN',
        priority: workOrderData.priority || 'MEDIUM',
        propertyId: parseInt(workOrderData.propertyId),
        unitId: workOrderData.unitId ? parseInt(workOrderData.unitId) : null,
        tenantUnitId: workOrderData.tenantUnitId ? parseInt(workOrderData.tenantUnitId) : null,
        createdById: parseInt(workOrderData.createdById),
        assignedToId: workOrderData.assignedToId ? parseInt(workOrderData.assignedToId) : null,
      },
    });
  },

  async updateWorkOrder(workOrderId, updateData) {
    return await getPrisma().workOrder.update({
      where: { id: parseInt(workOrderId) },
      data: {
        status: updateData.status,
        notes: updateData.notes,
        updatedAt: new Date(),
        ...(updateData.assignedToId !== undefined ? { assignedToId: updateData.assignedToId ? parseInt(updateData.assignedToId) : null } : {}),
      },
      include: {
        property: true,
        unit: true,
        tenantUnit: true,
        createdBy: true,
        assignedTo: true,
      },
    });
  },

  // Contractor operations
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

  // Tenant operations
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
      },
    });

    if (!tenant) return null;

    // Get the first tenant unit (assuming one tenant per property for now)
    const tenantUnit = tenant.tenantUnits[0];
    
    if (!tenantUnit) {
      return {
        ...tenant,
        password: undefined,
        property: null,
        unitNumber: null,
        rent: null,
      };
    }

    return {
      ...tenant,
      password: undefined,
      property: {
        id: tenantUnit.property.id,
        name: tenantUnit.property.name,
        address: tenantUnit.property.address,
        type: tenantUnit.property.type === 'SINGLE_FAMILY' ? 'single-family' : 'multi-family',
        rent: tenantUnit.rent,
      },
      unitNumber: tenantUnit.unit?.unitNumber || null,
      rent: tenantUnit.rent,
    };
  },

  async getTenantPayments(tenantId) {
    return await getPrisma().payment.findMany({
      where: { tenantId: parseInt(tenantId) },
      orderBy: { dueDate: 'desc' },
    });
  },

  // Enhanced Tenant Management Operations
  // Restore original getAllTenants for tenant management
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

  // New: flat array for rent tracking
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
          propertyName: property.name,
          propertyId: property.id,
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
            unit: true
          }
        },
        payments: {
          orderBy: { dueDate: 'desc' }
        },
        maintenanceRequests: {
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

    // Get lease agreements for this tenant
    const leaseAgreements = await getPrisma().leaseAgreement.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        property: true,
        unit: true
      }
    });

    // For each lease, attach its documents
    for (const lease of leaseAgreements) {
      lease.documents = leaseDocuments.filter(doc => Number(doc.leaseId) === Number(lease.id));
    }

    return {
      ...tenant,
      password: undefined,
      leaseDocuments,
      leaseAgreements,
    };
  },

  async updateTenant(tenantId, updateData, landlordId) {
    // Verify landlord owns property where tenant lives
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: {
          include: {
            property: true
          }
        }
      }
    });

    if (!tenant) throw new Error('Tenant not found');

    const hasAccess = tenant.tenantUnits.some(tu => 
      tu.property.ownerId === parseInt(landlordId)
    );
    if (!hasAccess) throw new Error('Access denied');

    return await getPrisma().user.update({
      where: { id: parseInt(tenantId) },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      }
    });
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

  // Payment Management
  async getAllPayments(userId, userRole) {
    if (userRole === 'TENANT') {
      return await getPrisma().payment.findMany({
        where: { tenantId: parseInt(userId) },
        include: {
          property: true,
          unit: true
        },
        orderBy: { dueDate: 'desc' }
      });
    } else if (userRole === 'LANDLORD') {
      // Get payments for all properties owned by landlord
      const properties = await getPrisma().property.findMany({
        where: { ownerId: parseInt(userId) },
        select: { id: true }
      });
      
      const propertyIds = properties.map(p => p.id);
      
      return await getPrisma().payment.findMany({
        where: { propertyId: { in: propertyIds } },
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
        },
        orderBy: { dueDate: 'desc' }
      });
    }
    
    return [];
  },

  async createPayment(paymentData) {
    return await getPrisma().payment.create({
      data: {
        tenantId: parseInt(paymentData.tenantId),
        propertyId: parseInt(paymentData.propertyId),
        unitId: paymentData.unitId ? parseInt(paymentData.unitId) : null,
        amount: Number(paymentData.amount),
        dueDate: paymentData.dueDate,
        paidDate: paymentData.paidDate || null,
        status: paymentData.status || 'PENDING',
        method: paymentData.method,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        property: true,
        unit: true
      }
    });
  },

  async updatePayment(paymentId, updateData, userId, userRole) {
    const payment = await getPrisma().payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        tenant: true,
        property: true
      }
    });

    if (!payment) throw new Error('Payment not found');

    // Check permissions
    if (userRole === 'TENANT' && payment.tenantId !== userId) {
      throw new Error('Access denied');
    }

    if (userRole === 'LANDLORD' && payment.property.ownerId !== userId) {
      throw new Error('Access denied');
    }

    return await getPrisma().payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        status: updateData.status,
        paidDate: updateData.paidDate,
        method: updateData.method,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        property: true,
        unit: true
      }
    });
  },

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

  // Seed data function
  async seedDatabase() {
    console.log('Seeding database...');

    // Create demo users
    const alice = await this.createUser({
      username: 'alice',
      password: 'password123',
      role: 'LANDLORD',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
    });

    const johnDoe = await this.createUser({
      username: 'john_doe',
      password: 'tenant123',
      role: 'TENANT',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });

    const mikeContractor = await this.createUser({
      username: 'mike_contractor',
      password: 'contractor123',
      role: 'CONTRACTOR',
      firstName: 'Mike',
      lastName: 'Smith',
      email: 'mike@example.com',
    });

    // Create single-family property with tenant info and misc expenses
    const sunsetVillas = await this.createProperty({
      name: 'Sunset Villas',
      address: '123 Main St',
      valuation: 350000,
      ownerId: alice.id,
      type: 'single-family',
      mortgage: {
        amount: 180000,
        monthlyPayment: 1200,
        lender: 'Bank A',
        rate: 3.5,
        term: 30,
        startDate: '2020-01-01',
      },
      taxRate: '1.2',
      rent: 1800,
      tenant: 'John Doe',
      leaseStart: '2024-07-01',
      leaseEnd: '2025-06-30',
      miscExpenses: [
        { label: 'Insurance', amount: 120 },
        { label: 'Maintenance', amount: 80 },
        { label: 'Water', amount: 40 },
      ],
    });

    // Create multi-family property with units
    const oakRidgeApartments = await this.createProperty({
      name: 'Oak Ridge Apartments',
      address: '456 Oak Street',
      valuation: 500000,
      ownerId: alice.id,
      type: 'multi-family',
      mortgage: {
        amount: 250000,
        monthlyPayment: 1500,
        lender: 'Bank B',
        rate: 4.0,
        term: 30,
        startDate: '2020-06-01',
      },
      taxRate: '1.5',
      units: [
        {
          unitNumber: '1A',
          rent: 1200,
        },
        {
          unitNumber: '1B',
          rent: 1300,
        },
        {
          unitNumber: '2A',
          rent: 1400,
        },
        {
          unitNumber: '2B',
          rent: 1500,
        },
      ],
      miscExpenses: [
        { label: 'Property Insurance', amount: 200 },
        { label: 'Landscaping', amount: 150 },
        { label: 'Pool Maintenance', amount: 100 },
      ],
    });

    // Create standalone project
    const kitchenRemodel = await this.createStandaloneProject({
      name: 'Kitchen Remodel',
      description: 'Complete kitchen renovation project',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      budget: 25000,
      location: '123 Main St, Unit 2A',
      ownerId: alice.id,
    });

    console.log('Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Landlord: alice / password123');
    console.log('Tenant: john_doe / tenant123');
    console.log('Contractor: mike_contractor / contractor123');
    console.log('\nSample Properties:');
    console.log('- Sunset Villas (Single Family): $1800/month');
    console.log('- Oak Ridge Apartments (Multi-Family): 4 units with varying rent');
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

  async deleteTenantCascade(tenantId, landlordId) {
    // Only allow if landlord owns at least one property for this tenant
    const tenant = await getPrisma().user.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        tenantUnits: { include: { property: true } },
        leaseAgreements: true,
        payments: true,
        communicationsSent: true,
        communicationsReceived: true,
        tenantDocuments: true,
        uploadedDocuments: true,
        maintenanceRequests: true,
        workOrders: true,
        assignedJobs: true,
      }
    });
    if (!tenant) throw new Error('Tenant not found');
    const ownsAny = tenant.tenantUnits.some(tu => tu.property.ownerId === parseInt(landlordId));
    if (!ownsAny) throw new Error('Access denied');
    
    // Delete all related records in the correct order
    await getPrisma().maintenanceRequest.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().communication.deleteMany({ 
      where: { 
        OR: [
          { senderId: parseInt(tenantId) },
          { receiverId: parseInt(tenantId) }
        ]
      } 
    });
    await getPrisma().tenantDocument.deleteMany({ 
      where: { 
        OR: [
          { tenantId: parseInt(tenantId) },
          { uploadedBy: parseInt(tenantId) }
        ]
      } 
    });
    await getPrisma().workOrder.deleteMany({ 
      where: { 
        OR: [
          { createdById: parseInt(tenantId) },
          { assignedToId: parseInt(tenantId) }
        ]
      } 
    });
    await getPrisma().tenantUnit.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().leaseAgreement.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    await getPrisma().payment.deleteMany({ where: { tenantId: parseInt(tenantId) } });
    
    // Finally delete the user
    await getPrisma().user.delete({ where: { id: parseInt(tenantId) } });
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

  // Lease Document Management
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

  // Cleanup function
  async disconnect() {
    if (prismaClient) {
      await getPrisma().$disconnect();
    }
  },
};

module.exports = { db }; 