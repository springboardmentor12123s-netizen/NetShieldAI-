-- NetShield AI - PostgreSQL Init Script
-- Creates extensions and sets up initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE netshield_db TO netshield;
