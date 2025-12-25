# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin
-   **Role**: System Administrator / Platform Owner.
-   **Responsibilities**: Manage the SaaS platform, monitor all tenants, manage global subscriptions.
-   **Goals**: Ensure system uptime, manage billing/plans, oversee tenant compliance.
-   **Pain Points**: Lack of visibility into tenant usage, manual onboarding processes.

### 1.2 Tenant Admin
-   **Role**: Organization Manager (e.g., Project Manager or CEO of the client company).
-   **Responsibilities**: Manage their company's users, projects, and settings.
-   **Goals**: Efficiently organize work, control team access, track project progress.
-   **Pain Points**: User management overhead, data leakage fears, complex tools.

### 1.3 End User
-   **Role**: Team Member / Employee.
-   **Responsibilities**: Execute tasks, update status, collaborate on projects.
-   **Goals**: Clear view of assigned tasks, easy status updates.
-   **Pain Points**: Confusing interface, unclear priorities, "noise" from other projects.

## 2. Functional Requirements

### Authentication Module
-   **FR-001**: The system shall allow new tenants to register with a unique subdomain.
-   **FR-002**: The system shall allow users to login using email/password and tenant context.
-   **FR-003**: The system shall use JWT for stateless authentication.

### Tenant Management
-   **FR-004**: The system shall allow Super Admins to view all registered tenants.
-   **FR-005**: The system shall allow Tenant Admins to view their own tenant details.
-   **FR-006**: The system shall enforce subscription limits (max users, max projects).

### User Management
-   **FR-007**: The system shall allow Tenant Admins to create new users within their tenant.
-   **FR-008**: The system shall prevent users from accessing data outside their tenant.
-   **FR-009**: The system shall support Role-Based Access Control (RBAC).

### Project Management
-   **FR-010**: The system shall allow authenticated users to create projects (subject to limits).
-   **FR-011**: The system shall allow users to list projects belonging to their tenant.

### Task Management
-   **FR-012**: The system shall allow creating tasks within a specific project.
-   **FR-013**: The system shall allow assigning tasks to users within the same tenant.
-   **FR-014**: The system shall allow updating task status (Todo -> In Progress -> Done).

### Security & Audit
-   **FR-015**: The system shall log security-critical events (login, data modification) to an audit log.

## 3. Non-Functional Requirements

-   **NFR-001 (Performance)**: API response time should be under 200ms for 95% of requests.
-   **NFR-002 (Security)**: All passwords must be hashed using bcrypt.
-   **NFR-003 (Scalability)**: The database schema must use indexes on `tenant_id` to support scaling to 100+ tenants without major degradation.
-   **NFR-004 (Availability)**: The system must be containerized to support orchestration and high availability deployments.
-   **NFR-005 (Usability)**: The frontend should be responsive and function on mobile devices.
