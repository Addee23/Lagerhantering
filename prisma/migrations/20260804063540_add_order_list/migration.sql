-- CreateTable
CREATE TABLE `OrderListItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `supplierId` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `priority` ENUM('LAG', 'NORMAL', 'HOG') NOT NULL DEFAULT 'NORMAL',
    `quantity` INTEGER NULL,
    `status` ENUM('ATT_BESTALLA', 'BESTALLD', 'MOTTAGEN', 'AVBRUTEN') NOT NULL DEFAULT 'ATT_BESTALLA',
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orderedAt` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderListItem` ADD CONSTRAINT `OrderListItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderListItem` ADD CONSTRAINT `OrderListItem_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
