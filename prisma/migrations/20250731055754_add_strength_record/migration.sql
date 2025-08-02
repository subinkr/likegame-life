-- CreateTable
CREATE TABLE "public"."StrengthRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bench" INTEGER NOT NULL DEFAULT 0,
    "squat" INTEGER NOT NULL DEFAULT 0,
    "deadlift" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrengthRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."StrengthRecord" ADD CONSTRAINT "StrengthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
