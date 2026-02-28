# React + Spring Boot + Oracle (Docker)

## Services
- `react-app`: frontend on `http://localhost:3000`
- `rest-api`: backend on `http://localhost:8080`
- `oracle-db`: Oracle XE on `localhost:1521`

Flow:
`Browser -> react-app -> rest-api -> oracle-db`

## Quick Start
1. Create env file:
```powershell
Copy-Item .env.example .env
```
2. Edit `.env` values (at minimum set `ORACLE_PASSWORD`).
3. Start:
```bash
docker compose up --build -d
```
4. Check:
```bash
docker compose ps
```

## .env Variables
| Variable | Purpose |
|---|---|
| `ORACLE_PASSWORD` | Oracle SYS/SYSTEM password |
| `APP_USER` | App schema user created at startup |
| `APP_USER_PASSWORD` | App schema user password |
| `JAVA_OPTS` | JVM memory/runtime flags for backend |

## API Checks
- Hello: `http://localhost:8080/hello`
- Health: `http://localhost:8080/api/system/health`

Quick curl:
```bash
curl http://localhost:8080/api/system/health
```

## Notes
- Frontend calls backend through Nginx proxy (`/hello`, `/api/*`).
- Task API data is currently in-memory (no persistent table usage yet).
- If port `3000`, `8080`, or `1521` is busy, update it directly in `docker-compose.yml`.

## Logs
- `docker compose logs react-app`
- `docker compose logs rest-api`
- `docker compose logs oracle-db`
