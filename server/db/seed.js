const { getPrisma } = require('./connection');
const users = require('./users');
const properties = require('./properties');
const projects = require('./projects');

const seed = {
  async seedDatabase() {
    console.log('Seeding database...');

    // Create demo users
    const alice = await users.createUser({
      username: 'alice',
      password: 'password123',
      role: 'LANDLORD',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
    });

    const johnDoe = await users.createUser({
      username: 'john_doe',
      password: 'tenant123',
      role: 'TENANT',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });

    const mikeContractor = await users.createUser({
      username: 'mike_contractor',
      password: 'contractor123',
      role: 'CONTRACTOR',
      firstName: 'Mike',
      lastName: 'Smith',
      email: 'mike@example.com',
    });

    // Create single-family property with tenant info and misc expenses
    const sunsetVillas = await properties.createProperty({
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
    const oakRidgeApartments = await properties.createProperty({
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
    const kitchenRemodel = await projects.createStandaloneProject({
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
};

module.exports = seed; 