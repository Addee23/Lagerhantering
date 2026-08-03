-- CreateTable
CREATE TABLE `Delivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER NOT NULL,
    `deliveryDate` DATETIME(3) NULL,
    `orderNumber` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `status` ENUM('UTKAST', 'GODKAND') NOT NULL DEFAULT 'UTKAST',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `approvedByStaffMemberId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryId` INTEGER NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `documentedQuantity` INTEGER NOT NULL,
    `receivedQuantity` INTEGER NULL,
    `expiryDate` DATETIME(3) NULL,
    `confirmedOk` BOOLEAN NOT NULL DEFAULT false,
    `shortExpiryHandled` BOOLEAN NOT NULL DEFAULT false,
    `shortExpiryDecision` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryIssue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryItemId` INTEGER NOT NULL,
    `type` ENUM('SAKNAS_HELT', 'FARRE_MOTTAGNA', 'FLER_MOTTAGNA', 'EJ_PA_FAKTURA', 'FEL_PRODUKT', 'SKADAD', 'KORT_BAST_FORE', 'FELAKTIGT_PRIS', 'ANNAN') NOT NULL,
    `comment` VARCHAR(191) NULL,
    `damagedQuantity` INTEGER NULL,
    `discarded` BOOLEAN NULL,
    `wantedAction` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DamageImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryIssueId` INTEGER NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_approvedByStaffMemberId_fkey` FOREIGN KEY (`approvedByStaffMemberId`) REFERENCES `StaffMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryDocument` ADD CONSTRAINT `DeliveryDocument_deliveryId_fkey` FOREIGN KEY (`deliveryId`) REFERENCES `Delivery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryItem` ADD CONSTRAINT `DeliveryItem_deliveryId_fkey` FOREIGN KEY (`deliveryId`) REFERENCES `Delivery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryItem` ADD CONSTRAINT `DeliveryItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryIssue` ADD CONSTRAINT `DeliveryIssue_deliveryItemId_fkey` FOREIGN KEY (`deliveryItemId`) REFERENCES `DeliveryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DamageImage` ADD CONSTRAINT `DamageImage_deliveryIssueId_fkey` FOREIGN KEY (`deliveryIssueId`) REFERENCES `DeliveryIssue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
