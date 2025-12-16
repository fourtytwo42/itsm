#!/bin/bash
# Database setup script for ITSM Helpdesk
# Run with: sudo bash setup-database.sh

set -e

echo "Setting up PostgreSQL database for ITSM Helpdesk..."

# Create database
sudo -u postgres psql -c "CREATE DATABASE itsm;" 2>/dev/null || echo "Database 'itsm' may already exist"

# Create user
sudo -u postgres psql -c "CREATE USER itsm_user WITH PASSWORD 'itsm_password';" 2>/dev/null || echo "User 'itsm_user' may already exist"

# Grant privileges
sudo -u postgres psql -d itsm -c "GRANT ALL PRIVILEGES ON DATABASE itsm TO itsm_user;"
sudo -u postgres psql -d itsm -c "ALTER USER itsm_user WITH SUPERUSER;"

# Create vector extension
sudo -u postgres psql -d itsm -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo "✅ Database setup complete!"
echo "Database: itsm"
echo "User: itsm_user"
echo "Password: itsm_password"

