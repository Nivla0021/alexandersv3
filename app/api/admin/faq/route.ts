// app/api/admin/faq/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET – fetch all FAQs
export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

// POST – create FAQ
export async function POST(req: Request) {
  try {
    const { question, answer, isActive = true } = await req.json();

    if (!question || question.length < 5 || question.length > 300) {
      return NextResponse.json(
        { error: "Question must be 5-300 characters long" },
        { status: 400 }
      );
    }

    if (!answer || answer.length < 10 || answer.length > 2000) {
      return NextResponse.json(
        { error: "Answer must be 10-2000 characters long" },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.create({
      data: { question, answer, isActive },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
