# Chatty

A full-stack real-time chat application built with React, Vite, Express, MongoDB, and Socket.IO. It supports user authentication, one-time password verification, password resets, direct messaging, group chats, online user presence, profile management, and real-time notifications.

## Overview

Chatty is designed as a modern messaging platform with a clean client experience and a reliable API backend. The project is separated into two main folders:

- `backend/` — Express API, MongoDB models, authentication logic, mailer, and real-time socket server
- `frontend/` — React + Vite app with Zustand state management, Tailwind styling, and chat UI

There is also a `frontend/legacy-template/` folder kept separate from the active app. It is not part of the production chat application and can be ignored unless you intentionally want to reuse its starter code.

---

## Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Zustand
- Tailwind CSS
- DaisyUI
- Axios
- Socket.IO Client
- React Hot Toast
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT (JSON Web Tokens)
- Cookie-based session handling
- Bcrypt.js
- Nodemailer
- dotenv

### Tools & Dev Setup
- ESLint
- PostCSS
- Autoprefixer
- Nodemon

---

## Features

### Authentication
- Sign up with email + password
- Email verification using OTP
- Resend OTP support
- Login/logout
- JWT authentication with secure cookies
- Forgot password flow
- Reset password flow
- Protected routes and middleware
- Profile and password updates
- Account deletion

### Messaging
- One-to-one chat
- Real-time message delivery via Socket.IO
- Message deletion for selected user conversation
- Block/unblock users
- Online user tracking
- Image/text message support
- Group chat creation and management

### Group Features
- Create group chats
- Add members to groups
- Update group details
- Leave group
- Delete group
- Group conversation management
- Group real-time message updates

### Frontend UX
- Responsive design
- Authentication pages
- Landing page
- Chat sidebar and conversations
- Theme support
- Toast notifications
- Profile and settings pages

---

## Project Structure

```text
Chat-App/
├── README.md
├── project.json
├── backend/
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── index.js
│       ├── controllers/
│       │   ├── AuthContoller.js
│       │   ├── GroupController.js
│       │   └── MessageContoller.js
│       ├── lib/
│       │   ├── db.js
│       │   ├── mailer.js
│       │   ├── socket.js
│       │   └── utils.js
│       ├── middleware/
│       │   └── AuthMiddleware.js
│       ├── models/
│       │   ├── GroupModel.js
│       │   ├── MessageModel.js
│       │   ├── OtpModel.js
│       │   └── UserModel.js
│       └── routes/
│           ├── AuthRoute.js
│           ├── GroupRoute.js
│           └── MessageRoute.js
├── frontend/
│   ├── package.json
│   ├── README.md
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── AuthImagePattern.jsx
│       │   ├── ChatContainer.jsx
│       │   ├── ChatHeader.jsx
│       │   ├── MessageInput.jsx
│       │   ├── Navbar.jsx
│       │   ├── NoChatSelected.jsx
│       │   ├── Sidebar.jsx
│       │   └── skeletons/
│       ├── constants/
│       │   └── index.js
│       ├── lib/
│       │   ├── axios.js
│       │   └── utils.js
│       ├── pages/
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── HomePage.jsx
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── ResetPasswordPage.jsx
│       │   ├── SettingPage.jsx
│       │   ├── SignUpPage.jsx
│       │   └── VerifyOtpPage.jsx
│       └── store/
│           ├── useAuthStore.js
│           ├── useChatStore.js
│           └── useThemeStore.js
└── frontend/legacy-template/
    └── (unused starter project kept separate)
```

---

## Environment Variables

Create a `.env` file in the `backend/` folder with values similar to the following:

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

### Notes
- Use a real MongoDB connection string for production.
- For Gmail, use an app password instead of your main account password.
- Keep `JWT_SECRET` long and random.

---

## Installation

### 1. Clone the project

```bash
git clone <your-repository-url>
cd Chat-App
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Run the Project

### Start backend

```bash
cd backend
npm run dev
```

The backend runs on:

```text
http://localhost:5001
```

### Start frontend

```bash
cd frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

## Backend API Overview

### Auth routes
- `POST /api/auth/signup` — create account and send OTP
- `POST /api/auth/verify-otp` — verify OTP and log in
- `POST /api/auth/resend-otp` — resend verification code
- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — log out
- `POST /api/auth/forgot-password` — send password reset email
- `POST /api/auth/reset-password` — reset password
- `PUT /api/auth/update-profile` — update profile info
- `PUT /api/auth/change-password` — change password
- `DELETE /api/auth/delete-account` — delete user account
- `GET /api/auth/check` — verify current login session

### Messaging routes
- `GET /api/messages/users` — fetch users for sidebar
- `GET /api/messages/:id` — get conversation between users
- `POST /api/messages/send/:id` — send one-to-one message
- `POST /api/messages/block/:id` — block/unblock user
- `DELETE /api/messages/conversation/:id` — delete talk history for current user

### Group routes
- `POST /api/groups` — create a group
- `GET /api/groups` — fetch groups for authenticated user
- `GET /api/groups/:id/messages` — fetch group messages
- `POST /api/groups/:id/send` — send message in group
- `POST /api/groups/:id/update` — update group settings
- `POST /api/groups/:id/members` — add members
- `POST /api/groups/:id/leave` — leave group
- `DELETE /api/groups/:id/conversation` — clear group conversation for current user
- `DELETE /api/groups/:id` — delete a group

---

## Frontend Architecture

The frontend is built around a clean modular design:

- `pages/` — page-level screens such as login, signup, reset password, home, profile, settings, and landing page
- `components/` — reusable UI blocks such as navbar, chat input, sidebar, header, and chat container
- `store/` — global app state using Zustand for auth and chat state
- `lib/` — Axios configuration and utility helpers
- `constants/` — centralized frontend constants
- `components/skeletons/` — loading states and placeholders

### State management
- `useAuthStore.js` handles authentication, OTP, login, logout, session checks, profile updates, and socket connections.
- `useChatStore.js` handles users, messages, groups, conversations, and group logic.

---

## Security Notes

- JWT tokens are stored in secure HTTP-only cookies.
- Passwords are hashed using `bcryptjs` before being saved.
- Email verification helps prevent fake accounts.
- Protected API routes block unauthorized access.
- CORS is enabled for the frontend origin.
- Mail sending is configurable via environment variables.

---

## Production Notes

To deploy this app in production:

1. Set up a MongoDB database
2. Add real environment variables for production
3. Build the frontend:

```bash
cd frontend
npm run build
```

4. Serve the built frontend or point the backend to the dist output
5. Run the backend with `NODE_ENV=production`

---

## Contributing

Contributions are welcome. If you want to improve the app:

1. Create a new branch
2. Make your changes
3. Test the backend/frontend flows
4. Submit a pull request

---

## License

This project is for educational and personal project use unless you explicitly add a license. If you plan to publish or distribute it, consider adding a proper open-source license such as MIT.

---

## Summary

Chatty is a real-time messaging application with strong authentication, OTP verification, reset flows, direct messaging, optional group chats, and a clean modern user interface. The project is structured to clearly separate frontend and backend responsibilities while still sharing a seamless real-time experience.
