# Password Vault - Secure Password Manager

A privacy-first password manager built with **Next.js 15**, **TypeScript**, and **MongoDB**. Features client-side AES-256-GCM encryption to ensure your passwords are never stored in plaintext on our servers.

## 🔒 Security Features

- **Client-side Encryption**: All vault items are encrypted using AES-256-GCM before being sent to the server
- **Master Password**: Your login password serves as the encryption key - we never see your data in plaintext
- **Secure Password Generation**: Generate strong passwords with customizable options
- **Auto-clearing Clipboard**: Copied passwords are automatically cleared from clipboard after 15 seconds
- **JWT Authentication**: Secure session management with JSON Web Tokens

## ✨ Features

### Must-Have Features (Completed ✅)
- **Password Generator**: Length slider (4-128 characters), include/exclude character types, exclude similar characters
- **Simple Authentication**: Email + password registration and login
- **Vault Management**: Store title, username, password, URL, and notes for each entry
- **Client-side Encryption**: Uses Web Crypto API with AES-256-GCM encryption
- **Copy to Clipboard**: Auto-clear after 15 seconds
- **Search & Filter**: Basic search functionality across vault items

### Additional Features
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Password Strength**: Visual strength indicator
- **Responsive Design**: Works on desktop and mobile devices
- **Fast & Minimal UI**: Clean, fast interface with no heavy themes

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Styling**: Tailwind CSS v4
- **Authentication**: JWT with bcryptjs for password hashing
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Update `.env.local` with your values:
   
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/password-vault
   # For production: mongodb+srv://username:password@cluster.mongodb.net/password-vault
   
   # JWT Secret (change this!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Next.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔐 Encryption Details

**Why AES-256-GCM?**
I chose AES-256-GCM encryption with Web Crypto API because it provides:
- **Authentication**: Ensures data hasn't been tampered with
- **Performance**: Hardware-accelerated encryption in modern browsers
- **Security**: Industry-standard 256-bit encryption

**Implementation**:
- Key derivation: PBKDF2 with 100,000 iterations
- Random salt per item (16 bytes)
- Random IV per item (12 bytes)
- Client-side only - server never sees plaintext

## 📱 Demo

The application includes:
1. **Registration/Login** with master password
2. **Password Generator** with strength indicator
3. **Vault Management** with search and CRUD operations
4. **Dark Mode** toggle
5. **Clipboard Auto-Clear** after 15 seconds

## 🚀 Deployment

Ready for deployment to Vercel:

1. Connect to GitHub
2. Set environment variables in Vercel
3. Deploy automatically

## 🔒 Security Notes

- All vault items are encrypted client-side before sending to server
- Server only stores encrypted blobs - never plaintext passwords
- Master password is hashed with bcrypt (12 rounds)
- JWT tokens for secure session management
- Auto-logout and session cleanup

---

**Built as a demonstration of modern web security practices and client-side encryption.**
