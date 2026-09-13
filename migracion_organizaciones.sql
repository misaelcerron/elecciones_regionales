-- ═══════════════════════════════════════════════════
-- Migración: Módulo Organizaciones Políticas
-- ODPE PASCO · Sistema Electoral
-- Ejecutar una sola vez en la base de datos
-- ═══════════════════════════════════════════════════

USE `u794164472_elecciones`;

-- 1. Agregar columna siglas (si no existe)
ALTER TABLE `organizacion_politica`
    ADD COLUMN IF NOT EXISTS `siglas` VARCHAR(20) NULL
    AFTER `nombre`;

-- 2. Verificar tabla (opcional)
DESCRIBE `organizacion_politica`;
