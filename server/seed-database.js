const { db } = require('./db');

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  const { getPrisma } = require('./db/connection');
  
  // Delete in reverse order of dependencies
  await getPrisma().maintenanceRequest.deleteMany({});
  await getPrisma().communication.deleteMany({});
  await getPrisma().tenantDocument.deleteMany({});
  await getPrisma().workOrder.deleteMany({});
  await getPrisma().tenantUnit.deleteMany({});
  await getPrisma().leaseAgreement.deleteMany({});
  await getPrisma().payment.deleteMany({});
  await getPrisma().projectCost.deleteMany({});
  await getPrisma().projectJob.deleteMany({});
  await getPrisma().standaloneProject.deleteMany({});
  await getPrisma().projectTask.deleteMany({});
  await getPrisma().project.deleteMany({});
  await getPrisma().miscExpense.deleteMany({});
  await getPrisma().unit.deleteMany({});
  await getPrisma().property.deleteMany({});
  await getPrisma().user.deleteMany({});
  
  console.log('✅ Database cleared successfully!');
}

async function seedDatabase() {
  // Move prisma initialization to the top
  const { getPrisma } = require('./db/connection');
  const prisma = getPrisma();
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // Clear existing data first
    await clearDatabase();

    // Create multiple property owners (landlords)
    console.log('👥 Creating property owners...');
    
    const landlords = [
      {
        username: 'alice_landlord',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0101'
      },
      {
        username: 'bob_landlord',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '555-0102'
      },
      {
        username: 'carol_landlord',
        firstName: 'Carol',
        lastName: 'Williams',
        email: 'carol@example.com',
        phone: '555-0103'
      },
      {
        username: 'david_landlord',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        phone: '555-0104'
      },
      {
        username: 'emma_landlord',
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma@example.com',
        phone: '555-0105'
      }
    ];

    const createdLandlords = [];
    for (const landlord of landlords) {
      const createdLandlord = await db.createUser({
        username: landlord.username,
        password: 'password123',
        role: 'LANDLORD',
        firstName: landlord.firstName,
        lastName: landlord.lastName,
        email: landlord.email,
        phone: landlord.phone
      });
      createdLandlords.push(createdLandlord);
    }

    // Create tenants with realistic data
    console.log('🏠 Creating tenants...');
    
    const tenants = [
      { username: 'john_doe', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-0201' },
      { username: 'jane_smith', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '555-0202' },
      { username: 'mike_wilson', firstName: 'Mike', lastName: 'Wilson', email: 'mike@example.com', phone: '555-0203' },
      { username: 'sarah_jones', firstName: 'Sarah', lastName: 'Jones', email: 'sarah@example.com', phone: '555-0204' },
      { username: 'tom_brown', firstName: 'Tom', lastName: 'Brown', email: 'tom@example.com', phone: '555-0205' },
      { username: 'lisa_davis', firstName: 'Lisa', lastName: 'Davis', email: 'lisa@example.com', phone: '555-0206' },
      { username: 'james_miller', firstName: 'James', lastName: 'Miller', email: 'james@example.com', phone: '555-0207' },
      { username: 'emily_garcia', firstName: 'Emily', lastName: 'Garcia', email: 'emily@example.com', phone: '555-0208' },
      { username: 'robert_rodriguez', firstName: 'Robert', lastName: 'Rodriguez', email: 'robert@example.com', phone: '555-0209' },
      { username: 'jennifer_martinez', firstName: 'Jennifer', lastName: 'Martinez', email: 'jennifer@example.com', phone: '555-0210' },
      { username: 'michael_anderson', firstName: 'Michael', lastName: 'Anderson', email: 'michael@example.com', phone: '555-0211' },
      { username: 'amanda_taylor', firstName: 'Amanda', lastName: 'Taylor', email: 'amanda@example.com', phone: '555-0212' },
      { username: 'chris_lee', firstName: 'Chris', lastName: 'Lee', email: 'chris@example.com', phone: '555-0213' },
      { username: 'jessica_white', firstName: 'Jessica', lastName: 'White', email: 'jessica@example.com', phone: '555-0214' },
      { username: 'daniel_clark', firstName: 'Daniel', lastName: 'Clark', email: 'daniel@example.com', phone: '555-0215' },
      { username: 'ashley_martin', firstName: 'Ashley', lastName: 'Martin', email: 'ashley@example.com', phone: '555-0216' },
      { username: 'kevin_thompson', firstName: 'Kevin', lastName: 'Thompson', email: 'kevin@example.com', phone: '555-0217' },
      { username: 'nicole_lewis', firstName: 'Nicole', lastName: 'Lewis', email: 'nicole@example.com', phone: '555-0218' },
      { username: 'steven_hall', firstName: 'Steven', lastName: 'Hall', email: 'steven@example.com', phone: '555-0219' },
      { username: 'rachel_young', firstName: 'Rachel', lastName: 'Young', email: 'rachel@example.com', phone: '555-0220' }
    ];

    const createdTenants = [];
    for (const tenant of tenants) {
      const createdTenant = await db.createUser({
        username: tenant.username,
        password: 'tenant123',
        role: 'TENANT',
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone
      });
      createdTenants.push(createdTenant);
    }

    // Create contractors
    console.log('🔧 Creating contractors...');
    
    const contractors = [
      { username: 'mike_contractor', firstName: 'Mike', lastName: 'Contractor', email: 'mike@contractor.com', phone: '555-0301' },
      { username: 'joe_plumber', firstName: 'Joe', lastName: 'Plumber', email: 'joe@plumber.com', phone: '555-0302' },
      { username: 'sam_electrician', firstName: 'Sam', lastName: 'Electrician', email: 'sam@electric.com', phone: '555-0303' },
      { username: 'tony_handyman', firstName: 'Tony', lastName: 'Handyman', email: 'tony@handyman.com', phone: '555-0304' },
      { username: 'dave_painter', firstName: 'Dave', lastName: 'Painter', email: 'dave@painter.com', phone: '555-0305' }
    ];

    const createdContractors = [];
    for (const contractor of contractors) {
      const createdContractor = await db.createUser({
        username: contractor.username,
        password: 'contractor123',
        role: 'CONTRACTOR',
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        email: contractor.email,
        phone: contractor.phone
      });
      createdContractors.push(createdContractor);
    }

    // Create comprehensive property data with proper tenant assignments
    console.log('🏘️ Creating properties with tenant assignments...');
    
    const propertyData = [
      // Alice's Properties (3 properties)
      {
        landlord: createdLandlords[0],
        properties: [
          {
            name: 'Sunset Villas',
            address: '123 Main St, Downtown',
            valuation: 350000,
            type: 'single-family',
            mortgage: {
              amount: 180000,
              monthlyPayment: 1200,
              lender: 'Bank of America',
              rate: 3.5,
              term: 30,
              startDate: '2020-01-01',
            },
            taxRate: '1.2',
            rent: 1800,
            tenant: 'John Doe',
            leaseStart: '2024-01-01',
            leaseEnd: '2024-12-31',
            miscExpenses: [
              { label: 'Insurance', amount: 120 },
              { label: 'Maintenance', amount: 80 },
              { label: 'Water', amount: 40 },
            ],
          },
          {
            name: 'Oak Ridge Apartments',
            address: '456 Oak Street, Midtown',
            valuation: 500000,
            type: 'multi-family',
            mortgage: {
              amount: 250000,
              monthlyPayment: 1500,
              lender: 'Chase Bank',
              rate: 4.0,
              term: 30,
              startDate: '2020-06-01',
            },
            taxRate: '1.5',
            units: [
              { unitNumber: '1A', rent: 1200, tenant: 'Jane Smith' }, // Jane Smith
              { unitNumber: '1B', rent: 1300, tenant: 'Mike Wilson' }, // Mike Wilson
              { unitNumber: '2A', rent: 1400, tenant: 'Sarah Jones' }, // Sarah Jones
              { unitNumber: '2B', rent: 1500, tenant: 'Tom Brown' }, // Tom Brown
            ],
            miscExpenses: [
              { label: 'Property Insurance', amount: 200 },
              { label: 'Landscaping', amount: 150 },
              { label: 'Pool Maintenance', amount: 100 },
            ],
          },
          {
            name: 'Riverside House',
            address: '789 River Road, Riverside',
            valuation: 280000,
            type: 'single-family',
            mortgage: {
              amount: 140000,
              monthlyPayment: 900,
              lender: 'Citibank',
              rate: 3.2,
              term: 30,
              startDate: '2021-08-01',
            },
            taxRate: '1.1',
            rent: 1600,
            tenant: 'Lisa Davis',
            leaseStart: '2024-02-01',
            leaseEnd: '2025-01-31',
            miscExpenses: [
              { label: 'Insurance', amount: 100 },
              { label: 'Maintenance', amount: 70 },
              { label: 'Utilities', amount: 50 },
            ],
          }
        ]
      },
      // Bob's Properties (2 properties)
      {
        landlord: createdLandlords[1],
        properties: [
          {
            name: 'Riverside Condos',
            address: '321 River Road, Riverside',
            valuation: 420000,
            type: 'multi-family',
            mortgage: {
              amount: 220000,
              monthlyPayment: 1400,
              lender: 'Wells Fargo',
              rate: 3.8,
              term: 30,
              startDate: '2021-03-15',
            },
            taxRate: '1.3',
            units: [
              { unitNumber: '101', rent: 1600, tenant: 'James Miller' }, // James Miller
              { unitNumber: '102', rent: 1700, tenant: 'Emily Garcia' }, // Emily Garcia
              { unitNumber: '201', rent: 1800, tenant: 'Robert Rodriguez' }, // Robert Rodriguez
            ],
            miscExpenses: [
              { label: 'HOA Fees', amount: 300 },
              { label: 'Security', amount: 120 },
              { label: 'Trash', amount: 60 },
            ],
          },
          {
            name: 'Maple Street House',
            address: '654 Maple Street, Suburbs',
            valuation: 320000,
            type: 'single-family',
            mortgage: {
              amount: 160000,
              monthlyPayment: 1000,
              lender: 'PNC Bank',
              rate: 3.4,
              term: 30,
              startDate: '2021-08-01',
            },
            taxRate: '1.1',
            rent: 1700,
            tenant: 'Jennifer Martinez',
            leaseStart: '2024-03-01',
            leaseEnd: '2025-02-28',
            miscExpenses: [
              { label: 'Insurance', amount: 110 },
              { label: 'Maintenance', amount: 75 },
              { label: 'Utilities', amount: 55 },
            ],
          }
        ]
      },
      // Carol's Properties (2 properties)
      {
        landlord: createdLandlords[2],
        properties: [
          {
            name: 'Downtown Lofts',
            address: '555 Business Ave, Downtown',
            valuation: 380000,
            type: 'multi-family',
            mortgage: {
              amount: 190000,
              monthlyPayment: 1100,
              lender: 'US Bank',
              rate: 3.6,
              term: 30,
              startDate: '2022-01-01',
            },
            taxRate: '1.4',
            units: [
              { unitNumber: 'A1', rent: 1400, tenant: 'Michael Anderson' }, // Michael Anderson
              { unitNumber: 'A2', rent: 1500, tenant: 'Amanda Taylor' }, // Amanda Taylor
              { unitNumber: 'B1', rent: 1600, tenant: 'Chris Lee' }, // Chris Lee
            ],
            miscExpenses: [
              { label: 'Building Insurance', amount: 180 },
              { label: 'Cleaning Services', amount: 200 },
              { label: 'Internet', amount: 80 },
            ],
          },
          {
            name: 'Garden Apartments',
            address: '888 Garden Lane, Park District',
            valuation: 320000,
            type: 'multi-family',
            mortgage: {
              amount: 160000,
              monthlyPayment: 1000,
              lender: 'PNC Bank',
              rate: 3.4,
              term: 30,
              startDate: '2022-06-01',
            },
            taxRate: '1.2',
            units: [
              { unitNumber: 'G1', rent: 1300, tenant: 'Jessica White' }, // Jessica White
              { unitNumber: 'G2', rent: 1400, tenant: 'Daniel Clark' }, // Daniel Clark
              { unitNumber: 'G3', rent: 1500, tenant: 'Ashley Martin' }, // Ashley Martin
            ],
            miscExpenses: [
              { label: 'Garden Maintenance', amount: 120 },
              { label: 'Security System', amount: 90 },
              { label: 'Water', amount: 70 },
            ],
          }
        ]
      },
      // David's Properties (2 properties)
      {
        landlord: createdLandlords[3],
        properties: [
          {
            name: 'Hilltop Manor',
            address: '999 Hilltop Drive, Hillside',
            valuation: 450000,
            type: 'single-family',
            mortgage: {
              amount: 225000,
              monthlyPayment: 1400,
              lender: 'Chase Bank',
              rate: 3.7,
              term: 30,
              startDate: '2022-03-01',
            },
            taxRate: '1.3',
            rent: 2000,
            tenant: 'Kevin Thompson',
            leaseStart: '2024-01-15',
            leaseEnd: '2024-12-14',
            miscExpenses: [
              { label: 'Insurance', amount: 150 },
              { label: 'Maintenance', amount: 100 },
              { label: 'Utilities', amount: 80 },
            ],
          },
          {
            name: 'City Center Apartments',
            address: '777 City Center Blvd, Downtown',
            valuation: 600000,
            type: 'multi-family',
            mortgage: {
              amount: 300000,
              monthlyPayment: 1800,
              lender: 'Bank of America',
              rate: 3.9,
              term: 30,
              startDate: '2022-09-01',
            },
            taxRate: '1.6',
            units: [
              { unitNumber: 'CC1', rent: 1800, tenant: 'Nicole Lewis' }, // Nicole Lewis
              { unitNumber: 'CC2', rent: 1900, tenant: 'Steven Hall' }, // Steven Hall
              { unitNumber: 'CC3', rent: 2000, tenant: 'Rachel Young' }, // Rachel Young
            ],
            miscExpenses: [
              { label: 'Building Insurance', amount: 250 },
              { label: 'Concierge Service', amount: 300 },
              { label: 'Gym Maintenance', amount: 150 },
            ],
          }
        ]
      },
      // Emma's Properties (1 property)
      {
        landlord: createdLandlords[4],
        properties: [
          {
            name: 'Suburban Heights',
            address: '444 Suburban Lane, Suburbs',
            valuation: 280000,
            type: 'single-family',
            mortgage: {
              amount: 140000,
              monthlyPayment: 900,
              lender: 'Wells Fargo',
              rate: 3.3,
              term: 30,
              startDate: '2023-01-01',
            },
            taxRate: '1.0',
            rent: 1500,
            // This property is currently vacant
            miscExpenses: [
              { label: 'Insurance', amount: 90 },
              { label: 'Maintenance', amount: 60 },
              { label: 'Utilities', amount: 40 },
            ],
          }
        ]
      }
    ];

    // Create properties and assign tenants
    for (const landlordData of propertyData) {
      console.log(`🏘️ Creating properties for ${landlordData.landlord.firstName}...`);
      
      for (const propertyData of landlordData.properties) {
        const property = await db.createProperty({
          ...propertyData,
          ownerId: landlordData.landlord.id
        });
        
        console.log(`  ✅ Created: ${propertyData.name}`);
      }
    }

    // Create lease agreements for all tenant assignments
    console.log('📋 Creating lease agreements...');
    
    const allTenantUnits = await prisma.tenantUnit.findMany({
      include: {
        tenant: true,
        property: true,
        unit: true
      }
    });

    for (const tenantUnit of allTenantUnits) {
      if (tenantUnit.leaseStart && tenantUnit.leaseEnd) {
        await prisma.leaseAgreement.create({
          data: {
            tenantId: tenantUnit.tenantId,
            propertyId: tenantUnit.propertyId,
            unitId: tenantUnit.unitId,
            rentAmount: tenantUnit.rent || 0,
            securityDeposit: (tenantUnit.rent || 0) * 0.5, // 50% of rent as security deposit
            leaseStartDate: tenantUnit.leaseStart,
            leaseEndDate: tenantUnit.leaseEnd,
            status: 'ACTIVE',
            lateFeeAmount: 50,
            gracePeriodDays: 5,
            utilitiesIncluded: false,
            petPolicy: 'No pets allowed',
            parkingSpaces: 1,
          },
        });
      }
    }

    // Create some standalone projects
    console.log('🏗️ Creating standalone projects...');
    
    const projects = [
      {
        name: 'Kitchen Remodel',
        description: 'Complete kitchen renovation with new cabinets and countertops',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        budget: 25000,
        location: '123 Main St, Unit 2A',
        ownerId: createdLandlords[0].id,
      },
      {
        name: 'Bathroom Upgrade',
        description: 'Modern bathroom renovation with new fixtures and tile',
        status: 'PLANNING',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-05-15'),
        budget: 15000,
        location: '456 Oak Street, Unit 1B',
        ownerId: createdLandlords[0].id,
      },
      {
        name: 'Roof Replacement',
        description: 'Complete roof replacement with new shingles and gutters',
        status: 'COMPLETED',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-15'),
        budget: 18000,
        location: '789 River Road',
        ownerId: createdLandlords[1].id,
      },
      {
        name: 'HVAC System Upgrade',
        description: 'Installation of new energy-efficient HVAC system',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-30'),
        budget: 12000,
        location: '555 Business Ave, Downtown',
        ownerId: createdLandlords[2].id,
      }
    ];

    for (const projectData of projects) {
      await db.createStandaloneProject(projectData);
    }

    // Create some sample payments
    console.log('💰 Creating sample payment records...');
    
    // Get all tenant units to create payments
    const tenantUnits = await prisma.tenantUnit.findMany({
      include: {
        tenant: true,
        property: true,
        unit: true
      }
    });

    for (const tenantUnit of tenantUnits) {
      // Create payments for the last 6 months
      for (let i = 0; i < 6; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() - i);
        
        const payment = await prisma.payment.create({
          data: {
            tenantId: tenantUnit.tenantId,
            propertyId: tenantUnit.propertyId,
            unitId: tenantUnit.unitId,
            amount: tenantUnit.rent || 0,
            dueDate: dueDate.toISOString().split('T')[0],
            paidDate: Math.random() > 0.2 ? dueDate.toISOString().split('T')[0] : null, // 80% paid
            status: Math.random() > 0.2 ? 'PAID' : 'PENDING',
            method: Math.random() > 0.5 ? 'Online' : 'Check'
          }
        });
      }
    }

    // Create some sample work orders
    console.log('🔧 Creating sample work orders...');
    
    // Get some properties and tenant units for work orders
    const properties = await prisma.property.findMany({
      include: {
        tenantUnits: {
          include: {
            tenant: true
          }
        }
      }
    });
    
    if (properties.length > 0) {
      const workOrders = [
        {
          title: 'Leaky Faucet Repair',
          description: 'Kitchen faucet is leaking and needs repair',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          propertyId: properties[0].id,
          unitId: null,
          tenantUnitId: properties[0].tenantUnits[0]?.id,
          createdById: createdTenants[0].id,
          assignedToId: createdContractors[0].id,
          notes: 'Tenant reported leak on Monday morning'
        },
        {
          title: 'HVAC Maintenance',
          description: 'Annual HVAC system maintenance and filter replacement',
          status: 'COMPLETED',
          priority: 'LOW',
          propertyId: properties[1]?.id || properties[0].id,
          unitId: null,
          tenantUnitId: properties[1]?.tenantUnits[0]?.id,
          createdById: createdLandlords[0].id,
          assignedToId: createdContractors[1].id,
          notes: 'Completed on schedule'
        },
        {
          title: 'Electrical Outlet Repair',
          description: 'Outdoor electrical outlet not working',
          status: 'OPEN',
          priority: 'HIGH',
          propertyId: properties[2]?.id || properties[0].id,
          unitId: null,
          tenantUnitId: properties[2]?.tenantUnits[0]?.id,
          createdById: createdTenants[5].id,
          assignedToId: createdContractors[2].id,
          notes: 'Safety concern - needs immediate attention'
        }
      ];

      for (const workOrderData of workOrders) {
        if (workOrderData.propertyId && workOrderData.createdById && workOrderData.assignedToId) {
          await prisma.workOrder.create({
            data: workOrderData
          });
        }
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log('👥 Property Owners (Landlords):');
    console.log('  - Alice Johnson (alice_landlord / password123) - 3 properties');
    console.log('  - Bob Smith (bob_landlord / password123) - 2 properties');
    console.log('  - Carol Williams (carol_landlord / password123) - 2 properties');
    console.log('  - David Brown (david_landlord / password123) - 2 properties');
    console.log('  - Emma Davis (emma_landlord / password123) - 1 property (vacant)');
    console.log('\n🏠 Tenants (20 total):');
    console.log('  - All tenants use password: tenant123');
    console.log('  - 19 tenants assigned to properties, 1 property vacant');
    console.log('\n🔧 Contractors (5 total):');
    console.log('  - All contractors use password: contractor123');
    console.log('\n🏘️ Properties Summary:');
    console.log('  - 10 total properties');
    console.log('  - 5 single-family homes');
    console.log('  - 5 multi-family buildings');
    console.log('  - 19 occupied units, 1 vacant property');
    console.log('\n💰 Financial Data:');
    console.log('  - 6 months of payment history for each tenant');
    console.log('  - 80% payment rate (realistic)');
    console.log('  - Mortgage and expense data for all properties');
    console.log('\n🏗️ Projects:');
    console.log('  - 4 standalone projects across different landlords');
    console.log('\n🔧 Work Orders:');
    console.log('  - 3 sample work orders with different statuses');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 