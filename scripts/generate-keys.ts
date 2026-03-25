// scripts/generate-keys.ts
import crypto from 'crypto';

console.log('🔑 Generating secure keys for your application...\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const internalApiKey = crypto.randomBytes(16).toString('hex');

console.log('Add these to your .env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`INTERNAL_API_KEY=${internalApiKey}`);
console.log('\n⚠️  Keep these keys secure and never commit them to version control!');