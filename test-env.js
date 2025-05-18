require('dotenv').config({ path: '.env.local' });

console.log('Testing environment variables:');
console.log('Current working directory:', process.cwd());
console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length);
console.log('All environment variables:', Object.keys(process.env)); 