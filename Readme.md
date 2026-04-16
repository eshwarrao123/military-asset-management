# Military Asset Management System (AMS)

## Project Overview

The Military Asset Management System is a full-stack web application designed to track and manage military assets across multiple bases.

It enables:

* Tracking of Opening Balance, Closing Balance, and Net Movement
* Asset purchases and transfers between bases
* Assignment of assets to personnel
* Role-Based Access Control (RBAC)

---

## Assumptions

* Base names are predefined (alpha, bravo, etc.)
* Asset types are user-defined (rifle, radio, etc.)
* No real authentication (role is selected manually for demo)

---

## Limitations

* No real user authentication (mock RBAC)
* Case sensitivity issues may affect data consistency
* Minimal validation for inputs

---

## Tech Stack

### Frontend:

* React (Vite)
* Tailwind CSS

### Backend:

* Node.js
* Express.js

### Database:

* MongoDB (Atlas)

---

## Architecture

Client (React) → API (Express) → MongoDB

---

## Data Models

### Purchase:

* assetType
* quantity
* base
* date
* status

### Transfer:

* assetType
* quantity
* fromBase
* toBase
* date

### Assignment:

* assetType
* quantity
* base
* assignedTo

### Inventory:

* base
* assetType
* quantity

---

##  RBAC

### Admin:

* Full access to all features

### Base Commander:

* Can manage assets within assigned base

### Logistics Officer:

* Can create purchase and transfer requests

RBAC is handled on frontend and partially enforced in backend.

---

## API Logging

All API requests are logged using custom middleware:

* Logs endpoint and request type
* Helps debug and track system activity

---

##  Setup Instructions

### Backend:

```bash
cd backend
npm install
npm start
```

Create `.env` file:

```
MONGO_URI=your_mongodb_connection
PORT=5000
```

---

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Deployment

### Frontend:

Deployed on Vercel

### Backend:

Deployed on Render

---

## API Endpoints (Sample)

* GET /api/purchases
* POST /api/purchases
* GET /api/transfers
* POST /api/transfers
* GET /api/assignments
* POST /api/assignments
* GET /api/dashboard

---

##  Login Credentials

(No authentication implemented)

Select roles manually:

* Admin
* Base Commander
* Logistics Officer

---

##  Features

* Dashboard with metrics
* Purchase tracking
* Asset transfers
* Assignments management
* Role-based UI access

---

## Future Improvements

* Add authentication (JWT)
* Improve validation
* Fix case sensitivity issues
* Add dropdowns for base and asset types

---
