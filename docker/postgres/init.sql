-- Velonix PostgreSQL initialization script
-- Creates additional databases for testing

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Test database
CREATE DATABASE velonix_test;
GRANT ALL PRIVILEGES ON DATABASE velonix_test TO velonix;

-- Connect to test db and enable same extensions
\c velonix_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Connect back to main db
\c velonix_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
