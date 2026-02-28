# React + Spring Boot + Oracle DevSecOps Pipeline

This repository demonstrates a simple 3-tier application with CI/CD security gates.
- `react-app`: frontend served by Nginx
- `rest-api`: Spring Boot backend
- `oracle-db`: Oracle XE database

## Architecture
`Browser -> react-app -> rest-api -> oracle-db`

Why this architecture:
- It separates UI, API, and DB responsibilities for easier testing and scaling.
- Nginx proxy in frontend keeps browser calls simple (`/hello`, `/api/*`).
- Docker Compose gives one command local startup for DevOps and CI smoke tests.

## Prerequisites
- Docker Desktop (or Docker Engine + Compose v2)
- Free host ports from `.env` (default: `3000`, `9090`, `1521`)

Why these are needed:
- Docker/Compose runs all services consistently across environments.
- Fixed host ports make health checks and Jenkins smoke tests predictable.

## Project Structure
- `React App/`: frontend source and Docker assets
- `Rest Api/`: backend source and Docker assets
- `docker-compose.yml`: local runtime orchestration
- `.env.example`: template for runtime configuration

Why this layout:
- Keeps deployment concerns (`docker-compose.yml`, `.env`) at repo root.
- Keeps app code isolated per service for clear ownership.

## Quick Start
1. Create `.env` from template:
```powershell
Copy-Item .env.example .env
```
Why: `.env` holds environment-specific values without editing Compose file.

2. Start services:
```bash
docker compose up --build -d
```
Why: builds fresh images and runs full stack in detached mode.

3. Check service status:
```bash
docker compose ps
```
Why: confirms all containers are healthy and mapped to expected ports.

4. Validate endpoints:
- Frontend: `http://localhost:3000`
- API Hello: `http://localhost:${API_PORT}/hello`
- API Health: `http://localhost:${API_PORT}/api/system/health`

## Environment Variables
| Variable | Default | Why It Is Used |
|---|---|---|
| `ORACLE_PASSWORD` | `Oracle_123` | Sets Oracle SYS/SYSTEM password at DB initialization |
| `APP_USER` | `devops` | Creates application schema user in Oracle |
| `APP_USER_PASSWORD` | `devops@420` | Password for application schema user |
| `ORACLE_PORT` | `1521` | Host-to-container mapping for Oracle listener |
| `API_PORT` | `9090` | Host-to-container mapping for backend API |
| `WEB_PORT` | `3000` | Host-to-container mapping for frontend |
| `JAVA_OPTS` | `-Xms256m -Xmx512m` | Controls JVM memory/runtime behavior in container |

## Security Stages (Jenkins)
1. Checkout from GitHub  
Why: pipeline always uses tracked source revision.
2. SonarQube code scan  
Why: catches code smells, bugs, and security hotspots early.
3. OWASP Dependency Check  
Why: detects vulnerable third-party libraries (CVEs).
4. Docker build  
Why: produces immutable deployable artifact.
5. Trivy image scan  
Why: checks image OS/packages for vulnerabilities.
6. Deploy container  
Why: only promoted build gets deployed.

## Useful Commands
```bash
docker compose logs -f rest-api
docker compose logs -f react-app
docker compose logs -f oracle-db
docker compose down
```

## Troubleshooting
- Backend port conflict:
  Change `API_PORT` in `.env` if current value is in use.
- Frontend `502 Bad Gateway`:
  Backend is still starting; wait and refresh.
- Oracle startup delay:
  First run is slower because DB initialization takes time.

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
1. Prepare one build host (VM/server) with Docker, Docker Compose, Java 17, and Git.
2. Run Jenkins as system service and open `http://<jenkins-host>:8080`.
3. Complete Jenkins setup and install plugins: Pipeline, Git, Docker Pipeline, SonarQube Scanner, OWASP Dependency-Check.
4. Run SonarQube:
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```
5. Create SonarQube project/token and add it in Jenkins credentials and SonarQube server config.
6. Install Trivy on Jenkins host and verify:
```bash
trivy --version
```
7. Connect Jenkins pipeline job to this GitHub repository.
8. Implement pipeline stages in this order: Checkout -> SonarQube -> OWASP -> Docker Build -> Trivy -> Deploy.
9. Keep deployment values in `.env` (`API_PORT`, `WEB_PORT`, `ORACLE_PORT`, DB credentials).
10. Run pipeline and validate:
   - Frontend: `http://localhost:3000`
   - API Health: `http://localhost:${API_PORT}/api/system/health`
