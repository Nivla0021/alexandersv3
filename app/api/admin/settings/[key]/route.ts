import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(_: Request, { params }: any) {
const setting = await prisma.setting.findUnique({
where: { key: params.key }
});


return NextResponse.json(setting);
}


export async function PUT(req: Request, { params }: any) {
const { value } = await req.json();


const setting = await prisma.setting.update({
  where: { key: params.key },
  data: { value }
});


return NextResponse.json(setting);
}

// ✅ DELETE handler
export async function DELETE(_: Request, { params }: any) {
  await prisma.setting.delete({
    where: { key: params.key },
  });

  return NextResponse.json({ success: true });
}