import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

// Custom adapter that works with your existing database schema
export const fixedAdapter = {
  ...PrismaAdapter(prisma),

  // Override getUserByEmail to use the correct model name
  async getUserByEmail(email: string) {
    return await prisma.users.findUnique({
      where: { email },
    });
  },

  // Override getUserByAccount to use the correct model name
  async getUserByAccount(
    provider: string | { provider: string; providerAccountId?: string },
    providerAccountId: string
  ) {
    try {
      console.log("getUserByAccount called with:", {
        provider,
        providerAccountId,
      });

      // Handle case where provider is an object (from NextAuth.js)
      if (
        typeof provider === "object" &&
        typeof provider.providerAccountId === "string"
      ) {
        providerAccountId = provider.providerAccountId;
        provider = provider.provider;
      }

      // First, try to find an existing account
      let account = await prisma.account.findFirst({
        where: {
          AND: [
            {
              provider:
                typeof provider === "string" ? provider : provider.provider,
            },
            { providerAccountId: providerAccountId },
          ],
        },
        include: {
          user: true,
        },
      });

      // If no account exists, we need to find the user by their email
      // This is a limitation of our current setup - we'll need to get the email from the session
      if (!account) {
        console.log(
          "No account found for provider:",
          provider,
          "providerAccountId:",
          providerAccountId
        );
        // We can't create an account here without knowing the user's email
        // This will be handled by the signIn callback and linkAccount
        return null;
      }

      return account?.user;
    } catch (error) {
      console.error("Error in getUserByAccount:", error);
      return null;
    }
  },

  // Override createUser to use the correct model name
  async createUser(data: any) {
    try {
      console.log("🔧 createUser called with data:", {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
        isActive: data.isActive,
        isAdmin: data.isAdmin,
        role: data.role,
      });

      const newUser = await prisma.users.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
          isActive: false,
          isAdmin: false,
          role: "sales_rep",
        },
      });

      console.log("✅ User created successfully:", {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isActive: newUser.isActive,
        isAdmin: newUser.isAdmin,
      });

      return newUser;
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw error;
    }
  },

  // Override updateUser to use the correct model name
  async updateUser(data: any) {
    return await prisma.users.update({
      where: { id: data.id },
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
      },
    });
  },

  // Override linkAccount to use the correct model name
  async linkAccount(data: any) {
    try {
      console.log("linkAccount called with:", data);
      const result = await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      });
      console.log("Account created:", result);
      return result;
    } catch (error) {
      console.error("Error in linkAccount:", error);
      throw error;
    }
  },

  // Override createSession to use the correct model name
  async createSession(data: any) {
    return await prisma.session.create({
      data: {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      },
    });
  },

  // Override getSessionAndUser to use the correct model name
  async getSessionAndUser(sessionToken: string) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: true,
      },
    });
    if (!session) return null;
    return {
      session,
      user: session.user,
    };
  },

  // Override updateSession to use the correct model name
  async updateSession(data: any) {
    return await prisma.session.update({
      where: { sessionToken: data.sessionToken },
      data: {
        userId: data.userId,
        expires: data.expires,
      },
    });
  },

  // Override deleteSession to use the correct model name
  async deleteSession(sessionToken: string) {
    return await prisma.session.delete({
      where: { sessionToken },
    });
  },

  // Override createVerificationToken to use the correct model name
  async createVerificationToken(data: any) {
    return await prisma.verificationToken.create({
      data: {
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      },
    });
  },

  // Override useVerificationToken to use the correct model name
  async useVerificationToken(identifier: string, token: string) {
    return await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });
  },
};
