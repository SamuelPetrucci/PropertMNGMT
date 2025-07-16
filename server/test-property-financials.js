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

async function testPropertyFinancials() {
  console.log('🧪 Testing Property Financial Calculations\n');

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

  // 3. Display property financial data
  console.log('3. Property Financial Data:');
  dashboardData.properties.forEach((property, index) => {
    console.log(`\n   Property ${index + 1}: ${property.name}`);
    console.log(`     Address: ${property.address}`);
    console.log(`     Type: ${property.type}`);
    console.log(`     Units: ${property.units?.length || 1}`);
    console.log(`     Monthly Rent: $${property.totalRent.toLocaleString()}`);
    console.log(`     Collected: $${property.totalCollected.toLocaleString()}`);
    console.log(`     Outstanding: $${property.totalOutstanding.toLocaleString()}`);
    console.log(`     Overdue Tenants: ${property.overdueTenants}`);
    console.log(`     Active Tenants: ${property.tenantCount}`);
    console.log(`     Occupancy Rate: ${property.units?.length > 0 ? ((property.tenantCount / property.units.length) * 100).toFixed(1) : '0'}%`);
  });
  console.log('');

  // 4. Display rent tracking data
  console.log('4. Rent Tracking Data:');
  dashboardData.rentTracking.forEach((rent, index) => {
    console.log(`\n   Rent Entry ${index + 1}:`);
    console.log(`     Tenant: ${rent.tenant}`);
    console.log(`     Property: ${rent.propertyName}`);
    console.log(`     Rent: $${rent.rent.toLocaleString()}`);
    console.log(`     Payments: ${rent.payments.length}`);
    console.log(`     Paid Payments: ${rent.payments.filter(p => p.status === 'PAID').length}`);
    console.log(`     Unpaid Payments: ${rent.payments.filter(p => p.status !== 'PAID').length}`);
    console.log(`     Overdue Payments: ${rent.payments.filter(p => p.status !== 'PAID' && new Date(p.dueDate) < new Date()).length}`);
  });
  console.log('');

  // 5. Display tenant data
  console.log('5. Tenant Data:');
  dashboardData.tenants.forEach((tenant, index) => {
    console.log(`\n   Tenant ${index + 1}: ${tenant.firstName} ${tenant.lastName}`);
    console.log(`     Email: ${tenant.email}`);
    console.log(`     Status: ${tenant.status}`);
    console.log(`     Has Active Lease: ${tenant.hasActiveLease}`);
    console.log(`     Payments: ${tenant.payments?.length || 0}`);
  });
  console.log('');

  // 6. Check if we need to create sample data
  const hasPayments = dashboardData.rentTracking.some(rent => rent.payments.length > 0);
  const hasTenants = dashboardData.tenants.length > 0;
  
  console.log('6. Data Status:');
  console.log(`   Properties: ${dashboardData.properties.length}`);
  console.log(`   Tenants: ${dashboardData.tenants.length}`);
  console.log(`   Rent Entries: ${dashboardData.rentTracking.length}`);
  console.log(`   Has Payments: ${hasPayments}`);
  console.log(`   Has Tenants: ${hasTenants}`);
  
  if (!hasPayments) {
    console.log('\n⚠️  No payments found. You may need to create sample payments to see financial data.');
  }
  
  if (!hasTenants) {
    console.log('\n⚠️  No tenants found. You may need to create tenants and assign them to properties.');
  }

  console.log('\n🎉 Property financial calculations test completed successfully!');
}

// Run the test
testPropertyFinancials().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}); 