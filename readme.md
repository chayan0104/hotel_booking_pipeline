# Hotel Booking Service (React + Spring Boot + MySQL)

This project is a complete hotel booking service with:
- Modern React frontend for operations team
- Spring Boot REST API for booking management
- MySQL database for persistent booking data
- Docker Compose for one-command runtime
- DevSecOps-oriented flow for Jenkins pipeline

Why this setup:
- It is easy to run locally for developers.
- It is easy to automate in CI/CD for DevOps.
- It keeps frontend, backend, and database clearly separated.

## What This Application Does

- Create hotel bookings
- View all bookings
- Update booking status (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`)
- Cancel bookings
- Show dashboard metrics (active stays, check-ins/check-outs, revenue)

Why these features:
- They match common hotel front desk and operations workflows.

## Tech Stack

- Frontend: React 18 + Nginx
- Backend: Spring Boot 2.7 + Spring Data JPA
- Database: MySQL 8.4
- Runtime: Docker Compose

Why JPA:
- Reduces boilerplate SQL code.
- Keeps code easier to maintain and test.

## Container Architecture

`Browser -> react-app -> rest-api -> mysql-db`

Why:
- `react-app` serves UI and proxies API calls.
- `rest-api` owns business logic and validation.
- `mysql-db` stores bookings permanently.

## Project Structure

- `React App/` - React source + Docker/Nginx
- `Rest Api/` - Spring Boot source + Docker
- `docker-compose.yml` - multi-container runtime
- `.env.example` - environment template

## Environment Variables

| Variable | Example | Why It Is Used |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `root@123` | MySQL container initialization |
| `MYSQL_DATABASE` | `hotel_booking` | Database name created at startup |
| `MYSQL_USER` | `hotel_user` | App DB user |
| `MYSQL_PASSWORD` | `hotel_pass@123` | App DB password |
| `MYSQL_PORT` | `3306` | Host port to access MySQL |
| `API_PORT` | `9090` | Host port for Spring Boot API |
| `WEB_PORT` | `3000` | Host port for React UI |
| `JAVA_OPTS` | `-Xms256m -Xmx512m` | JVM memory tuning for container |

## Quick Start

1. Copy environment file:
```powershell
Copy-Item .env.example .env
```
Why: keeps deploy configuration out of source code.

2. Build and start:
```bash
docker compose up --build -d
```
Why: builds latest app images and runs all services together.

3. Check containers:
```bash
docker compose ps
```
Why: verifies all services are up and mapped correctly.

4. Open application:
- Frontend: `http://localhost:3000`
- API Hello: `http://localhost:9090/hello`
- API Health: `http://localhost:9090/api/system/health`

## API Endpoints

- `GET /api/bookings` - list bookings
- `GET /api/bookings/{id}` - booking by id
- `POST /api/bookings` - create booking
- `PUT /api/bookings/{id}` - full update
- `PATCH /api/bookings/{id}/status` - status update only
- `DELETE /api/bookings/{id}` - cancel/delete booking

Why separate `PATCH /status`:
- Status changes are frequent operations and should stay simple.

## How To Check DB Tables

1. Open MySQL shell inside container:
```powershell
docker exec -it hotel_mysql_db mysql -u hotel_user -p
```
Password: `hotel_pass@123`

2. Select DB and show tables:
```sql
USE hotel_booking;
SHOW TABLES;
```

3. Check table structure:
```sql
DESCRIBE bookings;
```

4. Check booking data:
```sql
SELECT id, guest_name, room_type, status, check_in_date, check_out_date
FROM bookings
ORDER BY id;
```

5. Exit:
```sql
exit
```

One-line DB check:
```powershell
docker exec -it hotel_mysql_db mysql -u hotel_user -photel_pass@123 -e "USE hotel_booking; SHOW TABLES; SELECT id, guest_name, room_type, status FROM bookings ORDER BY id;"
```

Why DB checks matter:
- Confirms persistence is working.
- Confirms API actions are reflected in real tables.

## Useful DevOps Commands

Show logs:
```bash
docker compose logs -f mysql-db
docker compose logs -f rest-api
docker compose logs -f react-app
```

Restart services:
```bash
docker compose restart
```

Stop and remove containers:
```bash
docker compose down
```

Stop and remove containers + volume (full reset):
```bash
docker compose down -v
```

Why keep these commands handy:
- They are the fastest path for troubleshooting in CI and local environments.

## Troubleshooting

- Port conflict (`bind ... port is already allocated`):
  - Change `MYSQL_PORT`, `API_PORT`, or `WEB_PORT` in `.env`.
- React opens but API calls fail:
  - Check `docker compose logs -f rest-api`.
- API starts but DB connection fails:
  - Check `docker compose logs -f mysql-db`.
- Need fresh DB:
  - Use `docker compose down -v` then `docker compose up -d --build`.

## Security + Quality Gates For DevOps

Recommended Jenkins pipeline stages:
1. Checkout (GitHub)
2. SonarQube scan (SAST)
3. OWASP Dependency Check
4. Docker image build
5. Trivy image scan
6. Deploy containers

Why this order:
- Fail early on code and dependency risk before deployment.

## Design Principle

* Jenkins = Control Plane (system service)
* Docker = Runtime Engine
* SonarQube = SAST
* OWASP Dependency Check = Dependency Scan
* Trivy = Container Scan
* Docker = Build & Deploy

## Flow

```text
Developer -> GitHub -> Jenkins
              |
        SonarQube (Code Scan)
              |
        OWASP (Dependency Scan)
              |
        Docker Build
              |
        Trivy Scan
              |
        Deploy Container
```

## Process To Make This Setup

1. Prepare one Linux/Windows build machine with Docker, Docker Compose, Java 17, Maven, and Git.
2. Install Jenkins as a system service.
3. Install Jenkins plugins: Git, Pipeline, Docker Pipeline, SonarQube Scanner, OWASP Dependency-Check.
4. Run SonarQube:
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```
5. Generate Sonar token and store it in Jenkins credentials.
6. Install Trivy on Jenkins host and verify:
```bash
trivy --version
```
7. Create Jenkins pipeline job connected to this GitHub repository.
8. Add pipeline stages in this order:
   - Checkout
   - SonarQube
   - OWASP Dependency Check
   - Docker Build
   - Trivy Scan
   - Docker Compose Deploy
9. Keep runtime config in `.env` so port/user/password changes do not require code edits.
10. After deployment, validate:
   - `http://localhost:3000`
   - `http://localhost:9090/api/system/health`
   - DB table check with `SHOW TABLES;` and `SELECT * FROM bookings;`
