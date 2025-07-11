# PropertyMNGMT

A full-stack property management application for landlords, tenants, and contractors. This is a non-production development branch with sample data and a working database included.

---

## Features

### User Roles
- **Landlord**: Manage properties, tenants, leases, rent tracking, maintenance, and finances.
- **Tenant**: View lease details, make payments, submit maintenance requests, and communicate with landlords.
- **Contractor**: View and manage assigned work orders, update job status, and communicate with landlords.

### Property Management
- Add, edit, and delete properties (single-family and multi-family).
- Track mortgage, valuation, tax rate, and miscellaneous expenses.
- Assign tenants to properties/units.
- Store and edit rent for single-family properties directly on the property record.

### Tenant Management
- Add, edit, and delete tenants.
- Assign tenants to properties/units.
- Track lease start/end dates, rent, and security deposit.
- View payment history and lease agreements.

### Lease Management
- Create and manage lease agreements (rent, security deposit, dates, late fees, etc.).
- End or renew leases.

### Rent Tracking
- Track rent payments, due dates, and payment status.
- View payment history for each tenant.

### Maintenance Requests
- Tenants can submit maintenance requests.
- Landlords can assign requests to contractors.
- Contractors can update work order status.

### Marketplace (Optional/Planned)
- List and browse available properties or contractor services.

### Communication
- In-app messaging between landlords, tenants, and contractors.
- Track communication history and status.

### Project & Job Management
- Manage standalone projects (e.g., renovations).
- Track project jobs, costs, and assignments.

---

## Setup & Development

### Prerequisites
- Node.js (v18+ recommended)
- npm
- [Prisma](https://www.prisma.io/) (for database migrations and Studio)

### Getting Started
1. **Clone the repository:**
   ```sh
   git clone https://github.com/SamuelPetrucci/PropertMNGMT.git
   cd PropertMNGMT
   ```
2. **Install dependencies:**
   ```sh
   cd server && npm install
   cd ../client && npm install
   ```
3. **Set up the database:**
   - The repo includes a working SQLite database (`server/prisma/dev.db`) with sample data.
   - To reset and re-seed:
     ```sh
     cd server
     npx prisma migrate dev --schema=prisma/schema.prisma
     node db.js
     ```
4. **Start the backend:**
   ```sh
   cd server
   npm start
   ```
5. **Start the frontend:**
   ```sh
   cd client
   npm start
   ```
6. **Log in with demo accounts:**
   - Landlord: `alice` / `password123`
   - Tenant: `john_doe` / `tenant123`
   - Contractor: `mike_contractor` / `contractor123`

### Database Management
- The SQLite database is located at `server/prisma/dev.db`.
- Use Prisma Studio to view/edit data:
  ```sh
  npx prisma studio --schema=server/prisma/schema.prisma
  ```

### Branching & Version Control
- This is the `dev-nonprod` branch for development and testing.
- All code, migrations, and the database are tracked for reproducibility.
- **Do not use this branch or database in production.**

---

## Development Notes
- All major features are implemented for demo/testing.
- The codebase is split into `client/` (React frontend) and `server/` (Node.js/Express backend).
- Prisma is used for ORM and migrations.
- Sample data is seeded via `server/db.js`.
- For any issues, check the `.env` file in `server/` for the correct `DATABASE_URL`.

---

## License
This project is for demonstration and development purposes only. Not for production use. 