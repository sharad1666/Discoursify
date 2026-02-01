# Discoursify - AI-Powered Group Discussion Platform

A scalable, AI-powered Group Discussion platform built with a Microservices architecture.

## 🚀 Architecture Overview

This project is structured as a set of distributed microservices to ensure scalability, fault tolerance, and independent deployment.

### 🏗️ Backend Services
The backend (located in `backend/backend/`) is built with **Spring Boot 3.4.0** and **Spring Cloud**.

| Service | Port | Description |
|---------|------|-------------|
| **Service Registry** | `8761` | Eureka Server for service discovery. |
| **API Gateway** | `8080` | Spring Cloud Gateway. The single entry point for all client requests. |
| **Auth Service** | `8081` | Handles user authentication, registration, and JWT issuance. |
| **Session Service** | `8082` | Manages GD sessions, topics, and possibly AI integration. |

### 🖥️ Frontend
The frontend (located in `frontend-web/`) is a modern Single Page Application.

- **Stack**: React 19, TypeScript, Vite.
- **Port**: `5173`.
- **Features**: Real-time WebSocket communication, Material UI design.

---

## 📋 Prerequisites

Ensure you have the following installed:
- **Java 17+** (Required for Spring Boot)
- **Node.js 18+** (Required for React)
- **MySQL 8.0**
- **Maven** (for building backend services)

---

## 🛠️ Setup & Installation

### 1. Database Setup
1.  Ensure MySQL is running.
2.  Create the necessary database(s) as defined in your service configurations (check `application.properties` in each service).
    - Typically requests `ai_gd_platform` or individual DBs per service.

### 2. Frontend Configuration
Create a `.env` file in `frontend-web/` based on your needs.
```env
VITE_API_URL=http://localhost:8080/api  # Points to API Gateway, not individual services
VITE_FIREBASE_API_KEY=...
```

---

## 🚀 Running the Application

### Option 1: Quick Start (Windows)
We provide a PowerShell script to spin up all backend services in the correct order.

1.  Open PowerShell in the root directory.
2.  Run the script:
    ```powershell
    ./start_microservices.ps1
    ```
    *This will open separate windows for Registry, Gateway, Auth, and Session services.*

3.  Start the Frontend:
    ```bash
    cd frontend-web
    npm install
    npm run dev
    ```

### Option 2: Manual Startup
If you prefer running manual commands, start them in this **strict order**:

1.  **Service Registry**
    ```bash
    cd backend/backend/service-registry
    mvn spring-boot:run
    ```
    *Wait for it to fully start on port 8761.*

2.  **API Gateway**
    ```bash
    cd backend/backend/api-gateway
    mvn spring-boot:run
    ```

3.  **Auth Service**
    ```bash
    cd backend/backend/auth-service
    mvn spring-boot:run
    ```

4.  **Session Service**
    ```bash
    cd backend/backend/session-service
    mvn spring-boot:run
    ```

---

## 📂 Directory Structure

```
Discoursify_Microservices/
├── backend/backend/           # Microservices Root
│   ├── service-registry/      # Eureka Server
│   ├── api-gateway/           # Spring Cloud Gateway
│   ├── auth-service/          # Authentication Service
│   └── session-service/       # Core Business Logic
│
├── frontend-web/              # React Frontend
│   ├── src/
│   └── public/
│
└── start_microservices.ps1    # Startup Script
```

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit changes.
4.  Push and create a Pull Request.

---
**Happy Coding!** 🚀

