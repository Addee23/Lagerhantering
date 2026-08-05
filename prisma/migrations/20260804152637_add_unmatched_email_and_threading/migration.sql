-- AlterTable
ALTER TABLE `complaintemail` ADD COLUMN `inReplyTo` VARCHAR(191) NULL,
    ADD COLUMN `messageId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UnmatchedEmail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(191) NOT NULL,
    `fromAddress` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('OMATCHAD', 'KOPPLAD', 'IRRELEVANT') NOT NULL DEFAULT 'OMATCHAD',
    `linkedComplaintId` INTEGER NULL,

    UNIQUE INDEX `UnmatchedEmail_messageId_key`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ComplaintEmail_messageId_key` ON `ComplaintEmail`(`messageId`);

-- AddForeignKey
ALTER TABLE `UnmatchedEmail` ADD CONSTRAINT `UnmatchedEmail_linkedComplaintId_fkey` FOREIGN KEY (`linkedComplaintId`) REFERENCES `Complaint`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

