import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";
import { auth } from "@repo/auth";

// ============================================================================
// ENVIRONMENT CHECK - Prevent accidental seeding in production
// ============================================================================
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

console.log(`\n🌍 Environment: ${NODE_ENV.toUpperCase()}\n`);

if (isProduction) {
  console.error("❌ ERROR: Cannot run seed in production environment!");
  console.error("   This would delete all existing data.");
  console.error("   If you really need to seed production, set NODE_ENV=development temporarily.\n");
  process.exit(1);
}

// Initialize Prisma client with adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/**
 * Generate a unique ID (similar to better-auth's ID generation)
 */
function generateId(): string {
  return randomBytes(16).toString("hex");
}

// ============================================================================
// SEED CONFIGURATION - Uses environment variables with fallbacks
// ============================================================================
const SEED_PASSWORD = process.env.SEED_PASSWORD || "Password123!";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const SEED_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || "owner@example.com";
const SEED_MEMBER_EMAIL = process.env.SEED_MEMBER_EMAIL || "member@example.com";
const SEED_ORG_NAME = process.env.SEED_ORG_NAME || "Acme Corporation";
const SEED_ORG_SLUG = process.env.SEED_ORG_SLUG || "acme-corp";

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (in correct order to respect foreign keys)
  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  console.log("   ✓ Existing data cleared\n");

  // Create users using better-auth API (ensures correct password hashing)
  console.log("👤 Creating users via better-auth API...");

  // 1. Create Super Admin
  const superAdminResult = await auth.api.signUpEmail({
    body: {
      email: SEED_ADMIN_EMAIL,
      password: SEED_PASSWORD,
      name: "Super Admin",
    },
  });
  const superAdminId = superAdminResult.user?.id;
  if (!superAdminId) throw new Error("Failed to create super admin");

  // Update to set emailVerified and role to admin
  await prisma.user.update({
    where: { id: superAdminId },
    data: { emailVerified: true, role: "admin" },
  });
  console.log(`   ✓ 🔐 Admin: Super Admin (${SEED_ADMIN_EMAIL})`);

  // 2. Create Team Owner
  const teamOwnerResult = await auth.api.signUpEmail({
    body: {
      email: SEED_OWNER_EMAIL,
      password: SEED_PASSWORD,
      name: "Team Owner",
    },
  });
  const teamOwnerId = teamOwnerResult.user?.id;
  if (!teamOwnerId) throw new Error("Failed to create team owner");

  await prisma.user.update({
    where: { id: teamOwnerId },
    data: { emailVerified: true },
  });
  console.log(`   ✓ 👤 User: Team Owner (${SEED_OWNER_EMAIL})`);

  // 3. Create Team Member
  const teamMemberResult = await auth.api.signUpEmail({
    body: {
      email: SEED_MEMBER_EMAIL,
      password: SEED_PASSWORD,
      name: "Team Member",
    },
  });
  const teamMemberId = teamMemberResult.user?.id;
  if (!teamMemberId) throw new Error("Failed to create team member");

  await prisma.user.update({
    where: { id: teamMemberId },
    data: { emailVerified: true },
  });
  console.log(`   ✓ 👤 User: Team Member (${SEED_MEMBER_EMAIL})`);
  console.log("");

  // Create organization
  console.log("🏢 Creating organization...");
  const organizationId = generateId();
  await prisma.organization.create({
    data: {
      id: organizationId,
      name: SEED_ORG_NAME,
      slug: SEED_ORG_SLUG,
      createdAt: new Date(),
    },
  });
  console.log(`   ✓ Organization: ${SEED_ORG_NAME} (${SEED_ORG_SLUG})\n`);

  // Create members
  console.log("👥 Adding members to organization...");

  // Add Team Owner as owner
  await prisma.member.create({
    data: {
      id: generateId(),
      userId: teamOwnerId,
      organizationId: organizationId,
      role: "owner",
      createdAt: new Date(),
    },
  });
  console.log(`   ✓ 👑 Team Owner as owner`);

  // Add Team Member as member
  await prisma.member.create({
    data: {
      id: generateId(),
      userId: teamMemberId,
      organizationId: organizationId,
      role: "member",
      createdAt: new Date(),
    },
  });
  console.log(`   ✓ 👤 Team Member as member`);
  console.log("");

  // Create audit log for admin creation
  console.log("📝 Creating audit log...");
  await prisma.auditLog.create({
    data: {
      action: "ADMIN_PROMOTED",
      actorId: superAdminId,
      targetType: "USER",
      targetId: superAdminId,
      metadata: JSON.stringify({
        email: SEED_ADMIN_EMAIL,
        name: "Super Admin",
        promotedVia: "SEED",
      }),
    },
  });
  console.log("   ✓ Audit log created for admin promotion\n");

  // Summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!\n");
  console.log("📋 Created:");
  console.log(`   • 3 users`);
  console.log(`   • 1 organization`);
  console.log(`   • 2 organization members`);
  console.log(`   • 1 audit log entry\n`);
  console.log("🔑 Login credentials (same for all users):");
  console.log(`   Password: ${SEED_PASSWORD}\n`);
  console.log("📧 User emails:");
  console.log(`   • ${SEED_ADMIN_EMAIL}  (Super Admin)`);
  console.log(`   • ${SEED_OWNER_EMAIL}  (Team Owner of ${SEED_ORG_NAME})`);
  console.log(`   • ${SEED_MEMBER_EMAIL} (Team Member of ${SEED_ORG_NAME})`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
