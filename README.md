
# Confirmation Tool



##  Overview

**Confirmation Tool** is a web-based application designed to simplify and streamline the external confirmation process during financial audits.

The platform provides a centralized workspace for auditors, clients, and confirming parties to manage confirmation requests, coordinate audit activities, and track confirmation progress.

It aims to reduce manual effort, improve workflow visibility, and make audit confirmation procedures more organized and efficient.

##  Features

### 1. Auditor Dashboard
- View and manage audit engagements.
- Search engagements by client name or engagement ID.
- Monitor engagement status.
- Access individual engagement workspaces.

### 2. Sample Generation
- Create confirmation sample sets.
- Generate unique sample IDs based on audit area and sample set.
- Maintain structured confirmation records.
- Integrate sample data with SharePoint document storage.

### 3. Client Authorization
- Dedicated workflow for client authorization.
- Organize authorization-related activities.

### 4. Confirming Party Portal
- View pending confirmation requests.
- Access individual confirmation details.
- Track confirmation status, including pending, draft, and submitted.

### 5. Rollout & Reminders
- Dedicated workspace for confirmation rollout and reminder activities.

### 6. Working Papers
- Dedicated section for managing audit working paper activities.

### 7. Access & Roles
- Separate application workflows for auditors, clients, and confirming parties.

### 8. Archival
- Dedicated section for confirmation archival activities.

### 9. SharePoint Integration
- Microsoft Graph API integration.
- Authenticate using Microsoft Entra ID application credentials.
- Access SharePoint sites and document libraries.
- Download and upload confirmation-related files.

##  Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend development |
| TypeScript | Type-safe development |
| Vite | Development server and build tool |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Radix UI | Accessible UI primitives |
| React Router | Application navigation |
| TanStack Query | Data fetching and state management |
| Express.js | Backend API |
| Node.js | Backend runtime |
| Microsoft Graph API | SharePoint integration |
| MSAL Node | Microsoft authentication |
| Axios | HTTP requests |
| XLSX | Spreadsheet processing |

##  Project Structure

```text
Confirmation-Tool/
│
├── backend/
│   ├── api/
│   │   └── createSampleSet.ts
│   └── server.ts
│
├── public/
│
├── src/
│   ├── components/
│   │   └── ui/
│   │
│   ├── pages/
│   │   ├── auditor/
│   │   │   ├── sections/
│   │   │   ├── Engagements.tsx
│   │   │   └── EngagementDashboard.tsx
│   │   │
│   │   ├── client/
│   │   ├── confirming-party/
│   │   ├── Index.tsx
│   │   ├── RoleSelection.tsx
│   │   └── NotFound.tsx
│   │
│   ├── lib/
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── requirements.txt
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

##  Prerequisites

Make sure you have the following installed:

- Node.js (v18 or later recommended)
- npm
- Git
- Microsoft Entra ID application registration (for SharePoint integration)
- Access to the required SharePoint site and document library

##  Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Rajathaaa/Confirmation-Tool.git
```

### 2. Navigate to the project directory

```bash
cd Confirmation-Tool
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Configure your Microsoft Graph API and SharePoint credentials on the backend.

Use environment variables instead of hardcoding credentials in source files.

Example `.env` configuration:

```env
PORT=3001

AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret

SHAREPOINT_HOSTNAME=your-sharepoint-domain
SHAREPOINT_SITE_PATH=/sites/your-site
SHAREPOINT_DOCUMENT_LIBRARY=your-document-library
```

**Important:** Ensure that the backend reads these values from environment variables before running the application. Do not commit `.env` files or credentials to GitHub.

### 5. Start the frontend

```bash
npm run dev
```

The Vite development server will start. Open the local URL displayed in your terminal (usually `http://localhost:8080` or `http://localhost:5173`).

### 6. Start the backend

Open another terminal window and run:

```bash
npm run server
```

The Express backend starts on port `3001` by default.

For backend development with automatic restart:

```bash
npm run dev:server
```

##  Backend API

The backend exposes an API for creating confirmation sample sets.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/create-sample-set` | Creates a confirmation sample set |

Example request:

```json
{
  "audit_area": "Trade Receivables",
  "sample_set_name": "Customer Confirmations",
  "confirming_party_name": "ABC Enterprises",
  "recipient_name": "John Doe",
  "email_id": "john@example.com",
  "amount": "50000"
}
```

The API handles sample ID generation and confirmation record creation, with SharePoint integration for document management.

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend development server |
| `npm run build` | Build frontend for production |
| `npm run build:dev` | Build using development mode |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run server` | Start Express backend |
| `npm run dev:server` | Start backend in watch mode |

##  Security Considerations

- Store credentials in environment variables.
- Never expose Microsoft Graph API client secrets in frontend code.
- Configure appropriate Microsoft Graph API permissions.
- Restrict SharePoint access to authorized users.
- Implement appropriate authentication and authorization for production deployments.
- Avoid committing sensitive configuration files.

##  Future Enhancements

Potential areas for further development include:

- Automated email notifications and reminders.
- Advanced confirmation status tracking.
- Enhanced role-based access control.
- Detailed audit trails and activity logs.
- Automated working paper generation.
- Improved reporting and analytics.
- Production-ready authentication and authorization.

