/*
  Warnings:

  - You are about to drop the `Tutor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Alumno` DROP FOREIGN KEY `Alumno_tutorId_fkey`;

-- DropIndex
DROP INDEX `Alumno_tutorId_fkey` ON `Alumno`;

-- AlterTable
ALTER TABLE `Alumno` ADD COLUMN `grupo` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `gruposAsignados` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Tutor`;

-- AddForeignKey
ALTER TABLE `Alumno` ADD CONSTRAINT `Alumno_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
