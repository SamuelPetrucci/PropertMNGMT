const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Enhanced maintenance requests with integrated data
async function getMaintenanceRequests(userId, userRole) {
  try {
    let requests;
    
    if (userRole === 'TENANT') {
      // Tenants can only see their own requests
      requests = await prisma.maintenanceRequest.findMany({
        where: { tenantId: userId },
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          property: {
            select: { id: true, name: true, address: true }
          },
          unit: {
            select: { id: true, name: true, number: true }
          },
          workOrder: {
            include: {
              assignedTo: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'LANDLORD') {
      // Landlords can see all requests for their properties
      const landlordProperties = await prisma.property.findMany({
        where: { landlordId: userId },
        select: { id: true }
      });
      
      const propertyIds = landlordProperties.map(p => p.id);
      
      requests = await prisma.maintenanceRequest.findMany({
        where: { propertyId: { in: propertyIds } },
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          property: {
            select: { id: true, name: true, address: true }
          },
          unit: {
            select: { id: true, name: true, number: true }
          },
          workOrder: {
            include: {
              assignedTo: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'CONTRACTOR') {
      // Contractors can see requests assigned to them
      requests = await prisma.maintenanceRequest.findMany({
        where: {
          workOrder: {
            assignedToId: userId
          }
        },
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          property: {
            select: { id: true, name: true, address: true }
          },
          unit: {
            select: { id: true, name: true, number: true }
          },
          workOrder: {
            include: {
              assignedTo: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    return requests || [];
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    throw error;
  }
}

async function createMaintenanceRequest(requestData) {
  try {
    const request = await prisma.maintenanceRequest.create({
      data: {
        tenantId: requestData.tenantId,
        propertyId: requestData.propertyId,
        unitId: requestData.unitId || null,
        title: requestData.title,
        description: requestData.description,
        category: requestData.category,
        priority: requestData.priority,
        status: 'OPEN',
        images: requestData.images ? JSON.stringify(requestData.images) : null
      },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        property: {
          select: { id: true, name: true, address: true }
        },
        unit: {
          select: { id: true, name: true, number: true }
        }
      }
    });
    
    return request;
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }
}

async function updateMaintenanceRequest(requestId, updateData, userId, userRole) {
  try {
    // Verify user has permission to update this request
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: { property: true }
    });
    
    if (!request) {
      throw new Error('Maintenance request not found');
    }
    
    // Check permissions
    if (userRole === 'TENANT' && request.tenantId !== userId) {
      throw new Error('Access denied');
    }
    
    if (userRole === 'LANDLORD' && request.property.landlordId !== userId) {
      throw new Error('Access denied');
    }
    
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        title: updateData.title,
        description: updateData.description,
        category: updateData.category,
        priority: updateData.priority,
        status: updateData.status,
        images: updateData.images ? JSON.stringify(updateData.images) : request.images
      },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        property: {
          select: { id: true, name: true, address: true }
        },
        unit: {
          select: { id: true, name: true, number: true }
        },
        workOrder: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    
    return updatedRequest;
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    throw error;
  }
}

// Enhanced work orders with contractor integration
async function getWorkOrders(userId, userRole) {
  try {
    let workOrders;
    
    if (userRole === 'LANDLORD') {
      // Landlords can see all work orders for their properties
      const landlordProperties = await prisma.property.findMany({
        where: { landlordId: userId },
        select: { id: true }
      });
      
      const propertyIds = landlordProperties.map(p => p.id);
      
      workOrders = await prisma.workOrder.findMany({
        where: { propertyId: { in: propertyIds } },
        include: {
          property: {
            select: { id: true, name: true, address: true }
          },
          unit: {
            select: { id: true, name: true, number: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          maintenanceRequest: {
            include: {
              tenant: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'CONTRACTOR') {
      // Contractors can see work orders assigned to them
      workOrders = await prisma.workOrder.findMany({
        where: { assignedToId: userId },
        include: {
          property: {
            select: { id: true, name: true, address: true }
          },
          unit: {
            select: { id: true, name: true, number: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          maintenanceRequest: {
            include: {
              tenant: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    return workOrders || [];
  } catch (error) {
    console.error('Error fetching work orders:', error);
    throw error;
  }
}

async function createWorkOrder(workOrderData) {
  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        propertyId: workOrderData.propertyId,
        unitId: workOrderData.unitId || null,
        title: workOrderData.title,
        description: workOrderData.description,
        priority: workOrderData.priority,
        status: 'OPEN',
        estimatedCost: workOrderData.estimatedCost ? parseFloat(workOrderData.estimatedCost) : null,
        estimatedDuration: workOrderData.estimatedDuration ? parseInt(workOrderData.estimatedDuration) : null,
        assignedToId: workOrderData.assignedToId || null,
        createdById: workOrderData.createdById,
        maintenanceRequestId: workOrderData.maintenanceRequestId || null
      },
      include: {
        property: {
          select: { id: true, name: true, address: true }
        },
        unit: {
          select: { id: true, name: true, number: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        maintenanceRequest: {
          include: {
            tenant: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    
    return workOrder;
  } catch (error) {
    console.error('Error creating work order:', error);
    throw error;
  }
}

async function updateWorkOrder(workOrderId, updateData, userId, userRole) {
  try {
    // Verify user has permission to update this work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(workOrderId) },
      include: { property: true }
    });
    
    if (!workOrder) {
      throw new Error('Work order not found');
    }
    
    // Check permissions
    if (userRole === 'LANDLORD' && workOrder.property.landlordId !== userId) {
      throw new Error('Access denied');
    }
    
    if (userRole === 'CONTRACTOR' && workOrder.assignedToId !== userId) {
      throw new Error('Access denied');
    }
    
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(workOrderId) },
      data: {
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority,
        status: updateData.status,
        estimatedCost: updateData.estimatedCost ? parseFloat(updateData.estimatedCost) : workOrder.estimatedCost,
        actualCost: updateData.actualCost ? parseFloat(updateData.actualCost) : workOrder.actualCost,
        estimatedDuration: updateData.estimatedDuration ? parseInt(updateData.estimatedDuration) : workOrder.estimatedDuration,
        actualDuration: updateData.actualDuration ? parseInt(updateData.actualDuration) : workOrder.actualDuration,
        notes: updateData.notes,
        completedAt: updateData.status === 'COMPLETED' ? new Date() : workOrder.completedAt
      },
      include: {
        property: {
          select: { id: true, name: true, address: true }
        },
        unit: {
          select: { id: true, name: true, number: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        maintenanceRequest: {
          include: {
            tenant: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    
    return updatedWorkOrder;
  } catch (error) {
    console.error('Error updating work order:', error);
    throw error;
  }
}

async function assignWorkOrder(workOrderId, assignData, userId) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(workOrderId) },
      include: { property: true }
    });
    
    if (!workOrder) {
      throw new Error('Work order not found');
    }
    
    // Only landlords can assign work orders
    if (workOrder.property.landlordId !== userId) {
      throw new Error('Access denied');
    }
    
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(workOrderId) },
      data: {
        assignedToId: assignData.assignedToId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        notes: assignData.notes
      },
      include: {
        property: {
          select: { id: true, name: true, address: true }
        },
        unit: {
          select: { id: true, name: true, number: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        maintenanceRequest: {
          include: {
            tenant: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    
    return updatedWorkOrder;
  } catch (error) {
    console.error('Error assigning work order:', error);
    throw error;
  }
}

// Contractor management
async function getContractors() {
  try {
    const contractors = await prisma.user.findMany({
      where: { role: 'CONTRACTOR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialties: true,
        hourlyRate: true,
        isAvailable: true
      },
      orderBy: { firstName: 'asc' }
    });
    
    return contractors;
  } catch (error) {
    console.error('Error fetching contractors:', error);
    throw error;
  }
}

async function createContractor(contractorData) {
  try {
    const contractor = await prisma.user.create({
      data: {
        username: contractorData.email,
        email: contractorData.email,
        firstName: contractorData.firstName,
        lastName: contractorData.lastName,
        phone: contractorData.phone,
        role: 'CONTRACTOR',
        specialties: contractorData.specialties || [],
        hourlyRate: contractorData.hourlyRate ? parseFloat(contractorData.hourlyRate) : null,
        isAvailable: contractorData.isAvailable !== false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialties: true,
        hourlyRate: true,
        isAvailable: true
      }
    });
    
    return contractor;
  } catch (error) {
    console.error('Error creating contractor:', error);
    throw error;
  }
}

// Maintenance communication system
async function createMaintenanceCommunication(communicationData) {
  try {
    const communication = await prisma.communication.create({
      data: {
        senderId: communicationData.senderId,
        receiverId: communicationData.receiverId,
        subject: communicationData.subject,
        message: communicationData.message,
        type: communicationData.type || 'MESSAGE',
        priority: communicationData.priority || 'MEDIUM',
        relatedTo: communicationData.relatedTo, // Request ID or Work Order ID
        status: 'UNREAD'
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
    
    return communication;
  } catch (error) {
    console.error('Error creating maintenance communication:', error);
    throw error;
  }
}

async function getMaintenanceCommunications(requestId, userId, userRole) {
  try {
    let communications;
    
    if (userRole === 'TENANT') {
      // Tenants can see communications related to their requests
      communications = await prisma.communication.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          relatedTo: requestId
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } else if (userRole === 'LANDLORD') {
      // Landlords can see all communications for their properties
      communications = await prisma.communication.findMany({
        where: { relatedTo: requestId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } else if (userRole === 'CONTRACTOR') {
      // Contractors can see communications related to their work orders
      communications = await prisma.communication.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          relatedTo: requestId
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    }
    
    return communications || [];
  } catch (error) {
    console.error('Error fetching maintenance communications:', error);
    throw error;
  }
}

// Maintenance analytics and reporting
async function getMaintenanceAnalytics(landlordId) {
  try {
    // Get all properties for the landlord
    const properties = await prisma.property.findMany({
      where: { landlordId },
      select: { id: true, name: true }
    });
    
    const propertyIds = properties.map(p => p.id);
    
    // Get maintenance requests for these properties
    const requests = await prisma.maintenanceRequest.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: { select: { id: true, name: true } },
        workOrder: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });
    
    // Calculate analytics
    const totalRequests = requests.length;
    const openRequests = requests.filter(r => r.status === 'OPEN').length;
    const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS').length;
    const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;
    
    const urgentRequests = requests.filter(r => r.priority === 'URGENT').length;
    const highPriorityRequests = requests.filter(r => r.priority === 'HIGH').length;
    
    // Category breakdown
    const categoryBreakdown = {};
    requests.forEach(request => {
      categoryBreakdown[request.category] = (categoryBreakdown[request.category] || 0) + 1;
    });
    
    // Property breakdown
    const propertyBreakdown = properties.map(property => {
      const propertyRequests = requests.filter(r => r.propertyId === property.id);
      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRequests: propertyRequests.length,
        openRequests: propertyRequests.filter(r => r.status === 'OPEN').length,
        completedRequests: propertyRequests.filter(r => r.status === 'COMPLETED').length,
        urgentRequests: propertyRequests.filter(r => r.priority === 'URGENT').length
      };
    });
    
    // Contractor performance
    const contractorWorkOrders = await prisma.workOrder.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } }
      }
    });
    
    const contractorPerformance = {};
    contractorWorkOrders.forEach(wo => {
      if (wo.assignedTo) {
        const contractorId = wo.assignedTo.id;
        if (!contractorPerformance[contractorId]) {
          contractorPerformance[contractorId] = {
            contractor: wo.assignedTo,
            totalAssigned: 0,
            completed: 0,
            inProgress: 0
          };
        }
        contractorPerformance[contractorId].totalAssigned++;
        if (wo.status === 'COMPLETED') {
          contractorPerformance[contractorId].completed++;
        } else if (wo.status === 'IN_PROGRESS') {
          contractorPerformance[contractorId].inProgress++;
        }
      }
    });
    
    // Convert to array and calculate completion rates
    const contractorPerformanceArray = Object.values(contractorPerformance).map(cp => ({
      ...cp,
      completionRate: cp.totalAssigned > 0 ? (cp.completed / cp.totalAssigned * 100).toFixed(1) : 0
    }));
    
    return {
      summary: {
        totalRequests,
        openRequests,
        inProgressRequests,
        completedRequests,
        urgentRequests,
        highPriorityRequests
      },
      categoryBreakdown,
      propertyBreakdown,
      contractorPerformance: contractorPerformanceArray
    };
  } catch (error) {
    console.error('Error fetching maintenance analytics:', error);
    throw error;
  }
}

module.exports = {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  assignWorkOrder,
  getContractors,
  createContractor,
  createMaintenanceCommunication,
  getMaintenanceCommunications,
  getMaintenanceAnalytics
}; 