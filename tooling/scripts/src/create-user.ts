import { auth } from "@repo/auth";
import { prisma } from "@repo/db";
import { logger } from "@repo/logs";
import { nanoid } from "nanoid";

async function main() {

  logger.info("Let's create a new user for your application!\n");

  const email = await logger.prompt("Enter an email:", {
    type: "text",
    placeholder: "admin@example.com",
  });

  if (typeof email !== "string" || !email) {
    logger.error("Email is required!");
    process.exit(1);
  }

  const name = await logger.prompt("Enter a name:", {
    type: "text",
    placeholder: "Admin User",
  });

  if (typeof name !== "string" || !name) {
    logger.error("Name is required!");
    process.exit(1);
  }

  const isAdmin = await logger.prompt("Should user be an admin?", {
    type: "confirm",
    initial: false,
  });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.error(`User with email "${email}" already exists!`);
    process.exit(1);
  }

  // Generate password and hash it using better-auth's internal hashing
  const password = nanoid(16);
  const authContext = await auth.$context;
  const hashedPassword = await authContext.password.hash(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      id: nanoid(),
      email,
      name,
      emailVerified: true,
      role: isAdmin ? "admin" : "user",
    },
  });

  // Create credential account with hashed password
  await prisma.account.create({
    data: {
      id: nanoid(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  logger.success(`\nUser created successfully!`);
  logger.box({
    title: "User Credentials",
    message: `Email: ${email}\nPassword: ${password}\nRole: ${isAdmin ? "admin" : "user"}`,
    style: {
      borderColor: "green",
    },
  });

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  logger.error("Failed to create user:", error);
  process.exit(1);
});
