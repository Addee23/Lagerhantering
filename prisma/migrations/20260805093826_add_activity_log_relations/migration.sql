-- AlterTable
ALTER TABLE `activitylog` ADD COLUMN `complaintId` INTEGER NULL,
    ADD COLUMN `deliveryId` INTEGER NULL,
    ADD COLUMN `pickupListId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_deliveryId_fkey` FOREIGN KEY (`deliveryId`) REFERENCES `Delivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_pickupListId_fkey` FOREIGN KEY (`pickupListId`) REFERENCES `PickupList`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

