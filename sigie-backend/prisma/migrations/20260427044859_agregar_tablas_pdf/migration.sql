/*
  Warnings:

  - You are about to drop the column `fecha` on the `Incidente` table. All the data in the column will be lost.
  - Added the required column `apellidoPaterno` to the `Alumno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apellidoPaterno` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Alumno` ADD COLUMN `apellidoMaterno` VARCHAR(191) NULL,
    ADD COLUMN `apellidoPaterno` VARCHAR(191) NOT NULL,
    ADD COLUMN `expedienteMedico` TEXT NULL;

-- AlterTable
ALTER TABLE `Incidente` DROP COLUMN `fecha`,
    ADD COLUMN `colonia` VARCHAR(191) NULL,
    ADD COLUMN `descripcionBreve` VARCHAR(191) NULL,
    ADD COLUMN `fechaIncidencia` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `horaIncidencia` VARCHAR(191) NULL,
    ADD COLUMN `municipio` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `apellidoMaterno` VARCHAR(191) NULL,
    ADD COLUMN `apellidoPaterno` VARCHAR(191) NOT NULL,
    ADD COLUMN `calle` VARCHAR(191) NULL,
    ADD COLUMN `correoSecundario` VARCHAR(191) NULL,
    ADD COLUMN `cp` VARCHAR(191) NULL,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'ACTIVO',
    ADD COLUMN `telefono1` VARCHAR(191) NULL,
    ADD COLUMN `telefono2` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Seguimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descripcion` TEXT NOT NULL,
    `incidenteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reporte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaElaboracion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `horaElaboracion` VARCHAR(191) NULL,
    `contenido` TEXT NOT NULL,
    `creadoPorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtencionMedica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaAtencion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nombreIntervencion` VARCHAR(191) NOT NULL,
    `telefonoIntervencion` VARCHAR(191) NULL,
    `descripcion` TEXT NOT NULL,
    `alumnoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_incidenteId_fkey` FOREIGN KEY (`incidenteId`) REFERENCES `Incidente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reporte` ADD CONSTRAINT `Reporte_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtencionMedica` ADD CONSTRAINT `AtencionMedica_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `Alumno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
