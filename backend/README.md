# Backend README

This folder contains the API and real-time backend for Chatty, a full-stack chat application.

## Purpose

The backend is responsible for:

- user authentication
- OTP-based email verification
- password reset flows
- secure JWT and cookie management
- MongoDB data storage
- real-time messaging using Socket.IO
- group chat logic and membership management
- email delivery for account notifications

---

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT
- bcryptjs
- cors
- cookie-parser
- dotenv
- nodemailer
- nodemon

---

## Main Features

### Authentication
- Signup with email and password
- OTP verification
- Login/logout
- Forgot password
- Reset password
- JWT auth checks
- Profile updates
- Password changes
- Delete account

### Real-time messaging
- Direct messaging between users
- Online status tracking
- Message delivery via Socket.IO
- Blocking/unblocking user logic
- Conversation deletion for the authenticated user

### Group management
- Create groups
- Add members
- Remove group members by leaving the group
- Update group info
- Delete groups
- Group message communication and notifications

---

## Project Structure

```text
backend/
├── package.json
├── README.md
└── src/
    ├── index.js
    ├── controllers/
    │   ├── AuthContoller.js
    │   ├── GroupController.js
    │   └── MessageContoller.js
    ├── lib/
    │   ├── db.js
    │   ├── mailer.js
    │   ├── socket.js
    │   └── utils.js
    ├── middleware/
    │   └── AuthMiddleware.js
    ├── models/
    │   ├── GroupModel.js
    │   ├── MessageModel.js
    │   ├── OtpModel.js
    │   └── UserModel.js
    └── routes/
        ├── AuthRoute.js
        ├── GroupRoute.js
        └── MessageRoute.js
```

---

## Important Files

### `src/index.js`
Entry point for the Express server. It configures:

- JSON parsing
- cookie parsing
- CORS
- API routes
- Socket.IO server
- database connection
- production static serving

### `src/lib/db.js`
Connects the application to MongoDB using Mongoose.

### `src/lib/socket.js`
Creates the Socket.IO server and maintains an online user socket map.

### `src/lib/mailer.js`
Handles email sending for OTP verification and password reset flows.

### `src/lib/utils.js`
Contains common helpers, including JWT cookie generation and OTP generation.

### `src/middleware/AuthMiddleware.js`
Protects routes by verifying the JWT and attaching the authenticated user to the request.

### `src/models/UserModel.js`
Stores user data, profile settings, blocked users, and verification state.

### `src/models/MessageModel.js`
Stores direct and group messages with deletion tracking.

### `src/models/GroupModel.js`
Stores group metadata, owner, and members.

### `src/models/OtpModel.js`
Stores one-time codes for email verification and password reset.

---

## Environment Variables

Create a `.env` file in the backend root with the following values:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/chatty
JWT_SECRET=your_super_secret_key
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_REPLY_TO=your_email@gmail.com
NODE_ENV=development
```

---

## Install and Run

```bash
cd backend
npm install
npm run dev
```

The app starts on:

```text
http://localhost:5001
```

---

## API Route Summary

### Authentication
```text
POST /api/auth/signup
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
PUT /api/auth/update-profile
PUT /api/auth/change-password
DELETE /api/auth/delete-account
GET /api/auth/check
```

### Direct Messaging
```text
GET /api/messages/users
GET /api/messages/:id
POST /api/messages/send/:id
POST /api/messages/block/:id
DELETE /api/messages/conversation/:id
```

### Group Chat
```text
POST /api/groups
GET /api/groups
GET /api/groups/:id/messages
POST /api/groups/:id/send
POST /api/groups/:id/update
POST /api/groups/:id/members
POST /api/groups/:id/leave
DELETE /api/groups/:id/conversation
DELETE /api/groups/:id
```

---

## Notes

- The backend is designed to work with the frontend running on `http://localhost:5173`.
- Email verification and reset flows send real emails if SMTP credentials are set.
- In development, OTP codes may be logged to the console if mail sending fails.
- This backend is designed to support both direct messaging and group-based communication in real time.

---

## Security Practices

- Passwords are hashed before storage.
- JWT tokens are stored in HTTP-only cookies.
- Route protection is enforced with middleware.
- Sensitive configuration is stored in environment variables rather than in source files.

---

## Summary

This backend provides the core functionality behind Chatty, including chat logic, authorization, OTP security, MongoDB persistence, and Socket.IO real-time updates. It is built to serve the frontend apps and handle all social and communication features of the platform.
