# Migration and Setup

## Canonical Schema
- The canonical database schema file is at `src/sql-exports/schema.sql`.

## Import Schema
- Create the database (example):
  - `mysql -u <user> -p -e "CREATE DATABASE cityarts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
- Import schema into the database:
  - `mysql -u <user> -p cityarts < src/sql-exports/schema.sql`

## Notes
- Do not use alternative schema paths; use the canonical file above to avoid inconsistencies.
- Ensure environment variables (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`) are set before running the application.

