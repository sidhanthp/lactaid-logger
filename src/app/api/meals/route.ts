import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET() {
  const meals = await prisma.meal.findMany({ orderBy: { createdAt: 'desc' } });
  const mapped = meals.map(m => ({
    id: m.id,
    timestamp: m.createdAt.getTime(),
    food: m.food,
    dairyLevel: m.dairyLevel,
    estimatedLactoseGrams: m.estimatedLactoseGrams,
    lactaidPills: m.lactaidPills,
    symptoms: m.symptoms,
    symptomNotes: m.symptomNotes,
  }));
  return Response.json(mapped);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const meal = await prisma.meal.create({
    data: {
      food: body.food,
      dairyLevel: body.dairyLevel,
      estimatedLactoseGrams: body.estimatedLactoseGrams,
      lactaidPills: body.lactaidPills,
    },
  });
  return Response.json({
    id: meal.id,
    timestamp: meal.createdAt.getTime(),
    food: meal.food,
    dairyLevel: meal.dairyLevel,
    estimatedLactoseGrams: meal.estimatedLactoseGrams,
    lactaidPills: meal.lactaidPills,
    symptoms: meal.symptoms,
    symptomNotes: meal.symptomNotes,
  }, { status: 201 });
}
