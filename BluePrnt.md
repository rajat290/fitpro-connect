Project Blueprint: FitPro Connect
1. Project Overview
FitPro Connect is a comprehensive, modern gym management system built with NestJS. It will feature three main portals:

Admin Portal: For gym owners and managers.

Member Portal (Web & Mobile API): For gym members.

Trainer Portal: For gym trainers and staff.

The system will utilize a hybrid database approach, leveraging the strengths of both SQL (PostgreSQL) for transactional data and MongoDB for flexible, document-based data.

2. Tech Stack & Architecture
Backend Framework: NestJS

API Type: RESTful API

Authentication: JWT (Access & Refresh Tokens), OAuth2 (Google)

Primary Database (Transactional): PostgreSQL (with TypeORM)

Secondary Database (Document-based): MongoDB (with Mongoose)

Caching: Redis (for JWT blacklisting and rate limiting)

File Storage: Amazon S3 / Local Storage (for member photos, documents)

Real-time Communication: (Optional - Phase 2) Socket.io

Task Scheduling: NestJS Bull Module (for background jobs like email queues)

Deployment: Docker, Docker Compose

3. Detailed Feature Breakdown & Implementation Plan
Module 1: Authentication & Authorization (Auth Module)
Features:

User Registration (Member, Trainer, Admin)

Login/Logout

JWT-based session management

Refresh Token Rotation

Role-Based Access Control (RBAC)

Password Reset via Email

OAuth2 (Google Login)

Implementation Details (Cluster 3):

NestJS Guards: JwtAuthGuard, RolesGuard

Custom Decorators: @Roles(), @Public() to bypass auth.

Strategies: JwtStrategy, GoogleStrategy (using Passport.js).

Services: AuthService (login, logout, refreshToken, validateUser), UserService.

Password Hashing: Using bcrypt.

Database (Cluster 5 - SQL):

User Table (Base Entity): id, email, passwordHash, role, createdAt, isActive.

RefreshToken Table: id, userId, token, expiresAt, isRevoked. (Linked to User table via Foreign Key).

Module 2: User Management (Users Module)
Features:

CRUD operations for Members, Trainers, Admins.

Detailed user profiles.

Implementation Details (Cluster 1 - OOP):

Entity Inheritance:

User (Abstract Class in TypeORM)

Member extends User (adds dateOfBirth, medicalHistory, goals)

Trainer extends User (adds certification, bio, hourlyRate)

Admin extends User (inherits base properties)

Data Transfer Objects (DTOs): CreateUserDto, UpdateUserDto, CreateMemberDto, etc. for validation.

Pipes: Use ValidationPipe with class-validator for input validation.

Database (Cluster 5 - SQL):

Single Table Inheritance (STI) in PostgreSQL to store all user types in one user table with a discriminator column (role).

Module 3: Membership & Billing (Membership Module)
Features:

Create, read, update, deactivate membership plans (e.g., Basic, Premium, Gold).

Member subscription management.

Automated recurring payments.

Invoice generation.

Payment gateway integration (Stripe).

Implementation Details (Cluster 1 & 3):

Strategy Pattern: PaymentStrategy interface with concrete classes StripeStrategy, PayPalStrategy. Makes it easy to add new payment providers.

Factory Pattern: PaymentFactory to create the appropriate strategy based on config.

Tasks Scheduling: Use @nestjs/schedule to run a cron job daily to check for subscriptions due for renewal.

Database (Cluster 5 - SQL - ACID Critical):

Plan Table: id, name, price, duration, features.

Subscription Table: id, userId, planId, startDate, endDate, status, autoRenew.

Invoice Table: id, subscriptionId, amount, issueDate, dueDate, status.

Payment Table: id, invoiceId, amount, method, transactionId, status, paidAt.

Use SQL Transactions for critical operations like createSubscription -> createInvoice -> processPayment.

Module 4: Class & Scheduling Management (Classes Module)
Features:

Admin/Trainer can create, update, delete fitness classes.

Members can view the schedule, book, and cancel classes.

Waitlist functionality.

Implementation Details (Cluster 1 & 3):

Observer Pattern: Implement a WaitlistService that acts as an observer. When a class booking is cancelled, it notifies the next person on the waitlist (via email - using a queue).

Singleton Pattern: The GymSchedule service could be a singleton to manage global state around class timings and resources.

Database (Cluster 5 - Hybrid):

PostgreSQL:

Class Table: id, trainerId, name, date, startTime, endTime, capacity.

MongoDB:

Bookings Collection: Flexible schema. Document includes classId, memberId, bookingDate, status ("confirmed", "cancelled", "waitlisted").

Waitlists Collection: classId, memberId, joinedAt.

Module 5: Workout & Progress Tracking (Workouts Module)
Features:

Trainers create custom workout/nutrition plans for members.

Members view assigned plans and log their own progress.

Implementation Details (Cluster 5 - MongoDB):

Perfect use-case for MongoDB's flexible schema.

Use Embedded Documents for exercises within a plan.

Database (Cluster 5 - MongoDB):

workout_plans Collection:

json

Copy

Download
{
  "_id": ObjectId("..."),
  "trainerId": 123,
  "memberId": 456,
  "name": "Beginner Strength",
  "exercises": [ // Embedded Array
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": "8-10",
      "restTime": 60
    }
  ]
}
progress_logs Collection: memberId, metric (e.g., "weight", "chest size"), value, date.

Module 6: Analytics & Reporting (Analytics Module)
Features:

Financial reports (Revenue by plan, pending payments).

Attendance reports (Peak hours, popular classes).

Membership growth charts.

Implementation Details (Cluster 5):

SQL: Use complex JOINS and GROUP BY queries on PostgreSQL for financial data.

MongoDB: Use the powerful Aggregation Framework ($match, $group, $sort, $project) to analyze class attendance and member engagement trends.

4. API Design Blueprint (RESTful Principles - Cluster 3)
Endpoint	Method	Description	Auth	Role
/auth/login	POST	User login	Public	-
/auth/register	POST	User registration	Public	-
/auth/refresh	POST	Get new access token	Public (needs valid refresh token)	-
/auth/change-password	PATCH	Change password	JWT	All
/users	GET	Get all users	JWT	Admin
/users/profile	GET	Get own profile	JWT	All
/users/:id	PATCH	Update a user	JWT	Admin, Owner
/plans	GET	Get all plans	Public/JWT	-
/plans	POST	Create a new plan	JWT	Admin
/members/:id/subscription	GET	Get member's subscription	JWT	Admin, Owner
/classes	GET	Get class schedule	JWT	All
/classes/:id/book	POST	Book a class	JWT	Member
/invoices/:id/pay	POST	Pay an invoice	JWT	Member, Admin
Status Codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error.

5. Data Model (Entity-Relationship Diagram - Conceptual)
text

Copy

Download
*------------------*       *-------------------*       *-----------------*
|       User       |       |       Plan        |       |      Class      |
*------------------*       *-------------------*       *-----------------*
| id (PK)          |<----->| id (PK)           |       | id (PK)         |
| email            |       | name              |       | trainerId (FK)  |
| passwordHash     |       | price             |       | name            |
| role             |       | duration          |       | date            |
| ...              |       *-------------------*       | capacity        |
*------------------*               |                   *-----------------*
        ^                          |                          |
        |                          |                          |
        |(Inheritance)     *-------------------*             |
        |                  |   Subscription    |             |
*------------------*       *-------------------*             |
|     Member       |       | id (PK)           |             |
*------------------*       | userId (FK)       |<----------- | (Bookings)
| dateOfBirth      |       | planId (FK)       |             |
| medicalHistory   |       | startDate         |             |
*------------------*       | endDate           |       *-----------------*
        |                  | status            |       |     Booking     |
*------------------*       *-------------------*       *-----------------* (MongoDB)
|     Trainer      |               |                   | _id             |
*------------------*       *-------------------*       | classId         |
| certification    |       |      Invoice      |       | memberId        |
| bio              |       *-------------------*       | status          |
*------------------*       | id (PK)           |       *-----------------*
                           | subscriptionId(FK)|
                           | amount            |
                           | status            |
                           *-------------------*
                                   |
                           *-------------------*
                           |      Payment      |
                           *-------------------*
                           | id (PK)           |
                           | invoiceId (FK)    |
                           | amount            |
                           | status            |
                           *-------------------*
6. Development Roadmap (Phased Approach)
Phase 1: Core System (MVP)

Set up NestJS project with TypeORM and PostgreSQL.

Implement Auth Module (JWT, RBAC).

Implement User Management Module (OOP Inheritance).

Build Membership & Plan CRUD APIs.

Phase 2: Financial Engine

Implement Subscription lifecycle logic.

Integrate Stripe payment gateway (Strategy Pattern).

Build Invoice and Payment system with SQL Transactions.

Phase 3: Operational Features

Implement Class and Booking system (Hybrid DB).

Add Waitlist functionality (Observer Pattern).

Build basic Reporting endpoints.

Phase 4: Advanced Features

Integrate MongoDB for Workout Plans and Progress Tracking.

Implement File Upload for user avatars.

Add real-time features with WebSockets (optional).

Set up background email jobs with queues.

Bhai, yeh blueprint aapko har step pe guide karega. Isme se ek feature uthao, uska module banao, APIs banao, test karo, aur phir agle feature pe jaao. Aage jaake kuch change karna ho toh isi document ko update karte jaana.

Happy Coding! 🚀


