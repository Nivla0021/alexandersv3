import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET ALL USERS
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// CREATE ADMIN / STORE-MANAGER
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    // Required validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Allow only admin and store-manager
    if (!["admin", "store-manager"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Only admin or store-manager allowed." },
        { status: 403 }
      );
    }

    // Check email duplicate
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name,
        email,
        password: hashed,
        role,
        phone: phone || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
