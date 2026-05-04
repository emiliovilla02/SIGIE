/*
  Warnings:

  - You are about to drop the column `alumnoId` on the `Incidente` table. All the data in the column will be lost.
  - Added the required column `autorId` to the `Seguimiento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Incidente` DROP FOREIGN KEY `Incidente_alumnoId_fkey`;

-- DropIndex
DROP INDEX `Incidente_alumnoId_fkey` ON `Incidente`;

-- AlterTable
ALTER TABLE `Alumno` ADD COLUMN `tutorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Incidente` DROP COLUMN `alumnoId`,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'ABIERTO';

-- AlterTable
ALTER TABLE `Seguimiento` ADD COLUMN `autorId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Tutor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellidoPaterno` VARCHAR(191) NOT NULL,
    `apellidoMaterno` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,

    UNIQUE INDEX `Tutor_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AlumnoToIncidente` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AlumnoToIncidente_AB_unique`(`A`, `B`),
    INDEX `_AlumnoToIncidente_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Alumno` ADD CONSTRAINT `Alumno_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Tutor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AlumnoToIncidente` ADD CONSTRAINT `_AlumnoToIncidente_A_fkey` FOREIGN KEY (`A`) REFERENCES `Alumno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AlumnoToIncidente` ADD CONSTRAINT `_AlumnoToIncidente_B_fkey` FOREIGN KEY (`B`) REFERENCES `Incidente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
