/*
  Warnings:

  - You are about to drop the column `gruposAsignados` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `gruposAsignados`,
    ADD COLUMN `gradoAsignado` VARCHAR(191) NULL,
    ADD COLUMN `grupoAsignado` VARCHAR(191) NULL;
