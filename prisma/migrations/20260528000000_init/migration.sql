-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "food" TEXT NOT NULL,
    "dairyLevel" TEXT NOT NULL,
    "estimatedLactoseGrams" DOUBLE PRECISION NOT NULL,
    "lactaidPills" INTEGER NOT NULL,
    "symptoms" TEXT,
    "symptomNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);
