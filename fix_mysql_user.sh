#!/bin/bash

# Script to fix MySQL user access
# Run with: sudo bash fix_mysql_user.sh

echo "Fixing MySQL user 'nutriwise'..."

# Try to connect as root and recreate user
sudo mysql << EOF
-- Drop user if exists
DROP USER IF EXISTS 'nutriwise'@'localhost';

-- Create user with password
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';

-- Grant privileges
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify user creation
SELECT user, host FROM mysql.user WHERE user='nutriwise';

-- Show grants
SHOW GRANTS FOR 'nutriwise'@'localhost';
EOF

echo ""
echo "Testing connection..."
mysql -u nutriwise -pnutriwise123 -e "USE nutriwise; SHOW TABLES;" 2>&1

echo ""
echo "Done! If you see tables or 'No tables found', the user is working correctly."

