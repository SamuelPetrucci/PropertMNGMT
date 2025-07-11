const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleWorkOrders() {
  try {
    console.log('Creating sample work orders...');
    
    // Get the first property and user
    const property = await prisma.property.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!property || !user) {
      console.log('No property or user found. Please run the seed script first.');
      return;
    }
    
    console.log('Using property:', property.name);
    console.log('Using user:', user.username);
    
    // Create sample work orders
    const sampleWorkOrders = [
      {
        title: 'Leaky Faucet in Kitchen',
        description: 'The kitchen faucet is dripping constantly and needs repair.',
        status: 'OPEN',
        priority: 'MEDIUM',
        propertyId: property.id,
        createdById: user.id,
      },
      {
        title: 'Broken Window in Living Room',
        description: 'Window pane is cracked and needs replacement.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        propertyId: property.id,
        createdById: user.id,
      },
      {
        title: 'HVAC System Not Working',
        description: 'Air conditioning unit is not cooling properly.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        propertyId: property.id,
        createdById: user.id,
      },
      {
        title: 'Paint Touch-up Needed',
        description: 'Some walls need paint touch-up in the hallway.',
        status: 'COMPLETED',
        priority: 'LOW',
        propertyId: property.id,
        createdById: user.id,
      },
    ];
    
    for (const workOrderData of sampleWorkOrders) {
      const workOrder = await prisma.workOrder.create({
        data: workOrderData,
      });
      console.log('Created work order:', workOrder.title);
    }
    
    console.log('Sample work orders created successfully!');
    
  } catch (error) {
    console.error('Error creating sample work orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleWorkOrders(); 