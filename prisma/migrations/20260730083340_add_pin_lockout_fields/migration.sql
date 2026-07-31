-- AlterTable
ALTER TABLE `staffmember` ADD COLUMN `failedPinAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pinLockedUntil` DATETIME(3) NULL;
