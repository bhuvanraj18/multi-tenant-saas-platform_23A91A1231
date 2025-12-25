# API Documentation - Multi-Tenant SaaS Platform

## Base URL
`http://localhost:5000/api`

## Authentication

| Method | Endpoint | Description | Auth Required |
|Data | | | |
| `POST` | `/auth/register-tenant` | Register a new tenant & admin | No |
| `POST` | `/auth/login` | Login user | No |
| `GET` | `/auth/me` | Get current user profile | Yes |

## Tenants

| Method | Endpoint | Description | Auth | Role |
|Data | | | | |
| `GET` | `/tenants` | List all tenants | Yes | Super Admin |
| `GET` | `/tenants/:tenantId` | Get tenant details | Yes | Super Admin / Tenant Admin |
| `PUT` | `/tenants/:tenantId` | Update tenant details | Yes | Super Admin / Tenant Admin |

## Users

| Method | Endpoint | Description | Auth | Role |
|Data | | | | |
| `POST` | `/tenants/:tenantId/users` | Add user to tenant | Yes | Tenant Admin |
| `GET` | `/tenants/:tenantId/users` | List users in tenant | Yes | Tenant Admin / Super Admin |
| `PUT` | `/users/:userId` | Update user details | Yes | Owner / Tenant Admin |
| `DELETE` | `/users/:userId` | Remove user | Yes | Tenant Admin |

## Projects

| Method | Endpoint | Description | Auth |
|Data | | | |
| `POST` | `/projects` | Create new project | Yes |
| `GET` | `/projects` | List all projects | Yes |
| `GET` | `/projects/:projectId` | Get project details | Yes |
| `PUT` | `/projects/:projectId` | Update project | Yes |
| `DELETE` | `/projects/:projectId` | Delete project | Yes |

## Tasks

| Method | Endpoint | Description | Auth |
|Data | | | |
| `POST` | `/projects/:projectId/tasks` | Create task | Yes |
| `GET` | `/projects/:projectId/tasks` | List tasks | Yes |
| `PUT` | `/tasks/:taskId` | Update task details | Yes |
| `PATCH` | `/tasks/:taskId/status` | Update task status | Yes |
| `DELETE` | `/tasks/:taskId` | Delete task | Yes |

## Audit Logs

- Internal system logging for critical actions (Create/Update/Delete).
