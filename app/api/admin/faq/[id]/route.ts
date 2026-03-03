// app/api/admin/faq/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================
   GET FAQ
========================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const faq = await prisma.fAQ.findUnique({
      where: { id: Number(id) },
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json(faq);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch FAQ" },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE FAQ
========================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    const { question, answer, isActive } = await req.json();

    if (question && (question.length < 5 || question.length > 300)) {
      return NextResponse.json(
        { error: "Question must be 5-300 characters long" },
        { status: 400 }
      );
    }

    if (answer && (answer.length < 10 || answer.length > 2000)) {
      return NextResponse.json(
        { error: "Answer must be 10-2000 characters long" },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id: numericId },
      data: { question, answer, isActive },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE FAQ
========================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.fAQ.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}