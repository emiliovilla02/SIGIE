/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sigie_db
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Alumno`
--

DROP TABLE IF EXISTS `Alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Alumno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `grado` varchar(191) NOT NULL,
  `apellidoMaterno` varchar(191) DEFAULT NULL,
  `apellidoPaterno` varchar(191) NOT NULL,
  `expedienteMedico` text DEFAULT NULL,
  `tutorId` int(11) DEFAULT NULL,
  `grupo` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Alumno_matricula_key` (`matricula`),
  KEY `Alumno_tutorId_fkey` (`tutorId`),
  CONSTRAINT `Alumno_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Alumno`
--

LOCK TABLES `Alumno` WRITE;
/*!40000 ALTER TABLE `Alumno` DISABLE KEYS */;
INSERT INTO `Alumno` VALUES
(1,'20260001','Emilio','4','Villa','Hernández','Tipo de Sangre: A+\nAlergias: Nueces y Penicilina.',3,'A'),
(2,'20260002','Rafael','3','Constantino','Martinez','Tipo de sangre: O+\nAlergias: Abejas, Nueces, Penicilina.',9,'B'),
(3,'25A0818','Angel','4','Álvarez ','Fernández ','',6,'C'),
(4,'2301849','Jorge Luis ','6','García ','Moreno ','Alergia al polvo, pequeño grado de autismo ',7,'A'),
(5,'23070400','Lola ','1','Hernandez','Cruz','Asma',13,'A');
/*!40000 ALTER TABLE `Alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AtencionMedica`
--

DROP TABLE IF EXISTS `AtencionMedica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AtencionMedica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fechaAtencion` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `nombreIntervencion` varchar(191) NOT NULL,
  `telefonoIntervencion` varchar(191) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `alumnoId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AtencionMedica_alumnoId_fkey` (`alumnoId`),
  CONSTRAINT `AtencionMedica_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `Alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AtencionMedica`
--

LOCK TABLES `AtencionMedica` WRITE;
/*!40000 ALTER TABLE `AtencionMedica` DISABLE KEYS */;
INSERT INTO `AtencionMedica` VALUES
(1,'2026-05-13 11:12:31.195','Dolor de cabeza','8331526090','se tomo una pastilla',5);
/*!40000 ALTER TABLE `AtencionMedica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Auditoria`
--

DROP TABLE IF EXISTS `Auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Auditoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `accion` varchar(191) NOT NULL,
  `entidad` varchar(191) NOT NULL,
  `entidadId` int(11) DEFAULT NULL,
  `detalles` text NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Auditoria_usuarioId_fkey` (`usuarioId`),
  CONSTRAINT `Auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Auditoria`
--

LOCK TABLES `Auditoria` WRITE;
/*!40000 ALTER TABLE `Auditoria` DISABLE KEYS */;
INSERT INTO `Auditoria` VALUES
(1,'2026-05-03 23:37:39.788','ELIMINAR_INCIDENTE','INCIDENTE',2,'Se eliminó reporte de tipo \"Médico\" (Gravedad: Leve). Alumnos implicados: Emilio Hernández. Descripción original: Dolor de cabeza',1,NULL),
(2,'2026-05-13 16:01:26.647','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2a09:bac5:4ca8:10c8::1ac:58',1,'2a09:bac5:4ca8:10c8::1ac:58'),
(3,'2026-05-13 16:04:38.239','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',8,'45.175.233.158'),
(4,'2026-05-13 16:04:47.205','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(5,'2026-05-13 16:06:37.179','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(6,'2026-05-13 16:07:48.597','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(7,'2026-05-13 16:08:51.706','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(8,'2026-05-13 16:09:13.416','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(9,'2026-05-13 16:15:43.159','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(10,'2026-05-13 16:16:00.081','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(11,'2026-05-13 16:28:03.735','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',8,'45.175.233.158'),
(12,'2026-05-14 15:49:54.176','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(13,'2026-05-14 15:58:48.335','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(14,'2026-05-14 16:14:29.775','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(15,'2026-05-14 16:25:08.352','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(16,'2026-05-14 16:52:25.128','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(17,'2026-05-14 16:53:55.032','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(18,'2026-05-14 16:57:19.329','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(19,'2026-05-14 17:06:41.323','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2a09:bac5:4ca8:773::be:61',1,'2a09:bac5:4ca8:773::be:61'),
(20,'2026-05-14 17:07:33.325','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(21,'2026-05-14 17:08:18.394','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(22,'2026-05-14 17:09:33.244','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',13,'45.175.233.158'),
(23,'2026-05-14 17:12:02.126','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 45.175.233.158',1,'45.175.233.158'),
(24,'2026-05-14 23:06:25.957','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f4fd:1ddb:87d7:eb40:b56d',13,'2806:109f:d:f4fd:1ddb:87d7:eb40:b56d'),
(25,'2026-05-16 08:44:24.307','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(26,'2026-05-16 08:49:37.614','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(27,'2026-05-16 08:50:21.768','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(28,'2026-05-16 08:58:39.842','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(29,'2026-05-16 09:17:41.149','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(30,'2026-05-16 09:35:19.799','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(31,'2026-05-16 11:50:23.944','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(32,'2026-05-16 14:33:17.450','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(33,'2026-05-16 15:02:10.962','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(34,'2026-05-16 15:09:55.476','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',1,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(35,'2026-05-16 15:10:16.660','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(36,'2026-05-16 15:58:59.374','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(37,'2026-05-16 16:19:12.959','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',13,'2806:109f:d:f988:a492:6a75:77d5:3a0a'),
(38,'2026-05-16 19:27:37.375','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:5956:9246:6d22:b6e5',1,'2806:370:4385:6f8f:5956:9246:6d22:b6e5'),
(39,'2026-05-16 19:28:19.430','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:5956:9246:6d22:b6e5',13,'2806:370:4385:6f8f:5956:9246:6d22:b6e5'),
(40,'2026-05-16 19:37:47.409','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2a09:bac5:4c40:773::be:3f',1,'2a09:bac5:4c40:773::be:3f'),
(41,'2026-05-16 19:51:10.932','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2a09:bac5:4c40:773::be:3f',1,'2a09:bac5:4c40:773::be:3f'),
(42,'2026-05-16 21:33:20.559','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:3b9c:307d:eb57:e0ee',1,'2806:370:4385:6f8f:3b9c:307d:eb57:e0ee'),
(43,'2026-05-16 21:33:48.165','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:3b9c:307d:eb57:e0ee',13,'2806:370:4385:6f8f:3b9c:307d:eb57:e0ee'),
(44,'2026-05-16 22:55:32.437','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:fc37:6f2f:8c8f:96b',1,'2806:370:4385:6f8f:fc37:6f2f:8c8f:96b'),
(45,'2026-05-16 22:56:26.248','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:fc37:6f2f:8c8f:96b',13,'2806:370:4385:6f8f:fc37:6f2f:8c8f:96b'),
(46,'2026-05-16 22:59:00.017','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:fc37:6f2f:8c8f:96b',13,'2806:370:4385:6f8f:fc37:6f2f:8c8f:96b'),
(47,'2026-05-17 01:34:14.893','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:d6b0:ce84:9c13:61bd',13,'2806:370:4385:6f8f:d6b0:ce84:9c13:61bd'),
(48,'2026-05-17 01:35:12.855','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:370:4385:6f8f:d6b0:ce84:9c13:61bd',1,'2806:370:4385:6f8f:d6b0:ce84:9c13:61bd'),
(49,'2026-05-17 02:00:04.680','ACCESO_SISTEMA','SISTEMA',NULL,'Inicio de sesión exitoso desde IP: 2806:109f:d:f988:a492:6a75:77d5:3a0a',1,'2806:109f:d:f988:a492:6a75:77d5:3a0a');
/*!40000 ALTER TABLE `Auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Aviso`
--

DROP TABLE IF EXISTS `Aviso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Aviso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fechaCreacion` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `asunto` varchar(191) NOT NULL,
  `mensaje` text NOT NULL,
  `tipoAviso` varchar(191) NOT NULL,
  `destinosRoles` varchar(191) NOT NULL,
  `estado` varchar(191) NOT NULL DEFAULT 'ENVIADO',
  `creadoPorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Aviso_creadoPorId_fkey` (`creadoPorId`),
  CONSTRAINT `Aviso_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Aviso`
--

LOCK TABLES `Aviso` WRITE;
/*!40000 ALTER TABLE `Aviso` DISABLE KEYS */;
INSERT INTO `Aviso` VALUES
(1,'2026-05-13 06:44:54.540','junta en el salón ','el dia de mañana','Aviso General','TUTOR','ENVIADO',1),
(2,'2026-05-13 11:03:20.348','suspension de clases ','por dia festivo ','Aviso General','TUTOR,DOCENTE','ENVIADO',13);
/*!40000 ALTER TABLE `Aviso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ConfiguracionBackup`
--

DROP TABLE IF EXISTS `ConfiguracionBackup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ConfiguracionBackup` (
  `id` int(11) NOT NULL DEFAULT 1,
  `intervalo` varchar(191) NOT NULL DEFAULT 'DIARIO',
  `correoDestino` varchar(191) NOT NULL,
  `ultimoRespaldo` datetime(3) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ConfiguracionBackup`
--

LOCK TABLES `ConfiguracionBackup` WRITE;
/*!40000 ALTER TABLE `ConfiguracionBackup` DISABLE KEYS */;
INSERT INTO `ConfiguracionBackup` VALUES
(1,'SEMANAL','emiliovilla4821@gmail.com',NULL,1);
/*!40000 ALTER TABLE `ConfiguracionBackup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `HistorialBackup`
--

DROP TABLE IF EXISTS `HistorialBackup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `HistorialBackup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fechaCreacion` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `nombreArchivo` varchar(191) NOT NULL,
  `tamanoBytes` int(11) DEFAULT NULL,
  `estado` varchar(191) NOT NULL DEFAULT 'EXITOSO',
  `tipo` varchar(191) NOT NULL DEFAULT 'AUTOMATICO',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HistorialBackup`
--

LOCK TABLES `HistorialBackup` WRITE;
/*!40000 ALTER TABLE `HistorialBackup` DISABLE KEYS */;
/*!40000 ALTER TABLE `HistorialBackup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Incidente`
--

DROP TABLE IF EXISTS `Incidente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Incidente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(191) NOT NULL,
  `gravedad` varchar(191) NOT NULL,
  `descripcion` text NOT NULL,
  `reportadoPorId` int(11) NOT NULL,
  `colonia` varchar(191) DEFAULT NULL,
  `descripcionBreve` varchar(191) DEFAULT NULL,
  `fechaIncidencia` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `horaIncidencia` varchar(191) DEFAULT NULL,
  `municipio` varchar(191) DEFAULT NULL,
  `estado` varchar(191) NOT NULL DEFAULT 'ABIERTO',
  `folio` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Incidente_folio_key` (`folio`),
  KEY `Incidente_reportadoPorId_fkey` (`reportadoPorId`),
  CONSTRAINT `Incidente_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Incidente`
--

LOCK TABLES `Incidente` WRITE;
/*!40000 ALTER TABLE `Incidente` DISABLE KEYS */;
INSERT INTO `Incidente` VALUES
(1,'Médico','Leve','Estaba sentado en el escritorio mientras la clase realizaba la actividad y el niño se levanto hasta mi escritorio para decirme que se le dolía el estomago, entonces lo lleve a enfermería para que lo revisara la enfermera María.',1,NULL,'Dolor de estomago en clase','2026-04-28 00:57:16.491',NULL,NULL,'CERRADO',NULL),
(3,'Daño','Leve','El alumno aventó una silla contra la ventana del aula de tal manera que fue rota.',1,NULL,'Ventana rota','2026-04-29 01:18:23.458',NULL,NULL,'CERRADO',NULL),
(4,'Médico','Leve','Durante la clase el alumno comento que se estaba sintiendo dolor de cabeza y el cuerpo caliente. Fue enviado a enfermería para ser revisado.',2,NULL,'Fiebre','2026-05-03 20:14:48.603',NULL,NULL,'CERRADO',NULL),
(5,'Daño','Leve','El alumno hizo rayones sobre el mesa banco con plumones.',2,NULL,'Daño al mesa banco','2026-05-03 21:32:00.421',NULL,NULL,'EN_PROCESO',NULL),
(6,'Bullying','Media','El alumno Jorge Luis está acosando y haciéndole burlas al alumno Rafael ',1,NULL,'Acoso hacia Rafael','2026-05-06 14:35:46.941',NULL,NULL,'CERRADO',NULL),
(7,'Otro','Leve','la comida que comio le cayo mal ',13,NULL,'Dolor de estomago ','2026-05-13 10:32:21.742',NULL,NULL,'ABIERTO','INC-2026-0007'),
(8,'Médico','Leve','durante en la hora de descanso se comió algo que le cayo mal',13,NULL,'Dolor de estomago ','2026-05-13 12:16:29.491',NULL,NULL,'EN_PROCESO','INC-2026-0008');
/*!40000 ALTER TABLE `Incidente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `IntervencionExterna`
--

DROP TABLE IF EXISTS `IntervencionExterna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `IntervencionExterna` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipoIntervencion` varchar(191) NOT NULL,
  `entidad` varchar(191) NOT NULL,
  `fechaHora` datetime(3) NOT NULL,
  `noReporteOficial` varchar(191) DEFAULT NULL,
  `responsable` varchar(191) DEFAULT NULL,
  `observaciones` text NOT NULL,
  `estado` varchar(191) NOT NULL DEFAULT 'EN_CURSO',
  `incidenteId` int(11) NOT NULL,
  `registradoPorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IntervencionExterna_incidenteId_fkey` (`incidenteId`),
  KEY `IntervencionExterna_registradoPorId_fkey` (`registradoPorId`),
  CONSTRAINT `IntervencionExterna_incidenteId_fkey` FOREIGN KEY (`incidenteId`) REFERENCES `Incidente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `IntervencionExterna_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `IntervencionExterna`
--

LOCK TABLES `IntervencionExterna` WRITE;
/*!40000 ALTER TABLE `IntervencionExterna` DISABLE KEYS */;
/*!40000 ALTER TABLE `IntervencionExterna` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Reporte`
--

DROP TABLE IF EXISTS `Reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reporte` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fechaElaboracion` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `horaElaboracion` varchar(191) DEFAULT NULL,
  `contenido` text NOT NULL,
  `creadoPorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Reporte_creadoPorId_fkey` (`creadoPorId`),
  CONSTRAINT `Reporte_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reporte`
--

LOCK TABLES `Reporte` WRITE;
/*!40000 ALTER TABLE `Reporte` DISABLE KEYS */;
/*!40000 ALTER TABLE `Reporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Seguimiento`
--

DROP TABLE IF EXISTS `Seguimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Seguimiento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `descripcion` text NOT NULL,
  `incidenteId` int(11) NOT NULL,
  `autorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Seguimiento_incidenteId_fkey` (`incidenteId`),
  KEY `Seguimiento_autorId_fkey` (`autorId`),
  CONSTRAINT `Seguimiento_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `Usuario` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Seguimiento_incidenteId_fkey` FOREIGN KEY (`incidenteId`) REFERENCES `Incidente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Seguimiento`
--

LOCK TABLES `Seguimiento` WRITE;
/*!40000 ALTER TABLE `Seguimiento` DISABLE KEYS */;
INSERT INTO `Seguimiento` VALUES
(1,'2026-04-28 01:05:08.258','El alumno fue atendido por la enfermera María se le suministro una dosis pediátrica de Paracetamol y se le dio pase de salida medico para ir a descansar a su casa.',1,1),
(4,'2026-04-29 01:14:39.955','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',1,1),
(8,'2026-04-29 01:15:34.203','SISTEMA: El estado del incidente ha sido cambiado a \"CERRADO\".',1,1),
(9,'2026-04-29 01:19:11.314','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',3,1),
(10,'2026-04-29 01:20:25.208','El alumno fue recibido en dirección junto con sus tutores y estos se comprometieron a pagar por el arreglo de la ventana rota.',3,1),
(11,'2026-04-29 01:21:18.973','Hoy se arreglo la ventana del aula.',3,1),
(12,'2026-04-29 01:21:23.601','SISTEMA: El estado del incidente ha sido cambiado a \"CERRADO\".',3,1),
(13,'2026-05-04 01:21:39.958','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',4,4),
(14,'2026-05-04 23:25:38.636','SISTEMA: El estado del incidente ha sido cambiado a \"CERRADO\".',4,1),
(15,'2026-05-06 14:29:01.076','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',5,8),
(16,'2026-05-06 14:41:19.538','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',6,1),
(17,'2026-05-06 14:42:38.627','SISTEMA: El estado del incidente ha sido cambiado a \"CERRADO\".',6,1),
(18,'2026-05-13 12:22:08.947','se atendió alumno en enfermería ',8,13),
(19,'2026-05-16 09:17:57.313','SISTEMA: El estado del incidente ha sido cambiado a \"EN PROCESO\".',8,13);
/*!40000 ALTER TABLE `Seguimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuario`
--

DROP TABLE IF EXISTS `Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `rol` varchar(191) NOT NULL,
  `apellidoMaterno` varchar(191) DEFAULT NULL,
  `apellidoPaterno` varchar(191) NOT NULL,
  `calle` varchar(191) DEFAULT NULL,
  `correoSecundario` varchar(191) DEFAULT NULL,
  `cp` varchar(191) DEFAULT NULL,
  `estado` varchar(191) NOT NULL DEFAULT 'ACTIVO',
  `telefono1` varchar(191) DEFAULT NULL,
  `telefono2` varchar(191) DEFAULT NULL,
  `gradoAsignado` varchar(191) DEFAULT NULL,
  `grupoAsignado` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Usuario_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuario`
--

LOCK TABLES `Usuario` WRITE;
/*!40000 ALTER TABLE `Usuario` DISABLE KEYS */;
INSERT INTO `Usuario` VALUES
(1,'admin@sigie.com','$2b$10$7tAFqOPPH9Sjt3ApfOMNOetIN/ODUYxiZkGQ.8J3Xg6ECWZS5B5be','Laura Taide','ADMIN','Álvarez','Contreras',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(2,'faustoABJ@sigie.com','$2b$10$Y5z6bwsOIqdMdISmRWmdlOSFLQa8CaEum1av/7JdnOwpAT/rikTGO','Fausto Alejandro','DOCENTE','Jaramillo','Balderas',NULL,NULL,NULL,'ACTIVO',NULL,NULL,'3','A'),
(3,'discordemilio4@gmail.com','$2b$10$bOEwh259TkY26LqUz6RWR.VzsH7b0EDy54sgfNt7OqpTErIiGAvTS','Alejandro','TUTOR','Narvaez','Hernandez',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(4,'rominaV@sigie.com','$2b$10$c.oFMdHWhRQQosBykbA4Ce2e0rGbi0e7zECejNuQvAiDpCm56Y9Jy','Romina','ENFERMERA','Villa','Velazquez',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(6,'holly.608.a@gmail.com','$2b$10$t1gSIaeKGb4uUUqtEoYQ1.53kMEgFz7Dry4UwLgLbjoxRyAbVfn5C','Matilde ','TUTOR','Pascual ','Álvarez ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(7,'gusgus@gmail.com','$2b$10$YUokt909ytBxSOjKJs/3L.6zXv2So7iSpN3PUcFOsg350/AqKy71O','Gustavo ','TUTOR','Cárdenas ','Gonzalez ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(8,'rafa@gmail.com','$2b$10$F.ugCTiJeLr540HcJhycaultvgoBZTn4Cj2P7nK3cnQf4F6JEH2My','Rafael','DOCENTE','Constantino','Martínez ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,'3','A'),
(9,'juan@gmail.com','$2b$10$JIA1sNzO/NKhRQvkTa0I9epxqEPK9AmHar8p2B2KxSCFpV/BoaeV.','Juan Addiel','TUTOR','Constantino','Martínez ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(10,'israel01@sigie.com','$2b$10$AsG0FKuBif3qdwNwvcHPQO.POCLpLPIiRVA.9jLXt.Uvxo7wdG0o.','Israel ','DIRECTOR','Santiago','Juarez',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(11,'dddvid@gmail.com','$2b$10$CAeVykgu7NJoXEkS73unkuCG3SptqmEjcI87blSJn0jCoLdp6JhXW','David','DOCENTE','Lopez ','Perez ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,'3','A'),
(12,'mafernanda@sigie.com','$2b$10$ECOXasuKaNnHNuNAta1FiePrfelXBhzlft8ecDjgYPJoaNYICwJJa','María Fernanda','ENFERMERA','Sánchez','Peréz',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL),
(13,'delacruz.elizabeth2403@gmail.com','$2b$10$CHFrXAhycz4XRvPTZdOBm.8qjkfLxmKt4Ah6mAwFYFR6wKg7Civs.','Elizabeth ','TUTOR','De La Cruz ','Hernández ',NULL,NULL,NULL,'ACTIVO',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `Usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_AlumnoToIncidente`
--

DROP TABLE IF EXISTS `_AlumnoToIncidente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_AlumnoToIncidente` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL,
  UNIQUE KEY `_AlumnoToIncidente_AB_unique` (`A`,`B`),
  KEY `_AlumnoToIncidente_B_index` (`B`),
  CONSTRAINT `_AlumnoToIncidente_A_fkey` FOREIGN KEY (`A`) REFERENCES `Alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_AlumnoToIncidente_B_fkey` FOREIGN KEY (`B`) REFERENCES `Incidente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_AlumnoToIncidente`
--

LOCK TABLES `_AlumnoToIncidente` WRITE;
/*!40000 ALTER TABLE `_AlumnoToIncidente` DISABLE KEYS */;
INSERT INTO `_AlumnoToIncidente` VALUES
(1,1),
(1,4),
(1,5),
(2,3),
(2,6),
(4,6),
(5,7),
(5,8);
/*!40000 ALTER TABLE `_AlumnoToIncidente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES
('18655da3-f98e-40f8-86ef-69d1068783c0','4d1b40f90c65793d456269323061051c85bcf9edb87fff260b810551b115c904','2026-04-27 23:57:39.108','20260420145023_inicio_sigie',NULL,NULL,'2026-04-27 23:57:37.788',1),
('1dec7c56-b800-4216-9b92-3be1178608d7','883670eb0d9c681eb0930a66871b24e355a11420bf6c64889a8cf8b1be49e5af','2026-05-02 21:41:39.214','20260502214137_adaptar_educacion_basica',NULL,NULL,'2026-05-02 21:41:37.546',1),
('2dc30731-3fb3-4c9c-a63f-46321395f906','6d7e48a68c74083d1496afdafd20c1605adcb1d69b74bd8250aeb890865d5393','2026-04-27 23:57:41.417','20260427044859_agregar_tablas_pdf',NULL,NULL,'2026-04-27 23:57:39.117',1),
('56abcc3b-5796-4e8f-bf2e-6fc175ba7bb7','4323d600141ef2664edfba3d62f5d82d42644a9fcb3d8835f0cb0a176aee23a0','2026-05-03 23:20:36.185','20260503232035_bitacora_auditoria',NULL,NULL,'2026-05-03 23:20:35.669',1),
('a6675bdb-7a3d-4ced-8f7e-af821839353b','dd3b9e9534cce20578b85bd26a559c06dd79df2c4509979c9ab262a891986384','2026-04-28 00:07:15.847','20260428000712_agregar_tutor_y_seguimientos',NULL,NULL,'2026-04-28 00:07:12.712',1),
('cd7e05b5-ebf6-47d4-8a68-91d1bb105dbb','50562c5574423e1c1f32f158e66bc70a290364ee6cd0142d08ac71f8a048218d','2026-05-03 00:46:56.244','20260503004655_separar_grado_grupo',NULL,NULL,'2026-05-03 00:46:55.876',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-16 20:04:09
