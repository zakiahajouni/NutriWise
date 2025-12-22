-- Script pour créer l'utilisateur nutriwise avec root
-- Exécutez avec: mysql -u root -proot < create_nutriwise_user.sql

DROP USER IF EXISTS 'nutriwise'@'localhost';
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier la création
SELECT user, host FROM mysql.user WHERE user='nutriwise';
SHOW GRANTS FOR 'nutriwise'@'localhost';

