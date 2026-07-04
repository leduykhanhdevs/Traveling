CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
  "dietaryRestrictions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "travelStyle" TEXT NOT NULL DEFAULT 'local',
  "spicyPreference" INTEGER NOT NULL DEFAULT 3,
  "sweetPreference" INTEGER NOT NULL DEFAULT 3,
  "savoryPreference" INTEGER NOT NULL DEFAULT 3,
  "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
  "nationality" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "results" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedPlace" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "text" TEXT NOT NULL,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "nationality" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Translation" (
  "id" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "sourceText" TEXT NOT NULL,
  "sourceLang" TEXT NOT NULL,
  "targetLang" TEXT NOT NULL,
  "translatedText" TEXT NOT NULL,
  "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Itinerary" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "budgetRange" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Follow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");
CREATE UNIQUE INDEX "SavedPlace_userId_placeId_key" ON "SavedPlace"("userId", "placeId");
CREATE INDEX "SavedPlace_userId_savedAt_idx" ON "SavedPlace"("userId", "savedAt");
CREATE INDEX "Review_placeId_createdAt_idx" ON "Review"("placeId", "createdAt");
CREATE INDEX "Review_nationality_createdAt_idx" ON "Review"("nationality", "createdAt");
CREATE UNIQUE INDEX "Translation_hash_key" ON "Translation"("hash");
CREATE INDEX "Translation_sourceLang_targetLang_idx" ON "Translation"("sourceLang", "targetLang");
CREATE INDEX "Itinerary_userId_createdAt_idx" ON "Itinerary"("userId", "createdAt");
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
