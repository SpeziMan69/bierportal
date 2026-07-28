# Docker Configuration

## Database

PostgreSQL 16 database for development.

## Usage

```bash
# From project root
docker-compose -f docker/docker-compose.yml up -d

# Or from docker folder
cd docker
docker-compose up -d
```

## Environment Variables

Make sure to set up your `.env` file in the project root with:
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
