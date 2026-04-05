# PEM Energy Monitoring System - Backend

Node.js/Express backend for the PEM Energy Monitoring System (EMS). This API handles user authentication, meter management, and energy reading recording with role-based access control.

## Features

- **User Authentication**: JWT-based authentication with role-based access (Recorder & Manager)
- **Meter Management**: Create, read, update, and delete meter configurations
- **Reading Recording**: Record meter readings (KWH, KVAH, KVARH, MD, PF)
- **Data Analysis**: Calculate daily consumption and actual maximum demand
- **MongoDB Integration**: Persistent data storage with Mongoose ODM
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Cross-origin requests enabled for React frontend

## Project Structure

```
pem-energy-backend/
├── src/
│   ├── models/              # MongoDB schemas (User, Meter, MeterReading)
│   ├── controllers/         # Business logic (auth, meter, readings)
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication & error handling
│   ├── utils/               # Database connection
│   └── server.js            # Express app setup
├── package.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository** (or if in same workspace, navigate to backend folder)
   ```bash
   cd pem-energy-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pem-energy
   JWT_SECRET=your_secure_secret_key_here
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. **Ensure MongoDB is running**
   ```bash
   # If using local MongoDB
   mongod
   ```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/users` - Get all users (manager only)
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user (manager only)

### Meters
- `POST /api/meters` - Create meter (manager only)
- `GET /api/meters` - Get all meters
- `GET /api/meters/:id` - Get meter by ID
- `PUT /api/meters/:id` - Update meter (manager only)
- `DELETE /api/meters/:id` - Delete meter (manager only)

### Readings
- `POST /api/readings` - Record new reading (recorder/manager)
- `GET /api/readings` - Get readings with filters
- `GET /api/readings/:id` - Get reading by ID
- `GET /api/readings/daily-consumption` - Calculate daily consumption
- `GET /api/readings/actual-md` - Calculate actual maximum demand
- `PUT /api/readings/:id` - Update reading (recorder/manager)
- `DELETE /api/readings/:id` - Delete reading (manager only)

### Health Check
- `GET /api/health` - Health status

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

**Roles:**
- `recorder`: Can record meter readings
- `manager`: Full access including user and meter management

## Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "recorder1",
    "email": "recorder1@example.com",
    "password": "password123",
    "role": "recorder"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "recorder1",
    "password": "password123"
  }'
```

### Create Meter
```bash
curl -X POST http://localhost:5000/api/meters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "meterName": "SAPL",
    "meterType": "Single Phase",
    "meterNumber": "MET001",
    "location": "Building A",
    "contractedMD": 100
  }'
```

### Record Reading
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "meterId": "63f7a8c3b9d4e1f2a3b4c5d6",
    "readingDate": "2024-01-15",
    "KWH": 150.50,
    "KVAH": 155.20,
    "KVARH": 45.30,
    "MD": 45.5,
    "PF": 0.98
  }'
```

## Database Schema

### User Collection
- username (unique)
- email (unique)
- password (hashed)
- role (recorder/manager)
- department
- lastLogin
- isActive
- timestamps

### Meter Collection
- meterName (SAPL/SMRT/SMC-HT)
- meterType (Single Phase/Three Phase)
- meterNumber (unique)
- location
- department
- contractedMD
- multiplier
- isActive
- timestamps

### MeterReading Collection
- meter (ref to Meter)
- readingDate
- KWH, KVAH, KVARH, MD, PF
- recordedBy (ref to User)
- notes
- timestamps

## Frontend Integration

Update your React frontend `.env`:
```
VITE_API_URL=http://localhost:5000
```

Example fetch in React:
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/readings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Development Notes

- All endpoints return JSON responses with `success`, `message`, and `data` fields
- Error handling is centralized in the error middleware
- MongoDB validation is enforced at schema level
- JWT tokens expire after 24 hours
- CORS is configured for frontend URL

## Troubleshooting

**Cannot connect to MongoDB:**
- Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection string
- Verify `MONGODB_URI` in `.env`

**JWT errors:**
- Ensure token is properly formatted: `Bearer <token>`
- Tokens expire after 24 hours, user needs to login again

**CORS errors:**
- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure backend is running before frontend makes requests

## Future Enhancements

- Email notifications for exceeded MD
- Data export to CSV/PDF
- Advanced analytics and reporting
- Dashboard API for visualizations
- Reaading approval workflow
- Automated alerts system

## License

ISC
