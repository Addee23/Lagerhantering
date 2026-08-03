-- CreateTable
CREATE TABLE `PickupList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('UTKAST', 'KLAR_ATT_HAMTA', 'HAMTNING_PAGAR', 'SLUTFORD', 'AVBRUTEN') NOT NULL DEFAULT 'UTKAST',
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `completedByStaffMemberId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PickupListItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pickupListId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `requestedQuantity` INTEGER NOT NULL,
    `actualQuantity` INTEGER NULL,
    `isMissing` BOOLEAN NOT NULL DEFAULT false,
    `isPartial` BOOLEAN NOT NULL DEFAULT false,
    `comment` VARCHAR(191) NULL,
    `pickedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PickupList` ADD CONSTRAINT `PickupList_completedByStaffMemberId_fkey` FOREIGN KEY (`completedByStaffMemberId`) REFERENCES `StaffMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PickupListItem` ADD CONSTRAINT `PickupListItem_pickupListId_fkey` FOREIGN KEY (`pickupListId`) REFERENCES `PickupList`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PickupListItem` ADD CONSTRAINT `PickupListItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
