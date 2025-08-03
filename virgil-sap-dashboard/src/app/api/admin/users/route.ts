import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.users.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        isAdmin: true,
        created_at: true,
        accessGrantedAt: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    // Transform the data to match the frontend expectations
    const transformedUsers = users.map((user) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      createdAt: user.created_at?.toISOString() || new Date().toISOString(),
      accessGrantedAt: user.accessGrantedAt?.toISOString() || null,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
