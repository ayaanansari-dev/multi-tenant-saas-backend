// prisma/seed.ts - Fixed version
import { PrismaClient } from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Consistent hash calculation function
const calculateAuditHash = (data: {
  action: string;
  entityType: string;
  entityId: string;
  previousValue: any;
  newValue: any;
  userId: string;
  apiKeyId: string;
  ipAddress: string;
  userAgent: string;
  tenantId: string;
}, previousHash: string | null): string => {
  // Create the exact same structure for hashing
  const hashData = {
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    previousValue: data.previousValue === undefined ? null : data.previousValue,
    newValue: data.newValue,
    userId: data.userId,
    apiKeyId: data.apiKeyId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    tenantId: data.tenantId,
    previousHash: previousHash
  };
  
  // Convert to string with consistent formatting
  const dataString = JSON.stringify(hashData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing audit logs for the tenant
  await prisma.auditLog.deleteMany({});
  console.log('✅ Cleared existing audit logs');

  // Create tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { name: 'Acme Corp' },
    update: {},
    create: { name: 'Acme Corp' }
  });
  
  const tenant2 = await prisma.tenant.upsert({
    where: { name: 'TechStart Inc' },
    update: {},
    create: { name: 'TechStart Inc' }
  });
  
  console.log(`✅ Created tenants: ${tenant1.name}, ${tenant2.name}`);
  
  // Create users with roles
  const users = [];
  for (const tenant of [tenant1, tenant2]) {
    // Owner
    const ownerEmail = `owner@${tenant.name.toLowerCase().replace(' ', '')}.com`;
    const owner = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          tenantId: tenant.id,
          email: ownerEmail
        }
      },
      update: {},
      create: {
        email: ownerEmail,
        name: 'System Owner',
        role: 'OWNER',
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });
    users.push(owner);
    console.log(`✅ Owner created: ${owner.email}`);
    
    // Members
    for (let i = 1; i <= 2; i++) {
      const memberEmail = `member${i}@${tenant.name.toLowerCase().replace(' ', '')}.com`;
      const member = await prisma.user.upsert({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: memberEmail
          }
        },
        update: {},
        create: {
          email: memberEmail,
          name: `Member ${i}`,
          role: 'MEMBER',
          tenant: {
            connect: { id: tenant.id }
          }
        }
      });
      users.push(member);
      console.log(`✅ Member created: ${member.email}`);
    }
  }
  
  // Create API keys
  console.log('\n🔑 Creating API keys...');
  for (const user of users) {
    const keyPrefix = crypto.randomBytes(4).toString('hex');
    const keySecret = crypto.randomBytes(32).toString('hex');
    const plainKey = `${keyPrefix}_${keySecret}`;
    const keyHash = await bcrypt.hash(plainKey, 12);
    
    await prisma.apiKey.upsert({
      where: { keyHash },
      update: {},
      create: {
        name: `Default Key - ${user.name}`,
        keyHash,
        keyPrefix,
        isActive: true,
        user: { connect: { id: user.id } },
        tenant: { connect: { id: user.tenantId } }
      }
    });
    console.log(`✅ API Key for ${user.email}: ${keyPrefix}_xxxxx`);
  }
  
  // Create audit logs with valid chain using consistent hash calculation
  console.log('\n📝 Creating audit logs with proper chain hashing...');
  let previousHash: string | null = null;
  
  for (let i = 0; i < 10; i++) {
    const action = i === 0 ? 'INITIAL_SEED' : `SEED_STEP_${i}`;
    
    const auditData = {
      action,
      entityType: 'Seed',
      entityId: `seed-${i}`,
      previousValue: i > 0 ? { step: i - 1 } : null,
      newValue: { step: i },
      userId: users[0].id,
      apiKeyId: 'seed-system',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      tenantId: tenant1.id
    };
    
    // Calculate hash using the consistent function
    const chainHash = calculateAuditHash(auditData, previousHash);
    
    // Create the audit log
    const auditLogData: any = {
      action: auditData.action,
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      newValue: auditData.newValue,
      userId: auditData.userId,
      apiKeyId: auditData.apiKeyId,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      previousHash,
      chainHash,
      tenant: {
        connect: { id: tenant1.id }
      }
    };
    
    // Handle previousValue with Prisma.JsonNull for null values
    if (auditData.previousValue === null) {
      auditLogData.previousValue = Prisma.JsonNull;
    } else if (auditData.previousValue !== undefined) {
      auditLogData.previousValue = auditData.previousValue;
    }
    
    const auditLog = await prisma.auditLog.create({
      data: auditLogData
    });
    
    console.log(`  ✅ Audit log ${i + 1}: hash=${chainHash.substring(0, 16)}...`);
    previousHash = chainHash;
  }
  
  // Verify the chain using the same calculation
  console.log('\n🔍 Verifying audit chain...');
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: tenant1.id },
    orderBy: { createdAt: 'asc' }
  });
  
  let isValid = true;
  let prevHash: string | null = null;
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const logData = {
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      previousValue: log.previousValue,
      newValue: log.newValue,
      userId: log.userId,
      apiKeyId: log.apiKeyId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      tenantId: log.tenantId
    };
    
    const expectedHash = calculateAuditHash(logData, prevHash);
    
    if (log.chainHash !== expectedHash) {
      console.log(`  ❌ Hash mismatch at log ${i + 1}`);
      console.log(`     Action: ${log.action}`);
      console.log(`     Expected: ${expectedHash}`);
      console.log(`     Got: ${log.chainHash}`);
      isValid = false;
      break;
    }
    
    console.log(`  ✓ Log ${i + 1} verified (hash: ${log.chainHash.substring(0, 16)}...)`);
    prevHash = expectedHash;
  }
  
  if (isValid) {
    console.log('  ✅ Audit chain verification passed!');
  } else {
    console.log('  ❌ Audit chain verification failed!');
  }
  
  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });