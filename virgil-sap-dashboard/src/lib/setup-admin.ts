import { prisma } from "./prisma";

async function setupAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.users.findUnique({
      where: { email: "admin@virgil-ai.com" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);

      // Update existing admin to have proper permissions
      await prisma.users.update({
        where: { id: existingAdmin.id },
        data: {
          isActive: true,
          isAdmin: true,
          subscriptionTier: "enterprise",
          accessGrantedAt: new Date(),
        },
      });

      console.log("✅ Admin user updated with proper permissions");
      return;
    }

    // Create new admin user
    const adminUser = await prisma.users.create({
      data: {
        email: "admin@virgil-ai.com",
        name: "Virgil Admin",
        role: "admin",
        isActive: true,
        isAdmin: true,
        subscriptionTier: "enterprise",
        accessGrantedAt: new Date(),
        territory: "Global",
      },
    });

    console.log("✅ Admin user created:", adminUser.email);
  } catch (error) {
    console.error("❌ Error setting up admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
