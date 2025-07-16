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

async function testFinancialCalculations() {
  console.log('🧪 Testing Financial Calculations\n');

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

  // 2. Test integrated dashboard endpoint
  console.log('2. Testing integrated dashboard endpoint...');
  const dashboardResponse = await makeRequest('GET', '/api/dashboard/integrated', null, token);

  if (!dashboardResponse.ok) {
    throw new Error('Dashboard fetch failed');
  }

  const dashboardData = await dashboardResponse.json();
  console.log('✅ Dashboard data fetched successfully\n');

  // 3. Display financial summary
  console.log('3. Financial Summary:');
  console.log(`   Total Properties: ${dashboardData.summary.totalProperties}`);
  console.log(`   Total Tenants: ${dashboardData.summary.totalTenants}`);
  console.log(`   Active Tenants: ${dashboardData.summary.activeTenants}`);
  console.log(`   Total Monthly Rent: $${dashboardData.summary.totalMonthlyRent.toLocaleString()}`);
  console.log(`   Total Collected: $${dashboardData.summary.totalCollected.toLocaleString()}`);
  console.log(`   Total Outstanding: $${dashboardData.summary.totalOutstanding.toLocaleString()}`);
  console.log(`   Overdue Amount: $${dashboardData.summary.overdueAmount.toLocaleString()}`);
  console.log(`   Overdue Tenants: ${dashboardData.summary.overdueTenants}`);
  console.log(`   Occupancy Rate: ${dashboardData.summary.occupancyRate}%`);
  console.log('');

  // 4. Display property breakdown
  console.log('4. Property Breakdown:');
  dashboardData.properties.forEach((property, index) => {
    console.log(`   Property ${index + 1}: ${property.name}`);
    console.log(`     - Monthly Rent: $${property.totalRent.toLocaleString()}`);
    console.log(`     - Collected: $${property.totalCollected.toLocaleString()}`);
    console.log(`     - Outstanding: $${property.totalOutstanding.toLocaleString()}`);
    console.log(`     - Overdue Tenants: ${property.overdueTenants}`);
    console.log(`     - Tenant Count: ${property.tenantCount}`);
  });
  console.log('');

  // 5. Display rent tracking data
  console.log('5. Rent Tracking Data:');
  dashboardData.rentTracking.forEach((rent, index) => {
    console.log(`   Rent Entry ${index + 1}:`);
    console.log(`     - Tenant: ${rent.tenant}`);
    console.log(`     - Property: ${rent.propertyName}`);
    console.log(`     - Rent: $${rent.rent.toLocaleString()}`);
    console.log(`     - Payments: ${rent.payments.length}`);
    console.log(`     - Paid Payments: ${rent.payments.filter(p => p.paid).length}`);
    console.log(`     - Unpaid Payments: ${rent.payments.filter(p => !p.paid).length}`);
  });
  console.log('');

  console.log('🎉 Financial calculations test completed successfully!');
}

// Run the test
testFinancialCalculations().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}); 