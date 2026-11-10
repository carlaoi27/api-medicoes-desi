CREATE DATABASE IF NOT EXISTS monitoramento_db;
USE monitoramento_db;

CREATE TABLE IF NOT EXISTS `medicoes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `descricao` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `valor_original` DOUBLE NOT NULL,
    `unidade_original` VARCHAR(20) NOT NULL,
    `valor_convertido` DOUBLE NOT NULL,
    `unidade_convertida` VARCHAR(20) NOT NULL,
    `classificacao` VARCHAR(50) NOT NULL,
    `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
