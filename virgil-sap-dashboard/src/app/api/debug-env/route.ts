import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "Set" : "Missing",
    DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Missing",
  });
}
