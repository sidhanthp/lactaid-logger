import { getPrisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.symptoms !== undefined) data.symptoms = body.symptoms;
  if (body.symptomNotes !== undefined) data.symptomNotes = body.symptomNotes;
  if (body.timestamp !== undefined) data.createdAt = new Date(body.timestamp);

  const meal = await prisma.meal.update({ where: { id }, data });
  return Response.json({
    id: meal.id,
    timestamp: meal.createdAt.getTime(),
    food: meal.food,
    dairyLevel: meal.dairyLevel,
    estimatedLactoseGrams: meal.estimatedLactoseGrams,
    lactaidPills: meal.lactaidPills,
    symptoms: meal.symptoms,
    symptomNotes: meal.symptomNotes,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  const { id } = await params;
  await prisma.meal.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
