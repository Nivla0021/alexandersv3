import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all settings (keys only)
export async function GET() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: 'asc' },
    select: { key: true }
  });

  return NextResponse.json(settings);
}

// POST create new setting
export async function POST(req: Request) {
  const { key, value } = await req.json();

  const setting = await prisma.setting.create({
    data: { key, value }
  });

  return NextResponse.json(setting);
}

// PUT update setting key
export async function PUT(req: Request) {
  const { oldKey, newKey } = await req.json();

  const existing = await prisma.setting.findUnique({
    where: { key: oldKey }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
  }

  // Delete old and create new with same value
  await prisma.setting.delete({ where: { key: oldKey } });

  const updated = await prisma.setting.create({
    data: { key: newKey, value: existing.value }
  });

  return NextResponse.json(updated);
}