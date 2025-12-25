# Research & System Design

## 1. Multi-Tenancy Analysis

Multi-tenancy is a software architecture where a single instance of software serves multiple tenants (customers).

### Comparison of Approaches

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same database and tables. A `tenant_id` column associates rows with tenants. | • Lowest infrastructure cost<br>• Easy to deploy and maintain schema<br>• Efficient resource usage | • Weakest data isolation (risk of data leak via code error)<br>• Backup/Restore per tenant is difficult<br>• Noisy neighbor effect |
| **Shared Database, Separate Schemas** | One database, but each tenant has their own schema (tablespace). | • Better isolation than shared schema<br>• Easier per-tenant backup/restore<br>• Customizable schema per tenant possible | • Higher complexity in migration<br>• Database overhead with many tenants<br>• Connection pool management can be tricky |
| **Separate Databases** | Each tenant has their own dedicated database instance. | • Highest isolation and security<br>• No noisy neighbor effect<br>• Independent scalability | • Highest cost (infrastructure)<br>• High operational complexity (fleet management)<br>• Resources potentially wasted for small tenants |

### Selected Approach: **Shared Database, Shared Schema**
**Justification**:
For this project, we have chosen the **Shared Database, Shared Schema** approach.
1.  **Complexity vs Time**: Given the constraints and type of application (Project Management SaaS), this approach is the fastest to implement while still robust enough for a production MVP.
2.  **Resource Efficiency**: We are using a single PostgreSQL instance. Creating thousands of schemas or databases is overkill for the expected scale of this assignment.
3.  **Modern tooling**: Middleware and Row Level Security (RLS) (simulated via application logic in this case) can effectively mitigate isolation risks.

## 2. Technology Stack Justification

### Backend: **Node.js with Express**
-   **Why**: Non-blocking I/O is excellent for API-heavy SaaS applications. Large ecosystem of libraries (auth, validation).
-   **Alternatives**: Python/Django (slower for high concurrency), Go (higher dev time).

### Frontend: **React**
-   **Why**: Component-based architecture is perfect for valid dynamic dashboards (Project/Task lists). Virtual DOM ensures high performance.
-   **Alternatives**: Vue (good, but React was implied/stronger ecosystem), Angular (too heavy).

### Database: **PostgreSQL**
-   **Why**: Robust relational integrity (ACID) is crucial for multi-tenant data consistency. Support for complex queries and indexing.
-   **Alternatives**: MongoDB (NoSQL less suitable for structured relational data like Projects->Tasks->Users).

### Authentication: **JWT (JSON Web Tokens)**
-   **Why**: Stateless. Perfect for scalable REST APIs. No need to store session state in DB (reducing DB load).
-   **Alternatives**: Session-based (requires sticky sessions or Redis, adds complexity).

### Deployment: **Docker & Docker Compose**
-   **Why**: Mandatory requirement. Ensures "write once, run anywhere". Isolates dependencies.

## 3. Security Considerations

1.  **Logical Data Isolation**: All database queries MUST include a `WHERE tenant_id = ?` clause. This will be enforced via a middleware that injects the `tenant_id` into the context, and repositories that strictly require it.
2.  **Secure Authentication**:
    -   passwords will be hashed using `bcrypt` (work factor 10+).
    -   JWTs will be signed with a strong secret and have a short expiration (24h).
3.  **Role-Based Access Control (RBAC)**:
    -   Middleware will check `user.role` before protecting endpoints.
    -   Strict validation that a user cannot elevate their own privileges.
4.  **Input Validation**:
    -   All API inputs will be validated (e.g., using `zod` or `joi`) to prevent Injection attacks and ensure data integrity.
5.  **Audit Logging**:
    -   Critical actions (CREATE, UPDATE, DELETE) will be logged to an `audit_logs` table to provide a trail in case of security incidents.
