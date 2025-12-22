#!/bin/bash

# Script to fix MySQL user using socket authentication
# This should work even if root password is required

echo "Fixing MySQL user 'nutriwise' using socket authentication..."

# Create SQL script
cat > /tmp/fix_nutriwise.sql << 'EOF'
DROP USER IF EXISTS 'nutriwise'@'localhost';
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='nutriwise';
SHOW GRANTS FOR 'nutriwise'@'localhost';
EOF

# Try to execute with socket (requires sudo)
echo "Attempting to execute SQL script..."
sudo mysql --socket=/var/run/mysqld/mysqld.sock < /tmp/fix_nutriwise.sql

# Test connection
echo ""
echo "Testing connection with nutriwise user..."
mysql --socket=/var/run/mysqld/mysqld.sock -u nutriwise -pnutriwise123 -e "USE nutriwise; SHOW TABLES;" 2>&1

# Cleanup
rm -f /tmp/fix_nutriwise.sql

echo ""
echo "Done!"

