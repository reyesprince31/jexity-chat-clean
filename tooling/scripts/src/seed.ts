import { randomUUID } from "crypto";
import { auth } from "@repo/auth";
import { prisma } from "@repo/db";
import { logger } from "@repo/logs";
import { nanoid } from "nanoid";

// CLI argument parsing
const args = process.argv.slice(2);
const seedAuth = args.includes("--auth") || args.length === 0;
const seedChat = args.includes("--chat") || args.length === 0;

// Seed configuration
const SEED_PASSWORD = process.env.SEED_PASSWORD || "Password123!";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const SEED_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || "owner@example.com";
const SEED_MEMBER_EMAIL = process.env.SEED_MEMBER_EMAIL || "member@example.com";
const SEED_ORG_NAME = process.env.SEED_ORG_NAME || "Acme Corporation";
const SEED_ORG_SLUG = process.env.SEED_ORG_SLUG || "acme-corp";

interface CreatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Create a user with hashed password using better-auth's internal hashing
 */
async function createUser(
  email: string,
  name: string,
  password: string,
  role: string,
  hashedPassword: string
): Promise<CreatedUser | null> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.info(`  ↳ User already exists: ${email}`);
    return { id: existingUser.id, email: existingUser.email, role: existingUser.role || "user" };
  }

  const user = await prisma.user.create({
    data: {
      id: nanoid(),
      email,
      name,
      emailVerified: true,
      role,
    },
  });

  await prisma.account.create({
    data: {
      id: nanoid(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  return { id: user.id, email: user.email, role };
}

/**
 * Create an organization
 */
async function createOrganization(
  name: string,
  slug: string
): Promise<{ id: string; name: string; slug: string } | null> {
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  });

  if (existingOrg) {
    logger.info(`  ↳ Organization already exists: ${slug}`);
    return existingOrg;
  }

  const org = await prisma.organization.create({
    data: {
      id: nanoid(),
      name,
      slug,
      createdAt: new Date(),
    },
  });

  return org;
}

/**
 * Add a member to an organization
 */
async function addMemberToOrganization(
  organizationId: string,
  userId: string,
  role: string
): Promise<void> {
  const existingMember = await prisma.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (existingMember) {
    logger.info(`  ↳ Member already exists in organization`);
    return;
  }

  await prisma.member.create({
    data: {
      id: nanoid(),
      organizationId,
      userId,
      role,
      createdAt: new Date(),
    },
  });
}

/**
 * Create sample conversations and messages for chat feature
 */
async function seedChatData(): Promise<void> {
  // Check if conversations already exist
  const existingConversation = await prisma.conversations.findFirst();

  if (existingConversation) {
    logger.info(`  ↳ Chat data already exists`);
    return;
  }

  // Create a sample escalated conversation (uses UUID)
  const conversation = await prisma.conversations.create({
    data: {
      id: randomUUID(),
      title: "Welcome Conversation",
      is_escalated: true,
      escalated_reason: "Customer requested human assistance",
      escalated_at: new Date(),
    },
  });

  // Create sample messages (uses UUID)
  await prisma.messages.createMany({
    data: [
      {
        id: randomUUID(),
        conversation_id: conversation.id,
        role: "user",
        content: "Hello! How can I use this chatbot?",
      },
      {
        id: randomUUID(),
        conversation_id: conversation.id,
        role: "assistant",
        content:
          "Welcome! I'm here to help you with any questions you have. You can ask me about our products, services, or any other topic. I'll do my best to provide helpful and accurate information.",
      },
      {
        id: randomUUID(),
        conversation_id: conversation.id,
        role: "user",
        content: "What features do you support?",
      },
      {
        id: randomUUID(),
        conversation_id: conversation.id,
        role: "assistant",
        content:
          "I support various features including:\n\n1. **Document Search** - I can search through uploaded documents to find relevant information\n2. **Conversational Memory** - I remember our conversation context\n3. **Multi-turn Dialogue** - We can have back-and-forth conversations\n4. **Source Citations** - I can cite sources when providing information from documents",
      },
    ],
  });

  // Create a second escalated conversation (uses UUID)
  const conversation2 = await prisma.conversations.create({
    data: {
      id: randomUUID(),
      title: "Product Inquiry",
      is_escalated: true,
      escalated_reason: "Pricing question requires human review",
      escalated_at: new Date(),
    },
  });

  await prisma.messages.createMany({
    data: [
      {
        id: randomUUID(),
        conversation_id: conversation2.id,
        role: "user",
        content: "Tell me about your pricing plans",
      },
      {
        id: randomUUID(),
        conversation_id: conversation2.id,
        role: "assistant",
        content:
          "I'd be happy to help you with pricing information! However, I don't have specific pricing details in my current knowledge base. Would you like me to help you find the pricing page or connect you with our sales team?",
      },
    ],
  });
}

async function main() {
  const modes = [];
  if (seedAuth) modes.push("auth");
  if (seedChat) modes.push("chat");
  logger.info(`🌱 Starting database seed (${modes.join(" + ")})...\n`);

  let admin: CreatedUser | null = null;
  let owner: CreatedUser | null = null;
  let member: CreatedUser | null = null;
  let organization: { id: string; name: string; slug: string } | null = null;

  // Seed auth data (users + organization)
  if (seedAuth) {
    // Hash the password once using better-auth's internal hashing
    const authContext = await auth.$context;
    const hashedPassword = await authContext.password.hash(SEED_PASSWORD);
    logger.success("Password hashed with better-auth");

    // 1. Create Admin User
    logger.info("\nCreating Admin user...");
    admin = await createUser(
      SEED_ADMIN_EMAIL,
      "Admin User",
      SEED_PASSWORD,
      "admin",
      hashedPassword
    );
    if (admin) logger.success(`Admin user: ${admin.email}`);

    // 2. Create Owner User
    logger.info("\nCreating Owner user...");
    owner = await createUser(
      SEED_OWNER_EMAIL,
      "Organization Owner",
      SEED_PASSWORD,
      "user",
      hashedPassword
    );
    if (owner) logger.success(`Owner user: ${owner.email}`);

    // 3. Create Member User
    logger.info("\nCreating Member user...");
    member = await createUser(
      SEED_MEMBER_EMAIL,
      "Team Member",
      SEED_PASSWORD,
      "user",
      hashedPassword
    );
    if (member) logger.success(`Member user: ${member.email}`);

    // 4. Create Organization
    logger.info("\nCreating Organization...");
    organization = await createOrganization(SEED_ORG_NAME, SEED_ORG_SLUG);
    if (organization) {
      logger.success(`Organization: ${organization.name} (${organization.slug})`);

      // 5. Add Owner to organization
      if (owner) {
        logger.info("\nAdding Owner to organization...");
        await addMemberToOrganization(organization.id, owner.id, "owner");
        logger.success("Owner added as 'owner'");
      }

      // 6. Add Member to organization
      if (member) {
        logger.info("\nAdding Member to organization...");
        await addMemberToOrganization(organization.id, member.id, "member");
        logger.success("Member added as 'member'");
      }
    }
  }

  // Seed chat data
  if (seedChat) {
    logger.info("\nSeeding chat data...");
    await seedChatData();
    logger.success("Chat data seeded");
  }

  // Summary
  const summaryLines: string[] = [];
  if (seedAuth) {
    summaryLines.push(
      `Admin:        ${SEED_ADMIN_EMAIL} (role: admin)`,
      `Owner:        ${SEED_OWNER_EMAIL} (org owner)`,
      `Member:       ${SEED_MEMBER_EMAIL} (org member)`,
      `Organization: ${SEED_ORG_NAME} (${SEED_ORG_SLUG})`,
      `Password:     ${SEED_PASSWORD}`
    );
  }
  if (seedChat) {
    if (summaryLines.length > 0) summaryLines.push("");
    summaryLines.push("Sample chat conversations seeded");
  }

  logger.box({
    title: "🎉 Seed Completed",
    message: summaryLines.join("\n"),
    style: {
      borderColor: "green",
    },
  });

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  logger.error("❌ Seed failed:", error);
  process.exit(1);
});
