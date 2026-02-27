-- CreateTable
CREATE TABLE "intel_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockHeight" INTEGER NOT NULL,
    "intelPayload" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "intel_posts_timestamp_idx" ON "intel_posts"("timestamp");

-- CreateIndex
CREATE INDEX "intel_posts_category_idx" ON "intel_posts"("category");

-- CreateIndex
CREATE INDEX "intel_posts_blockHeight_idx" ON "intel_posts"("blockHeight");
