const fetch = require('node-fetch');

async function testApiCalls() {
  try {
    console.log('=== Testing API Calls ===\n');
    
    // Test 1: Root endpoint
    console.log('--- Test 1: Root endpoint ---');
    const rootResponse = await fetch('http://localhost:5000/');
    console.log('Root response status:', rootResponse.status);
    const rootData = await rootResponse.json();
    console.log('Root response:', rootData);
    
    // Test 2: Login to get a token
    console.log('\n--- Test 2: Login ---');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'alice',
        password: 'password123'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      console.log('✅ Login successful, got token');
      
      // Test 3: Create property
      console.log('\n--- Test 3: Create property ---');
      const createResponse = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          name: 'API Test Property',
          address: '123 API Test St',
          valuation: 250000,
          type: 'single-family',
          mortgage: {
            amount: 150000,
            monthlyPayment: 1000,
            lender: 'Test Bank',
            rate: 3.5,
            term: 30,
            startDate: '2020-01-01'
          },
          taxRate: '1.0'
        })
      });
      
      console.log('Create property response status:', createResponse.status);
      const createData = await createResponse.json();
      console.log('Create property response:', createData);
      
      if (createData.id) {
        console.log('✅ Property created successfully');
        
        // Test 4: Update property
        console.log('\n--- Test 4: Update property ---');
        const updateResponse = await fetch(`http://localhost:5000/api/properties/${createData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          },
          body: JSON.stringify({
            name: 'Updated API Test Property',
            address: '456 Updated API Test St',
            valuation: 275000,
            type: 'single-family',
            mortgage: {
              amount: 160000,
              monthlyPayment: 1100,
              lender: 'Updated Test Bank',
              rate: 3.8,
              term: 30,
              startDate: '2020-01-01'
            },
            taxRate: '1.1'
          })
        });
        
        console.log('Update property response status:', updateResponse.status);
        const updateData = await updateResponse.json();
        console.log('Update property response:', updateData);
        
        console.log('✅ Property updated successfully');
      }
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error during API testing:', error.message);
  }
}

testApiCalls(); 