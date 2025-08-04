import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isActive: boolean;
      isAdmin: boolean;
      subscriptionTier: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    isActive: boolean;
    isAdmin: boolean;
    subscriptionTier?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isActive?: boolean;
    isAdmin?: boolean;
    subscriptionTier?: string;
  }
}
