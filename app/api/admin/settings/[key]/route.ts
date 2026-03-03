// api/admin/settings/[key]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================
   GET SETTING
========================= */
export async function GET(
  _: Request,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  const setting = await prisma.setting.findUnique({
    where: { key }
  });

  return NextResponse.json(setting);
}

/* =========================
   UPDATE SETTING
========================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  const { value } = await req.json();

  const setting = await prisma.setting.update({
    where: { key },
    data: { value }
  });

  return NextResponse.json(setting);
}

/* =========================
   DELETE SETTING
========================= */
export async function DELETE(
  _: Request,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  await prisma.setting.delete({
    where: { key },
  });

  return NextResponse.json({ success: true });
}