ALTER TABLE "User"
  RENAME COLUMN "password" TO "passwordHash";

ALTER TABLE "User"
  RENAME COLUMN "updateAt" TO "updatedAt";

ALTER TABLE "User"
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationCodeHash" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);
