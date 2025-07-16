const { db } = require('./db');

console.log('Available functions in db:');
console.log(Object.keys(db));

console.log('\nChecking if updateLeaseDates exists:');
console.log('updateLeaseDates exists:', typeof db.updateLeaseDates === 'function');

if (typeof db.updateLeaseDates === 'function') {
  console.log('Function signature:', db.updateLeaseDates.toString().split('\n')[0]);
} else {
  console.log('Function not found!');
} 