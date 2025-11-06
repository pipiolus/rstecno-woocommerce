-- Creates schema objects in the default DB defined by MYSQL_DATABASE (antartida_test)
-- The DB itself is created by the container using env vars.

-- Optional: just to be explicit
CREATE DATABASE IF NOT EXISTS antartida_test;
USE antartida_test;

DROP TABLE IF EXISTS sige_woo_woocommer;

CREATE TABLE sige_woo_woocommer (
  ART_IdArticulo varchar(15) NOT NULL DEFAULT '',
  LIS_IDListaPrecio smallint(6) NOT NULL DEFAULT '0',
  WOO_IdProducto varchar(15) NOT NULL DEFAULT '',
  PAL_PrecVtaArt DOUBLE DEFAULT NULL,
  ADS_Disponible DOUBLE DEFAULT NULL,
  WOO_Activo1 char(1) DEFAULT NULL,
  WOO_FecUltActLocal datetime DEFAULT NULL,
  WOO_PrecVtaArt DOUBLE DEFAULT '0',
  WOO_Disponible DOUBLE DEFAULT '0',
  WOO_Activo2 char(1) DEFAULT '',
  WOO_FecUltActWeb datetime DEFAULT NULL,
  PRIMARY KEY (ART_IdArticulo, LIS_IDListaPrecio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data (optional)
INSERT INTO sige_woo_woocommer
(ART_IdArticulo, LIS_IDListaPrecio, WOO_IdProducto, PAL_PrecVtaArt, ADS_Disponible, WOO_Activo1, WOO_FecUltActLocal, WOO_PrecVtaArt, WOO_Disponible, WOO_Activo2, WOO_FecUltActWeb)
VALUES
('ABC123', 1, '', 149.90, 7, 'S', NOW(), 0, 0, '', NULL),
('XYZ999', 1, '', 99.00, 0, 'S', NOW(), 0, 0, '', NULL);
