const { getPrisma } = require('./connection');

const projects = {
  // Standalone Project operations
  async getStandaloneProjects() {
    const projects = await getPrisma().standaloneProject.findMany({
      include: {
        jobs: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        costs: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return projects.map(project => {
      // Calculate total spent from costs and job costs
      const totalCosts = project.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const totalJobCosts = project.jobs.reduce((sum, job) => {
        const laborCost = job.laborCost || 0;
        const materialCost = job.materialCost || 0;
        return sum + laborCost + materialCost;
      }, 0);
      const totalSpent = totalCosts + totalJobCosts;
      const remainingBudget = project.budget ? project.budget - totalSpent : null;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        totalSpent: totalSpent,
        remainingBudget: remainingBudget,
        location: project.location,
        jobs: project.jobs.map(job => ({
          id: job.id,
          name: job.name,
          description: job.description,
          status: job.status,
          priority: job.priority,
          startDate: job.startDate,
          endDate: job.endDate,
          assignedTo: job.assignedTo,
          laborCost: job.laborCost,
          materialCost: job.materialCost,
          estimatedCost: (job.laborCost || 0) + (job.materialCost || 0),
        })),
        costs: project.costs.map(cost => ({
          id: cost.id,
          description: cost.description,
          amount: cost.amount,
          type: cost.type,
          date: cost.date,
          jobId: cost.jobId,
        })),
      };
    });
  },

  async getStandaloneProjectById(projectId) {
    const project = await getPrisma().standaloneProject.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        jobs: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        costs: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) return null;

    // Calculate total spent from costs and job costs
    const totalCosts = project.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalJobCosts = project.jobs.reduce((sum, job) => {
      const laborCost = job.laborCost || 0;
      const materialCost = job.materialCost || 0;
      return sum + laborCost + materialCost;
    }, 0);
    const totalSpent = totalCosts + totalJobCosts;
    const remainingBudget = project.budget ? project.budget - totalSpent : null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      totalSpent: totalSpent,
      remainingBudget: remainingBudget,
      location: project.location,
      jobs: project.jobs.map(job => ({
        id: job.id,
        name: job.name,
        description: job.description,
        status: job.status,
        priority: job.priority,
        startDate: job.startDate,
        endDate: job.endDate,
        assignedTo: job.assignedTo,
        laborCost: job.laborCost,
        materialCost: job.materialCost,
        estimatedCost: (job.laborCost || 0) + (job.materialCost || 0),
      })),
      costs: project.costs.map(cost => ({
        id: cost.id,
        description: cost.description,
        amount: cost.amount,
        type: cost.type,
        date: cost.date,
        jobId: cost.jobId,
      })),
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
        startDate: projectData.startDate ? new Date(projectData.startDate) : null,
        endDate: projectData.endDate ? new Date(projectData.endDate) : null,
        budget: projectData.budget ? Number(projectData.budget) : null,
        location: projectData.location,
      },
    });
  },

  async deleteStandaloneProject(projectId) {
    // Delete related records first
    await getPrisma().projectCost.deleteMany({
      where: { projectId: parseInt(projectId) }
    });
    await getPrisma().projectJob.deleteMany({
      where: { projectId: parseInt(projectId) }
    });
    return await getPrisma().standaloneProject.delete({
      where: { id: parseInt(projectId) }
    });
  },

  // Project Job operations
  async getProjectJobs(projectId) {
    return await getPrisma().projectJob.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createProjectJob(jobData) {
    // Get project to check budget
    const project = await getPrisma().standaloneProject.findUnique({
      where: { id: parseInt(jobData.projectId) },
      include: {
        costs: true,
        jobs: true
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate current total spent
    const totalCosts = project.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalJobCosts = project.jobs.reduce((sum, job) => {
      const laborCost = job.laborCost || 0;
      const materialCost = job.materialCost || 0;
      return sum + laborCost + materialCost;
    }, 0);
    const currentTotalSpent = totalCosts + totalJobCosts;
    const newLaborCost = jobData.laborCost ? Number(jobData.laborCost) : 0;
    const newMaterialCost = jobData.materialCost ? Number(jobData.materialCost) : 0;
    const newJobTotalCost = newLaborCost + newMaterialCost;

    // Check if adding this job would exceed budget
    if (project.budget && (currentTotalSpent + newJobTotalCost) > project.budget) {
      throw new Error(`Adding this job ($${newJobTotalCost} total cost) would exceed the project budget of $${project.budget}. Current total spent: $${currentTotalSpent}`);
    }

    return await getPrisma().projectJob.create({
      data: {
        name: jobData.name,
        description: jobData.description,
        status: jobData.status || 'PENDING',
        priority: jobData.priority || 'MEDIUM',
        startDate: jobData.startDate ? new Date(jobData.startDate) : null,
        endDate: jobData.endDate ? new Date(jobData.endDate) : null,
        assignedTo: jobData.assignedTo,
        laborCost: newLaborCost || null,
        materialCost: newMaterialCost || null,
        projectId: parseInt(jobData.projectId),
      },
    });
  },

  async updateProjectJob(jobId, jobData) {
    // If updating costs, check budget constraints
    if (jobData.laborCost !== undefined || jobData.materialCost !== undefined) {
      const job = await getPrisma().projectJob.findUnique({
        where: { id: parseInt(jobId) },
        include: {
          project: {
            include: {
              costs: true,
              jobs: true
            }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      const project = job.project;
      const totalCosts = project.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const totalJobCosts = project.jobs.reduce((sum, existingJob) => {
        if (existingJob.id === parseInt(jobId)) {
          // Skip the current job being updated
          return sum;
        }
        const laborCost = existingJob.laborCost || 0;
        const materialCost = existingJob.materialCost || 0;
        return sum + laborCost + materialCost;
      }, 0);

      const newLaborCost = jobData.laborCost !== undefined ? Number(jobData.laborCost) : (job.laborCost || 0);
      const newMaterialCost = jobData.materialCost !== undefined ? Number(jobData.materialCost) : (job.materialCost || 0);
      const newJobTotalCost = newLaborCost + newMaterialCost;
      const currentTotalSpent = totalCosts + totalJobCosts + newJobTotalCost;

      if (project.budget && currentTotalSpent > project.budget) {
        throw new Error(`Updating this job would exceed the project budget of $${project.budget}. Total cost would be: $${currentTotalSpent}`);
      }
    }

    return await getPrisma().projectJob.update({
      where: { id: parseInt(jobId) },
      data: {
        name: jobData.name,
        description: jobData.description,
        status: jobData.status,
        priority: jobData.priority,
        startDate: jobData.startDate ? new Date(jobData.startDate) : null,
        endDate: jobData.endDate ? new Date(jobData.endDate) : null,
        assignedTo: jobData.assignedTo,
        laborCost: jobData.laborCost !== undefined ? Number(jobData.laborCost) : undefined,
        materialCost: jobData.materialCost !== undefined ? Number(jobData.materialCost) : undefined,
      },
    });
  },

  async deleteProjectJob(jobId) {
    return await getPrisma().projectJob.delete({
      where: { id: parseInt(jobId) }
    });
  },

  // Project Cost operations
  async getProjectCosts(projectId) {
    return await getPrisma().projectCost.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createProjectCost(costData) {
    // Get project to check budget
    const project = await getPrisma().standaloneProject.findUnique({
      where: { id: parseInt(costData.projectId) },
      include: {
        costs: true,
        jobs: true
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate current total spent
    const totalCosts = project.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalJobCosts = project.jobs.reduce((sum, job) => {
      const laborCost = job.laborCost || 0;
      const materialCost = job.materialCost || 0;
      return sum + laborCost + materialCost;
    }, 0);
    const currentTotalSpent = totalCosts + totalJobCosts;
    const newCostAmount = Number(costData.amount);

    // Check if adding this cost would exceed budget
    if (project.budget && (currentTotalSpent + newCostAmount) > project.budget) {
      throw new Error(`Adding this cost ($${newCostAmount}) would exceed the project budget of $${project.budget}. Current total spent: $${currentTotalSpent}`);
    }

    return await getPrisma().projectCost.create({
      data: {
        description: costData.description || costData.label, // Support both field names
        amount: newCostAmount,
        type: costData.type,
        date: costData.date ? new Date(costData.date) : new Date(),
        projectId: parseInt(costData.projectId),
        jobId: costData.jobId ? parseInt(costData.jobId) : null,
      },
    });
  },

  async deleteProjectCost(costId) {
    return await getPrisma().projectCost.delete({
      where: { id: parseInt(costId) }
    });
  },
};

module.exports = projects; 