-- CreateTable
CREATE TABLE `Complaint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintNumber` VARCHAR(191) NOT NULL,
    `deliveryId` INTEGER NOT NULL,
    `supplierId` INTEGER NOT NULL,
    `status` ENUM('UTKAST', 'SKICKAD', 'VANTAR_PA_SVAR', 'KREDITERAD', 'ERSATT', 'BEHOVER_KOMPLETTERAS', 'AVVISAD_AV_LEVERANTOR', 'AVSLUTAD', 'AVBRUTEN') NOT NULL DEFAULT 'UTKAST',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Complaint_complaintNumber_key`(`complaintNumber`),
    UNIQUE INDEX `Complaint_deliveryId_key`(`deliveryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintId` INTEGER NOT NULL,
    `deliveryIssueId` INTEGER NOT NULL,

    UNIQUE INDEX `ComplaintItem_deliveryIssueId_key`(`deliveryIssueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintEmail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintId` INTEGER NOT NULL,
    `direction` VARCHAR(191) NOT NULL DEFAULT 'utgaende',
    `toAddress` VARCHAR(191) NOT NULL,
    `ccAddress` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,
    `sentByStaffMemberId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintEmailId` INTEGER NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_deliveryId_fkey` FOREIGN KEY (`deliveryId`) REFERENCES `Delivery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintItem` ADD CONSTRAINT `ComplaintItem_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintItem` ADD CONSTRAINT `ComplaintItem_deliveryIssueId_fkey` FOREIGN KEY (`deliveryIssueId`) REFERENCES `DeliveryIssue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintEmail` ADD CONSTRAINT `ComplaintEmail_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintEmail` ADD CONSTRAINT `ComplaintEmail_sentByStaffMemberId_fkey` FOREIGN KEY (`sentByStaffMemberId`) REFERENCES `StaffMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailAttachment` ADD CONSTRAINT `EmailAttachment_complaintEmailId_fkey` FOREIGN KEY (`complaintEmailId`) REFERENCES `ComplaintEmail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
