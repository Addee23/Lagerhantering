-- DropForeignKey
ALTER TABLE `delivery` DROP FOREIGN KEY `Delivery_supplierId_fkey`;

-- DropForeignKey
ALTER TABLE `deliveryitem` DROP FOREIGN KEY `DeliveryItem_productId_fkey`;

-- DropIndex
DROP INDEX `Delivery_supplierId_fkey` ON `delivery`;

-- DropIndex
DROP INDEX `DeliveryItem_productId_fkey` ON `deliveryitem`;

-- AlterTable
ALTER TABLE `delivery` ADD COLUMN `rawSupplierName` VARCHAR(191) NULL,
    ADD COLUMN `source` ENUM('MANUELL', 'AI') NOT NULL DEFAULT 'MANUELL',
    MODIFY `supplierId` INTEGER NULL;

-- AlterTable
ALTER TABLE `deliverydocument` ADD COLUMN `aiAnalyzedAt` DATETIME(3) NULL,
    ADD COLUMN `aiRawResponse` JSON NULL;

-- AlterTable
ALTER TABLE `deliveryitem` ADD COLUMN `fieldConfidence` JSON NULL,
    ADD COLUMN `matchStatus` ENUM('MATCHED', 'SUGGESTED', 'UNMATCHED') NOT NULL DEFAULT 'MATCHED',
    ADD COLUMN `rawBarcode` VARCHAR(191) NULL,
    ADD COLUMN `rawProductName` VARCHAR(191) NULL,
    ADD COLUMN `supplierArticleNumber` VARCHAR(191) NULL,
    MODIFY `productId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryItem` ADD CONSTRAINT `DeliveryItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
