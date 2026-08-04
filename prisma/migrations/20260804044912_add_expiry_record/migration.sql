-- CreateTable
CREATE TABLE `ExpiryRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `expiryDate` DATETIME(3) NULL,
    `quantityRemaining` INTEGER NOT NULL,
    `placement` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `status` ENUM('AKTIV', 'AVSLUTAD') NOT NULL DEFAULT 'AKTIV',
    `lastCheckedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolution` VARCHAR(191) NULL,
    `discardedQuantity` INTEGER NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedByStaffMemberId` INTEGER NULL,
    `pickupListItemId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExpiryRecord` ADD CONSTRAINT `ExpiryRecord_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpiryRecord` ADD CONSTRAINT `ExpiryRecord_resolvedByStaffMemberId_fkey` FOREIGN KEY (`resolvedByStaffMemberId`) REFERENCES `StaffMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpiryRecord` ADD CONSTRAINT `ExpiryRecord_pickupListItemId_fkey` FOREIGN KEY (`pickupListItemId`) REFERENCES `PickupListItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
