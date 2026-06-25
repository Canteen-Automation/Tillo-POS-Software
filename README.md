# Positeasy Clone - Canteen Automation Ecosystem

Welcome to the **Positeasy Clone**, a comprehensive Canteen Automation Ecosystem. This project is designed to handle point-of-sale (POS), inventory management, user ordering, and administrative tasks for canteen operations.

## 🏗️ Ecosystem Architecture

The application is split into several interconnected modules:

1. **Backend (`/backend`)**
   - **Stack**: Java, Spring Boot, Maven, PostgreSQL.
   - **Purpose**: Serves as the core API for all frontend applications. Handles business logic, database transactions, and security.

2. **Admin & Counter Frontend (`/frontend`)**
   - **Stack**: React 19, TypeScript, Vite, Tailwind CSS, Recharts.
   - **Purpose**: The main dashboard for canteen administrators and counter staff to manage POS, inventory, and reports. Includes PDF generation and charts.

3. **Ordering Site (`/ordering_site`)**
   - **Stack**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
   - **Purpose**: The customer-facing application where users can browse the menu, place orders, and view order status.

4. **Counter Frontend (`/counter-frontend`)**
   - **Stack**: React 19, TypeScript, Vite, Tailwind CSS.
   - **Purpose**: A streamlined interface specifically for counter operations.

---

## 🔐 Security & Authentication

The system uses a robust **JWT-based Authentication** architecture to secure endpoints. 

### Critical: Security Configuration
To run this application securely, you **MUST** configure the following environment variables. Do **NOT** commit real secrets to the repository.

| Variable | Description | Example/Hint |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret key for signing tokens | `openssl rand -base64 32` |
| `DB_PASSWORD` | Database user password | Your PostgreSQL password |
| `MASTER_USER` | Initial admin email | `admin@example.com` |
| `MASTER_PASSWORD` | Initial admin password | `SecurePassword123` |

#### Setting Environment Variables:
- **Local Development**: Create a `.env` file or set them in your IDE (IntelliJ/Eclipse) Run Configurations.
- **Production**: Set them as System Environment Variables on your server or CI/CD platform.

### Security Features
- **Backend**: Protected by JWT guards (`JwtAuthFilter`, `JwtUtil`). Role-based access restricts sensitive endpoints (Orders, Wallets, Coupons) to authenticated users. Implements rate limiting (`LoginRateLimiter`) to prevent brute-force attacks.
- **Frontend**: Centralized API wrapper (`src/api.ts`) injects authentication headers automatically. `AuthContext` persists tokens securely.

---

## 🚀 How to Run

### Backend
1. Ensure Java 17+ and Maven are installed.
2. Navigate to the `backend` directory: `cd backend`
3. Update `src/main/resources/application.properties` with your database credentials and set the `jwt.secret` (or use environment variables).
4. Run the application: `./mvnw spring-boot:run`

### Frontends (`frontend`, `ordering_site`, `counter-frontend`)
1. Ensure Node.js (v18+) is installed.
2. Navigate to the desired frontend directory: `cd frontend` (or `ordering_site` / `counter-frontend`)
3. Install dependencies: `npm install`
4. Set up your `.env` file to point to the backend URL (e.g., `VITE_API_URL=http://localhost:8080`).
5. Run the development server: `npm run dev`

---

## 🛠️ Additional Tools & Scripts

- **`generate_report.py`**: A Python script used to generate deployment or analytics reports.
- **`push_to_git.bat`**: A quick batch script for Windows users to automate git commits and pushes.
- **`migrate_fetch.ps1`**: A PowerShell script in the `frontend` directory used to automate the transition of fetch calls to the secure API wrapper.

---
*Developed by the Canteen Automation Team.*
