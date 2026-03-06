# Hotel Booking Service (React + Spring Boot + MySQL)
GitHub
   ↓
Jenkins Pipeline
   ↓
Clone Code
   ↓
SonarQube Static Code Analysis
   ↓
OWASP Dependency Check (SCA)
   ↓
Sonar Quality Gate Validation
   ↓
Trivy Security Scan
   ↓
Docker Build
   ↓
Docker Compose Deployment
   ↓
Email Notification

This project is a complete hotel booking service with:
- React frontend (operations dashboard)
- Spring Boot backend API
- MySQL database (persistent booking data)
- Docker Compose for local and CI runtime
- Jenkins DevSecOps pipeline with quality gates

## What This Application Does

- Create hotel bookings
- View all bookings
- Update booking status (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`)
- Cancel bookings
- Show dashboard metrics (active stays, check-ins/check-outs, revenue)

## Tech Stack

- Frontend: React 18 + Nginx
- Backend: Spring Boot 2.7 + Spring Data JPA
- Database: MySQL 8.4
- Runtime: Docker Compose
- CI/CD: Jenkins + SonarQube + OWASP Dependency Check + Trivy

## Container Architecture

`Browser -> react-app -> rest-api -> mysql-db`

Why:
- `react-app` serves UI and proxies API calls.
- `rest-api` contains validation and business logic.
- `mysql-db` stores bookings permanently.

## Project Structure

- `React App/` - frontend source and Docker/Nginx files
- `Rest Api/` - backend source and Docker files
- `docker-compose.yml` - local deployment orchestration
- `.env.example` - environment variable template
- `Jenkinsfile` - CI/CD pipeline with security and quality gates

## Environment Variables

| Variable | Example | Why It Is Used |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `root@123` | MySQL initialization |
| `MYSQL_DATABASE` | `hotel_booking` | Default database |
| `MYSQL_USER` | `hotel_user` | Application DB user |
| `MYSQL_PASSWORD` | `hotel_pass@123` | Application DB password |
| `MYSQL_PORT` | `3306` | Host port for MySQL |
| `API_PORT` | `9090` | Host port for backend API |
| `WEB_PORT` | `3000` | Host port for frontend |
| `JAVA_OPTS` | `-Xms256m -Xmx512m` | JVM tuning for backend container |

## Quick Start

1. Copy environment file:
```powershell
Copy-Item .env.example .env
```

2. Build and run:
```bash
docker compose up --build -d
```

3. Verify containers:
```bash
docker compose ps
```

4. Open:
- Frontend: `http://localhost:3000`
- API Hello: `http://localhost:9090/hello`
- API Health: `http://localhost:9090/api/system/health`

## API Endpoints

- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `POST /api/bookings`
- `PUT /api/bookings/{id}`
- `PATCH /api/bookings/{id}/status`
- `DELETE /api/bookings/{id}`

## How To Check DB Tables

1. Open MySQL shell:
```powershell
docker exec -it hotel_mysql_db mysql -u hotel_user -p
```
Password: `hotel_pass@123`

2. Check schema:
```sql
USE hotel_booking;
SHOW TABLES;
DESCRIBE bookings;
```

3. Check data:
```sql
SELECT id, guest_name, room_type, status, check_in_date, check_out_date
FROM bookings
ORDER BY id;
```

One-line check:
```powershell
docker exec -it hotel_mysql_db mysql -u hotel_user -photel_pass@123 -e "USE hotel_booking; SHOW TABLES; SELECT id, guest_name, room_type, status FROM bookings ORDER BY id;"
```

## Useful DevOps Commands

```bash
docker compose logs -f mysql-db
docker compose logs -f rest-api
docker compose logs -f react-app
docker compose restart
docker compose down
docker compose down -v
```

## Troubleshooting

- Port already in use:
  - change `MYSQL_PORT`, `API_PORT`, or `WEB_PORT` in `.env`.
- API not reachable:
  - check `docker compose logs -f rest-api`.
- DB connection failure:
  - check `docker compose logs -f mysql-db`.
- Full reset:
  - `docker compose down -v && docker compose up -d --build`.

## Jenkins Pipeline Added

Pipeline file included: `Jenkinsfile`

Pipeline stages:
1. `Clone Code from GitHub`
2. `SonarQube Quality Analysis`
3. `OWASP Dependency Check`
4. `Sonar Quality Gate Scan`
5. `Trivy File System Scan`
6. `Docker Build`
7. `Deploy Container`

Why this order:
- Security and code quality are validated before build/deploy.
- Quality gate blocks unsafe or low-quality code automatically.

## Quality Gate (Important)

`Jenkinsfile` uses:
```groovy
waitForQualityGate abortPipeline: true
```

What happens:
- Jenkins waits for SonarQube result.
- If gate fails, pipeline stops immediately.
- Docker build/deploy stages do not run on failed quality gate.

Recommended Quality Gate policy in SonarQube:
1. New Bugs = 0
2. New Vulnerabilities = 0
3. New Security Hotspots Reviewed >= 80%
4. New Code Coverage >= 80%
5. Duplicated Lines on New Code <= 3%

## Complete Setup Steps For Jenkins + Quality Gate

1. Install Jenkins (system service) on a Linux/Windows server.
2. Install tools on Jenkins host:
   - Docker, Docker Compose v2
   - Java 17
   - Maven 3.9+
   - Trivy
   - Git
3. Verify tools:
```bash
docker --version
docker compose version
java -version
mvn -version
trivy --version
git --version
```
4. Install Jenkins plugins:
   - Pipeline
   - Git
   - Docker Pipeline
   - SonarQube Scanner for Jenkins
   - OWASP Dependency-Check Plugin
   - Email Extension Plugin
   - Credentials Binding
   - Pipeline Utility Steps
   - ANSI Color
5. Start SonarQube:
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```
6. In SonarQube, create project + generate token.
7. In Jenkins, open `Manage Jenkins -> System` and configure SonarQube:
   - Name: `sonarqube-server` (must match Jenkinsfile)
   - URL: `http://<sonarqube-host>:9000`
   - Token: created Sonar token
8. In Jenkins, open `Manage Jenkins -> Tools`:
   - Configure OWASP Dependency Check tool
   - Name it `dependency-check` (must match Jenkinsfile)
9. Configure email in `Manage Jenkins -> System`:
   - Set SMTP server (for example Gmail/Office365 company SMTP)
   - Set sender email
   - Test email from Jenkins UI
10. Edit `Jenkinsfile` `EMAIL_RECIPIENTS` value with your team email.
11. Push this repo to GitHub (including `Jenkinsfile`).
12. Create Jenkins job:
   - `New Item -> Pipeline`
   - Definition: `Pipeline script from SCM`
   - SCM: Git
   - Repository URL: your repo
   - Script Path: `Jenkinsfile`
13. Run `Build Now`.
14. Stage behavior:
   - SonarQube scan runs first
   - OWASP dependency scan runs
   - Sonar quality gate pass/fail is evaluated
   - Trivy scan must pass (no HIGH/CRITICAL if configured)
   - Docker build + deploy happens only if all checks pass
15. Email behavior:
   - On success: deployment success email is sent
   - On failure: failure email is sent
   - OWASP dependency report and Trivy report are attached
16. Validate deployment after success:
   - `http://localhost:3000`
   - `http://localhost:9090/api/system/health`
   - DB check with `SHOW TABLES;` and booking query.

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
       Clone Code from GitHub
              |
       SonarQube Quality Analysis
              |
       OWASP Dependency Check
              |
       Sonar Quality Gate Scan
              |
       Trivy File System Scan
              |
          Docker Build
              |
        Deploy Container
```

## Process To Make This Setup

1. Prepare Jenkins host with Docker, Java 17, Maven, Trivy, and Git.
2. Install Jenkins and required plugins.
3. Start SonarQube and create token.
4. Configure SonarQube in Jenkins as `sonarqube-server`.
5. Configure OWASP tool in Jenkins as `dependency-check`.
6. Push this project with `Jenkinsfile` to GitHub.
7. Create Jenkins Pipeline job using SCM and script path `Jenkinsfile`.
8. Run pipeline and monitor all scan stages.
9. Fix any quality gate or security scan failure before deploy.
10. On success, validate UI/API/DB and keep reports as build artifacts.
