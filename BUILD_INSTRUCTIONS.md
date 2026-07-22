# NetShield AI SOC Platform - Build and Run Guide

This guide provides step-by-step instructions on how to build, configure, and run the NetShield AI SOC Platform. You can run the application either using **Docker (Recommended)** or **Locally**.

---

## Prerequisites
Before you start, ensure you have the following installed:
*   [Git](https://git-scm.com/) (to clone or manage files)
*   **For Docker Setup:**
    *   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose support)
*   **For Local Setup (without Docker):**
    *   [Python 3.12+](https://www.python.org/downloads/)
    *   [Node.js 18+](https://nodejs.org/) (npm included)
    *   [PostgreSQL 16](https://www.postgresql.org/)
    *   [MongoDB 7](https://www.mongodb.com/try/download/community)
    *   [Redis 7](https://redis.io/download/)

---

## 🔑 Environment Configuration
Regardless of the method you choose, you must configure the environment variables:
1. Copy the `.env.example` file in the project root to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and verify/update the database credentials, application secret keys, and service hostnames. 
   *(Note: The defaults in `.env.example` are pre-configured to work out-of-the-box with Docker Compose).*

---

## Option 1: Running with Docker (Recommended)
This is the easiest way to deploy the entire stack (Database, Cache, Backend, Frontend, and Nginx proxy).

### Step 1: Build and Launch Containers
In the root directory of the project, run:
```bash
docker compose up --build -d
```
*(Or use `make build` and `make up` if `make` is installed on your system).*

### Step 2: Apply Database Migrations
Run Alembic migrations to construct the PostgreSQL database schema:
```bash
docker compose exec backend alembic upgrade head
```
*(Or run `make migrate`).*

### Step 3: Seed Database
Populate the database with initial simulated network threats, users, and rules:
```bash
docker compose exec backend python -m scripts.seed_db
```
*(Or run `make seed`).*

### Step 4: Create Admin User (Optional)
If you need an administrator account to log in to the dashboard:
```bash
docker compose exec backend python -m scripts.create_admin
```
*(Or run `make admin`).*

---

## Option 2: Running Locally (For Development)
If you prefer running services directly on your host machine:

### Prerequisites: Start Local Services
Ensure your local instances of **PostgreSQL**, **MongoDB**, and **Redis** are active. Update your `.env` file target hostnames from containers to `localhost` (e.g., `POSTGRES_HOST=localhost`, `MONGO_HOST=localhost`, `REDIS_HOST=localhost`).

### Step 1: Set up the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   *   **Windows (PowerShell):**
       ```powershell
       .\venv\Scripts\Activate.ps1
       ```
   *   **Windows (Command Prompt):**
       ```cmd
       .\venv\Scripts\activate.bat
       ```
   *   **macOS/Linux:**
       ```bash
       source venv/bin/activate
       ```
4. Install python dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. Seed database / Setup admin:
   ```bash
   python -m scripts.seed_db
   python -m scripts.create_admin
   ```
7. Start the backend development server (FastAPI + Uvicorn):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Step 2: Start Background Workers (Optional)
If you want to support background tasks (Celery workers for handling background jobs):
*   Activate the virtual environment in a new terminal in the `backend/` directory.
*   Start the worker:
    ```bash
    celery -A app.tasks.celery_app worker --loglevel=info
    ```
*   Start the scheduler (beat) in another term if needed:
    ```bash
    celery -A app.tasks.celery_app beat --loglevel=info
    ```

### Step 3: Set up the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server (runs with Webpack to prevent Turbopack compilation errors):
   ```bash
   npm run dev
   ```

---

## 🌐 Verifying the Services
Once running, you can access the platform services at the following endpoints:

| Service | Docker URL | Local URL |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost](http://localhost) (via Nginx) | [http://localhost:3000](http://localhost:3000) |
| **Backend API Docs** | [http://localhost/docs](http://localhost/docs) (or `:8000/docs`) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **pgAdmin (Postgres GUI)** | [http://localhost:5050](http://localhost:5050) | N/A (or run local pgAdmin) |
| **Mongo Express (Mongo GUI)** | [http://localhost:8081](http://localhost:8081) | N/A (or run local GUI) |
