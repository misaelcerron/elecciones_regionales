-- Script de creación de Base de Datos para el Sistema Electoral
-- Base de datos: u794164472_elecciones
-- Diseñado para MySQL

CREATE DATABASE IF NOT EXISTS `u794164472_elecciones` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `u794164472_elecciones`;

-- -----------------------------------------------------
-- Tabla UBIGEO
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ubigeo` (
  `id_ubigeo` VARCHAR(6) NOT NULL,
  `departamento` VARCHAR(50) NOT NULL,
  `provincia` VARCHAR(50) NOT NULL,
  `distrito` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_ubigeo`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla LOCAL_VOTACION
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `local_votacion` (
  `id_local` INT NOT NULL AUTO_INCREMENT,
  `id_ubigeo` VARCHAR(6) NOT NULL,
  `nombre_local` VARCHAR(150) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_local`),
  CONSTRAINT `fk_local_ubigeo` FOREIGN KEY (`id_ubigeo`) REFERENCES `ubigeo` (`id_ubigeo`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla MESA_SUFRAGIO
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mesa_sufragio` (
  `id_mesa` VARCHAR(10) NOT NULL, -- Ej: 068426
  `id_local` INT NOT NULL,
  `electores_habiles` INT NOT NULL,
  PRIMARY KEY (`id_mesa`),
  CONSTRAINT `fk_mesa_local` FOREIGN KEY (`id_local`) REFERENCES `local_votacion` (`id_local`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla ORGANIZACION_POLITICA
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizacion_politica` (
  `id_partido` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `simbolo_url` VARCHAR(255) NULL,
  PRIMARY KEY (`id_partido`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla TIPO_ELECCION
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipo_eleccion` (
  `id_tipo_eleccion` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL, -- Ej: REGIONAL, MUNICIPAL_PROVINCIAL, MUNICIPAL_DISTRITAL
  PRIMARY KEY (`id_tipo_eleccion`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla PERSONERO
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `personero` (
  `id_personero` INT NOT NULL AUTO_INCREMENT,
  `nombres_apellidos` VARCHAR(150) NOT NULL,
  `dni` VARCHAR(8) NOT NULL,
  `celular` VARCHAR(15) NULL,
  `id_mesa` VARCHAR(10) NOT NULL,
  `tipo` ENUM('TITULAR', 'SUPLENTE') DEFAULT 'TITULAR',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_personero`),
  CONSTRAINT `fk_personero_mesa` FOREIGN KEY (`id_mesa`) REFERENCES `mesa_sufragio` (`id_mesa`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla ACTA_ELECTORAL
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `acta_electoral` (
  `id_acta` VARCHAR(20) NOT NULL,
  `id_mesa` VARCHAR(10) NOT NULL,
  `id_tipo_eleccion` INT NOT NULL,
  `estado` ENUM('PENDIENTE', 'DIGITADA', 'EN_VERIFICACION', 'OBSERVADA', 'CONTABILIZADA') DEFAULT 'PENDIENTE',
  `total_ciudadanos_votaron` INT NULL,
  `votos_blancos` INT NULL DEFAULT 0,
  `votos_nulos` INT NULL DEFAULT 0,
  `votos_impugnados` INT NULL DEFAULT 0,
  `hash_sha256` VARCHAR(64) NULL,
  `firmas_miembros_mesa` INT NULL DEFAULT 0,
  `siniestrada` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_acta`),
  UNIQUE KEY `uk_mesa_eleccion` (`id_mesa`, `id_tipo_eleccion`),
  CONSTRAINT `fk_acta_mesa` FOREIGN KEY (`id_mesa`) REFERENCES `mesa_sufragio` (`id_mesa`),
  CONSTRAINT `fk_acta_tipo` FOREIGN KEY (`id_tipo_eleccion`) REFERENCES `tipo_eleccion` (`id_tipo_eleccion`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla VOTO_RESULTADO
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `voto_resultado` (
  `id_resultado` BIGINT NOT NULL AUTO_INCREMENT,
  `id_acta` VARCHAR(20) NOT NULL,
  `id_partido` INT NOT NULL,
  `cantidad_votos` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_resultado`),
  UNIQUE KEY `uk_acta_partido` (`id_acta`, `id_partido`),
  CONSTRAINT `fk_resultado_acta` FOREIGN KEY (`id_acta`) REFERENCES `acta_electoral` (`id_acta`),
  CONSTRAINT `fk_resultado_partido` FOREIGN KEY (`id_partido`) REFERENCES `organizacion_politica` (`id_partido`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla AUDITORIA_ACTA
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria_acta` (
  `id_auditoria` BIGINT NOT NULL AUTO_INCREMENT,
  `id_acta` VARCHAR(20) NOT NULL,
  `estado_anterior` VARCHAR(50) NULL,
  `estado_nuevo` VARCHAR(50) NOT NULL,
  `usuario_modificacion` VARCHAR(100) NOT NULL,
  `observacion` TEXT NULL,
  `ip_origen` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria`),
  CONSTRAINT `fk_auditoria_acta` FOREIGN KEY (`id_acta`) REFERENCES `acta_electoral` (`id_acta`)
) ENGINE=InnoDB;
