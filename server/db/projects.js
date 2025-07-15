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

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
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
      })),
      costs: project.costs.map(cost => ({
        id: cost.id,
        label: cost.label,
        amount: cost.amount,
        type: cost.type,
        date: cost.date,
      })),
    }));
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

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
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
      })),
      costs: project.costs.map(cost => ({
        id: cost.id,
        label: cost.label,
        amount: cost.amount,
        type: cost.type,
        date: cost.date,
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
    return await getPrisma().projectJob.create({
      data: {
        name: jobData.name,
        description: jobData.description,
        status: jobData.status || 'PENDING',
        priority: jobData.priority || 'MEDIUM',
        startDate: jobData.startDate ? new Date(jobData.startDate) : null,
        endDate: jobData.endDate ? new Date(jobData.endDate) : null,
        assignedTo: jobData.assignedTo,
        laborCost: jobData.laborCost ? Number(jobData.laborCost) : null,
        materialCost: jobData.materialCost ? Number(jobData.materialCost) : null,
        projectId: parseInt(jobData.projectId),
      },
    });
  },

  async updateProjectJob(jobId, jobData) {
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
        laborCost: jobData.laborCost ? Number(jobData.laborCost) : null,
        materialCost: jobData.materialCost ? Number(jobData.materialCost) : null,
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
    return await getPrisma().projectCost.create({
      data: {
        label: costData.label,
        amount: Number(costData.amount),
        type: costData.type,
        date: costData.date ? new Date(costData.date) : new Date(),
        projectId: parseInt(costData.projectId),
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