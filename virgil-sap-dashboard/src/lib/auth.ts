import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { fixedAdapter } from "./adapter-fixed";

// Debug environment variables
console.log("🔧 Auth Configuration Debug:");
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
);
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
);
console.log(
  "NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing"
);
console.log(
  "NEXTAUTH_URL:",
  process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing"
);

export const authOptions: NextAuthOptions = {
  adapter: fixedAdapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 SignIn callback triggered with:", {
          userEmail: user?.email,
          userName: user?.name,
          accountProvider: account?.provider,
          accountProviderId: account?.providerAccountId,
          profileEmail: profile?.email,
          profileName: profile?.name,
        });

        // Use profile data for OAuth authentication (more reliable)
        const userEmail = profile?.email || user?.email;
        const userName = profile?.name || user?.name;
        const userImage = (profile as any)?.picture || (user as any)?.image;

        if (!userEmail) {
          console.error("❌ No email found in OAuth data");
          return false;
        }

        console.log("🔍 Checking for user with email:", userEmail);

        // Check if user exists and has access
        const existingUser = await fixedAdapter.getUserByEmail(userEmail);

        if (existingUser) {
          // User exists, check if they have access
          console.log("✅ Existing user found:", {
            id: existingUser.id,
            email: existingUser.email,
            isActive: existingUser.isActive,
            isAdmin: existingUser.isAdmin,
          });

          if (!existingUser.isActive) {
            console.log("❌ User not active:", userEmail);
            return false; // Deny access if not active
          }
          console.log("✅ User active:", userEmail);
          return true;
        }

        // New user - create account and allow sign in with limited access
        console.log("🆕 Creating new user:", userEmail);

        const newUser = await fixedAdapter.createUser({
          email: userEmail,
          name: userName || "Unknown User",
          image: userImage,
          isActive: false, // Requires manual approval
          role: "sales_rep",
        });

        console.log("✅ New user created (pending approval):", {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isActive: newUser.isActive,
        });

        // Link the OAuth account to the new user
        if (account) {
          console.log("🔗 Linking OAuth account to new user");
          try {
            await fixedAdapter.linkAccount({
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            });
            console.log("✅ OAuth account linked successfully");
          } catch (linkError) {
            console.error("❌ Error linking OAuth account:", linkError);
          }
        }

        return true; // Allow sign in but they'll have limited access
      } catch (error) {
        console.error("❌ Database error during sign in:", error);
        // For now, allow sign in if database is not set up
        console.log("⚠️ Allowing sign in due to database error");
        return true;
      }
    },
    async session({ session, token }) {
      try {
        console.log("Session callback - token data:", {
          email: token?.email,
          name: token?.name,
          id: token?.id,
        });

        // Always try to get fresh user data from database using token email
        if (token && token.email) {
          const dbUser = await fixedAdapter.getUserByEmail(token.email);

          if (dbUser) {
            console.log("Found user in database:", {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              isActive: dbUser.isActive,
              isAdmin: dbUser.isAdmin,
            });

            session.user.id = dbUser.id.toString();
            session.user.email = dbUser.email;
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
            session.user.isActive = dbUser.isActive;
            session.user.isAdmin = dbUser.isAdmin;
            session.user.subscriptionTier = dbUser.subscriptionTier || "basic";
          } else {
            console.log("User not found in database:", token.email);
            // User doesn't exist in database - create basic session
            session.user.id = "0";
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.image = (token as any).image as
              | string
              | null
              | undefined;
            session.user.isActive = false;
            session.user.isAdmin = false;
            session.user.subscriptionTier = "basic";
          }
        } else {
          // No token data - create basic session
          console.log("No token data available, creating basic session");
          session.user.id = "0";
          session.user.email = undefined;
          session.user.name = undefined;
          session.user.image = undefined;
          session.user.isActive = false;
          session.user.isAdmin = false;
          session.user.subscriptionTier = "basic";
        }

        console.log("Final session data:", {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isActive: session.user.isActive,
          isAdmin: session.user.isAdmin,
        });
      } catch (error) {
        console.error("Database error during session:", error);
        // Create a basic session on error
        session.user.id = "0";
        session.user.email = undefined;
        session.user.name = undefined;
        session.user.image = undefined;
        session.user.isActive = false;
        session.user.isAdmin = false;
        session.user.subscriptionTier = "basic";
      }

      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log("JWT callback - received data:", {
        user: user ? { email: user.email, name: user.name } : null,
        account: account
          ? {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          : null,
        profile: profile ? { email: profile.email, name: profile.name } : null,
        currentToken: token ? { email: token.email, name: token.name } : null,
      });

      // Prioritize profile data from OAuth over potentially incorrect user data
      if (profile && profile.email) {
        console.log("Using OAuth profile data:", profile.email);
        token.email = profile.email;
        token.name = profile.name;
        token.image = (profile as any).picture;

        // Try to get user data from database using profile email
        try {
          const dbUser = await fixedAdapter.getUserByEmail(profile.email);
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.isActive = dbUser.isActive;
            token.isAdmin = dbUser.isAdmin;
            token.subscriptionTier = dbUser.subscriptionTier || "basic";
          } else {
            // New user - set default values
            token.id = undefined; // Will be set when user is created
            token.isActive = false;
            token.isAdmin = false;
            token.subscriptionTier = "basic";
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
          token.id = undefined;
          token.isActive = false;
          token.isAdmin = false;
          token.subscriptionTier = "basic";
        }
      } else if (user) {
        // Fallback to user data if no profile
        console.log("Using user data:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.isActive = user.isActive;
        token.isAdmin = user.isAdmin;
        token.subscriptionTier = user.subscriptionTier;
      }

      console.log("Final JWT token data:", {
        id: token.id,
        email: token.email,
        name: token.name,
        isActive: token.isActive,
        isAdmin: token.isAdmin,
      });

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};
