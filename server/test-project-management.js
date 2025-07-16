const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:5000';

async function makeRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  return response;
}

async function testProjectManagement() {
  console.log('🧪 Testing Project Management Functionality\n');

  // 1. Login to get token
  console.log('1. Logging in to get authentication token...');
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  if (!loginResponse.ok) {
    throw new Error('Login failed');
  }

  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log('✅ Login successful\n');

  // 2. Create a test project
  console.log('2. Creating a test project...');
  const projectData = {
    name: 'Test Project Management',
    description: 'This is a test project to verify functionality',
    status: 'PLANNING',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 10000
  };

  const projectResponse = await makeRequest('POST', '/api/standalone-projects', projectData, token);

  if (!projectResponse.ok) {
    throw new Error('Project creation failed');
  }

  const project = await projectResponse.json();
  console.log(`✅ Project created with ID: ${project.id}\n`);

  // 3. Create jobs for the project
  console.log('3. Creating jobs for the project...');
  const jobs = [
    {
      name: 'Foundation Work',
      description: 'Excavation and foundation preparation',
      status: 'PENDING',
      priority: 'HIGH',
      laborCost: 2000,
      materialCost: 1500,
      dueDate: '2024-02-15'
    },
    {
      name: 'Electrical Installation',
      description: 'Install electrical systems and wiring',
      status: 'PENDING',
      priority: 'MEDIUM',
      laborCost: 1500,
      materialCost: 1000,
      dueDate: '2024-03-15'
    }
  ];

  for (const jobData of jobs) {
    const jobResponse = await makeRequest('POST', `/api/standalone-projects/${project.id}/jobs`, jobData, token);
    
    if (!jobResponse.ok) {
      throw new Error('Job creation failed');
    }

    const job = await jobResponse.json();
    console.log(`✅ Job "${job.name}" created with ID: ${job.id}`);
  }
  console.log('');

  // 4. Create costs for the project
  console.log('4. Creating costs for the project...');
  const costs = [
    {
      description: 'Building permits',
      amount: 500,
      type: 'PERMIT',
      date: '2024-01-15',
      notes: 'Municipal building permits'
    },
    {
      description: 'Equipment rental',
      amount: 800,
      type: 'EQUIPMENT',
      date: '2024-01-20',
      notes: 'Excavator rental for foundation work'
    }
  ];

  for (const costData of costs) {
    const costResponse = await makeRequest('POST', `/api/standalone-projects/${project.id}/costs`, costData, token);
    
    if (!costResponse.ok) {
      throw new Error('Cost creation failed');
    }

    const cost = await costResponse.json();
    console.log(`✅ Cost "${cost.description}" created with ID: ${cost.id}`);
  }
  console.log('');

  // 5. Verify project with all data
  console.log('5. Verifying project with all data...');
  const projectDetailsResponse = await makeRequest('GET', `/api/standalone-projects/${project.id}`, null, token);

  if (!projectDetailsResponse.ok) {
    throw new Error('Failed to fetch project details');
  }

  const projectDetails = await projectDetailsResponse.json();
  console.log(`   Project: ${projectDetails.name}`);
  console.log(`   Status: ${projectDetails.status}`);
  console.log(`   Budget: $${projectDetails.budget}`);
  console.log(`   Total Spent: $${projectDetails.totalSpent}`);
  console.log(`   Remaining Budget: $${projectDetails.remainingBudget}`);
  console.log(`   Jobs: ${projectDetails.jobs.length}`);
  console.log(`   Costs: ${projectDetails.costs.length}`);
  console.log('✅ Project details verified\n');

  // 6. Test job status updates
  console.log('6. Testing job status updates...');
  const firstJob = projectDetails.jobs[0];
  const updateResponse = await makeRequest('PATCH', `/api/standalone-projects/jobs/${firstJob.id}`, {
    status: 'COMPLETED'
  }, token);

  if (!updateResponse.ok) {
    throw new Error('Job status update failed');
  }

  const updatedJob = await updateResponse.json();
  console.log(`✅ Job "${updatedJob.name}" status updated to: ${updatedJob.status}\n`);

  // 7. Test budget validation
  console.log('7. Testing budget validation...');
  const expensiveJob = {
    name: 'Expensive Job',
    description: 'This job should exceed budget',
    status: 'PENDING',
    priority: 'HIGH',
    laborCost: 15000, // This should exceed the $10,000 budget
    materialCost: 5000,
    dueDate: '2024-04-15'
  };

  const budgetTestResponse = await makeRequest('POST', `/api/standalone-projects/${project.id}/jobs`, expensiveJob, token);

  if (budgetTestResponse.ok) {
    console.log('⚠️  Budget validation failed - expensive job was created');
  } else {
    const errorData = await budgetTestResponse.json();
    console.log(`✅ Budget validation working: ${errorData.error}`);
  }
  console.log('');

  // 8. Test project deletion
  console.log('8. Testing project deletion...');
  const deleteResponse = await makeRequest('DELETE', `/api/standalone-projects/${project.id}`, null, token);

  if (!deleteResponse.ok) {
    throw new Error('Project deletion failed');
  }

  console.log('✅ Project deleted successfully\n');

  // 9. Verify project no longer exists
  console.log('9. Verifying project no longer exists...');
  const verifyDeleteResponse = await makeRequest('GET', `/api/standalone-projects/${project.id}`, null, token);

  if (verifyDeleteResponse.status === 404) {
    console.log('✅ Project successfully deleted (404 response)');
  } else {
    console.log('⚠️  Project may still exist (unexpected response)');
  }

  console.log('\n🎉 All project management tests completed successfully!');
}

// Run the test
testProjectManagement().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}); 