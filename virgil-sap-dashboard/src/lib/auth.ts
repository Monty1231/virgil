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

        const userEmail = profile?.email || user?.email;
        const userName = profile?.name || user?.name;
        const userImage = (profile as any)?.picture || (user as any)?.image;

        if (!userEmail) {
          console.error("❌ No email found in OAuth data");
          return false;
        }

        console.log("🔍 Checking for user with email:", userEmail);

        const existingUser = await fixedAdapter.getUserByEmail(userEmail);

        if (existingUser) {
          // Allow sign-in for both active and inactive users.
          // Inactive users will be redirected to pricing by middleware/UI to complete payment.
          return true;
        }

        // New user - create pending account (not admin by default)
        console.log("🆕 Creating new user:", userEmail);
        const newUser = await fixedAdapter.createUser({
          email: userEmail,
          name: userName || "Unknown User",
          image: userImage,
          isActive: false,
          role: "sales_rep",
        });

        if (account) {
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
          } catch (linkError) {
            console.error("❌ Error linking OAuth account:", linkError);
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Database error during sign in:", error);
        console.log("⚠️ Allowing sign in due to database error");
        return true;
      }
    },
    async session({ session, token }) {
      try {
        if (token && token.email) {
          const dbUser = await fixedAdapter.getUserByEmail(token.email);
          if (dbUser) {
            session.user.id = dbUser.id.toString();
            session.user.email = dbUser.email;
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
            session.user.isActive = dbUser.isActive;
            session.user.isAdmin = dbUser.isAdmin;
            session.user.subscriptionTier = dbUser.subscriptionTier || "basic";
            (session.user as any).organizationId =
              dbUser.organizationId || null;
          } else {
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
            (session.user as any).organizationId = null;
          }
        } else {
          session.user.id = "0";
          session.user.email = undefined;
          session.user.name = undefined;
          session.user.image = undefined;
          session.user.isActive = false;
          session.user.isAdmin = false;
          session.user.subscriptionTier = "basic";
          (session.user as any).organizationId = null;
        }
      } catch (error) {
        console.error("Database error during session:", error);
        session.user.id = "0";
        session.user.email = undefined;
        session.user.name = undefined;
        session.user.image = undefined;
        session.user.isActive = false;
        session.user.isAdmin = false;
        session.user.subscriptionTier = "basic";
        (session.user as any).organizationId = null;
      }

      return session;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      // When session.update() is called client-side, refresh token values from DB
      if (trigger === "update" && token?.email) {
        try {
          const dbUser = await fixedAdapter.getUserByEmail(token.email);
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.isActive = dbUser.isActive;
            token.isAdmin = dbUser.isAdmin;
            token.subscriptionTier = dbUser.subscriptionTier || "basic";
            (token as any).organizationId = dbUser.organizationId || null;
          }
        } catch (e) {
          console.error("JWT update trigger DB refresh failed:", e);
        }
      }

      if (profile && profile.email) {
        token.email = profile.email;
        token.name = profile.name;
        token.image = (profile as any).picture;
        try {
          const dbUser = await fixedAdapter.getUserByEmail(profile.email);
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.isActive = dbUser.isActive;
            token.isAdmin = dbUser.isAdmin;
            token.subscriptionTier = dbUser.subscriptionTier || "basic";
            (token as any).organizationId = dbUser.organizationId || null;
          } else {
            token.id = undefined;
            token.isActive = false;
            token.isAdmin = false;
            token.subscriptionTier = "basic";
            (token as any).organizationId = null;
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
          token.id = undefined;
          token.isActive = false;
          token.isAdmin = false;
          token.subscriptionTier = "basic";
          (token as any).organizationId = null;
        }
      } else if (user) {
        token.id = user.id as any;
        token.email = user.email as any;
        token.name = user.name as any;
        token.image = (user as any).image as any;
        token.isActive = (user as any).isActive as any;
        token.isAdmin = (user as any).isAdmin as any;
        token.subscriptionTier = (user as any).subscriptionTier as any;
      }
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
