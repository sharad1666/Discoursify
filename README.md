# Discoursify - AI-Powered Group Discussion Platform

A comprehensive platform for conducting AI-powered group discussions with real-time transcription, analysis, and knowledge management.

## 🚀 Features

- **Real-time Group Discussions** - Video/audio sessions with live transcription
- **AI-Powered Analysis** - Automated evaluation and insights
- **Knowledge Hub** - Curated content and learning resources
- **Session Recording** - Automatic recording and playback
- **Admin Dashboard** - Comprehensive system monitoring and management
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17 or higher** - [Download](https://www.oracle.com/java/technologies/downloads/)
- **Node.js 18 or higher** - [Download](https://nodejs.org/)
- **MySQL 8.0 or higher** - [Download](https://dev.mysql.com/downloads/installer/)
- **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (for full functionality)
- **Apache Kafka** - For real-time messaging
- **Docker** - For containerized Kafka setup

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Project
```

### 2. Database Setup
 
 #### Option 1: Using Docker (Recommended)
 
 ```bash
 cd docker
 docker-compose up -d
 ```
 
 This will start MySQL and Kafka containers. MySQL will be available on port 3306 with:
 - **Username:** `root`
 - **Password:** `pass123`
 - **Database:** `ai_gd_platform`
 
 #### Option 2: Manual Installation
 
 1. Install MySQL Server.
 2. Create a database named `ai_gd_platform`.
 3. Update `backend/src/main/resources/application.properties` with your credentials.

### 3. Backend Setup

#### Configure Application Properties

Navigate to `backend/src/main/resources/application.properties` and update:

```properties
# Database Configuration
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/ai_gd_platform?createDatabaseIfNotExist=true&allowPublicKeyRetrieval=true&useSSL=false
spring.datasource.username=root
spring.datasource.password=pass123

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Server Port
server.port=8080

# Kafka Configuration (if using)
spring.kafka.bootstrap-servers=localhost:9092

# File Upload
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

#### Install Dependencies & Build

```bash
cd backend

# Clean and install dependencies
mvn clean install

# Skip tests if needed
mvn clean install -DskipTests
```

#### Run Backend Server

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using the startup script (Windows)
./start-backend.bat

# Option 3: Using PowerShell script
./run-backend.ps1

# Option 4: Run JAR directly
java -jar target/ai-gd-platform-0.0.1-SNAPSHOT.jar
```

The backend server will start on **http://localhost:8080**

### 4. Frontend Setup

#### Configure Environment Variables

Create a `.env` file in the `frontend-web` directory:

```env
VITE_API_URL=http://localhost:8080/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Install Dependencies

```bash
cd frontend-web

# Install all dependencies
npm install
```

#### Run Development Server

```bash
# Start the development server
npm run dev
```

The frontend will start on **http://localhost:5173** (or 5174 if 5173 is in use)

### 5. Firebase Setup (Required for Authentication)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Google Authentication** in Authentication section
4. Copy your Firebase configuration
5. Update the `.env` file with your Firebase credentials
6. Update `frontend-web/src/services/firebase.ts` if needed

## 🚀 Running the Application

### Quick Start (Development)

1. **Start Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend-web
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Docs: http://localhost:8080/swagger-ui.html (if configured)

### Production Build

#### Backend
```bash
cd backend
mvn clean package
java -jar target/ai-gd-platform-0.0.1-SNAPSHOT.jar
```

#### Frontend
```bash
cd frontend-web
npm run build
npm run preview
```

## 👤 Default Admin Access

- **Email:** `bhilareshivtejofficial@gmail.com`
- **Access:** Admin Panel available at `/admin` route

## 📁 Project Structure

```
Project/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/cdac/gd/
│   │   │   │       ├── controller/    # REST controllers
│   │   │   │       ├── service/       # Business logic
│   │   │   │       ├── model/         # JPA entities
│   │   │   │       ├── repository/    # Data access
│   │   │   │       └── config/        # Configuration
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
├── frontend-web/            # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   ├── services/        # API services
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md               # This file
```

## 🔧 Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Or change port in application.properties
server.port=8081
```

**Database connection failed:**
- Verify MySQL is running
- Check database credentials in `application.properties`
- Ensure database `ai_gd_platform` exists
- Check firewall settings

**Maven build fails:**
```bash
# Clear Maven cache
mvn clean

# Update dependencies
mvn clean install -U

# Skip tests
mvn clean install -DskipTests
```

### Frontend Issues

**Port 5173 already in use:**
- Vite will automatically try the next available port (5174, 5175, etc.)
- Or kill the process using the port

**Module not found errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Firebase authentication not working:**
- Verify Firebase configuration in `.env`
- Check Firebase console for enabled authentication methods
- Ensure domain is authorized in Firebase settings

**API calls failing:**
- Verify backend is running on port 8080
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors
- Verify backend CORS configuration

### Common Issues

**CORS errors:**
- Backend CORS is configured to allow `http://localhost:5173`
- If using different port, update CORS configuration in backend

**Kafka not available:**
- Kafka is optional for basic functionality
- Comment out Kafka-related code if not using
- Or install Kafka/use Docker

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Key Endpoints

#### Sessions
- `POST /sessions/create` - Create new session
- `GET /sessions/active` - Get active sessions
- `GET /sessions/{id}` - Get session details

#### Content
- `GET /content/topics` - Get available topics
- `GET /content/search` - Search content

#### Admin (Requires Admin Role)
- `GET /admin/stats` - System statistics
- `GET /admin/users` - User management
- `GET /admin/health` - System health check

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer:** Shivtej Bhilare
- **Organization:** CDAC

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: bhilareshivtejofficial@gmail.com

---

**Happy Coding! 🎉**
