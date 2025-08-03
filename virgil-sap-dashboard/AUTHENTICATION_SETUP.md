# Multi-User Authentication Setup Guide

This guide will help you set up the multi-user authentication system for Virgil.io with Google OAuth and manual access control.

## Overview

The authentication system includes:

- Google OAuth for user sign-in
- Manual access control (admin approval required)
- User management admin panel
- Subscription tier management
- Multi-tenant data isolation

## Prerequisites

1. **Google OAuth Setup**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Copy the Client ID and Client Secret

2. **Database Setup**
   - Ensure your PostgreSQL database is running
   - The system will automatically create the necessary tables

## Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Existing database variables (keep these)
DB_USER="your-db-user"
DB_HOST="your-db-host"
DB_NAME="your-db-name"
DB_PASSWORD="your-db-password"
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Prisma

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 3. Run Database Migrations

```bash
# Run existing migrations
npm run migrate

# Run user-related migrations
npm run migrate:users
```

### 4. Set up Admin User

```bash
# Create the first admin user
npm run setup:admin
```

This creates an admin user with:

- Email: `admin@virgil.io`
- Password: (Google OAuth only)
- Admin privileges: Yes
- Active status: Yes

**Important**: Update the admin email in the database after first login.

### 5. Start the Development Server

```bash
npm run dev
```

## How It Works

### User Registration Flow

1. **User visits the application**

   - Redirected to `/auth/signin` if not authenticated

2. **User clicks "Continue with Google"**

   - Google OAuth flow begins
   - User authenticates with Google

3. **New user registration**

   - User account is created in database
   - `isActive` is set to `false`
   - User is redirected to pending approval page

4. **Existing user login**
   - If `isActive` is `true`: User can access the application
   - If `isActive` is `false`: User sees pending approval page

### Admin Management

1. **Access admin panel**

   - Navigate to `/admin` (only visible to admin users)
   - View all users and their status

2. **Grant access**

   - Click "Grant Access" for pending users
   - Set subscription tier if needed
   - User will be notified via email (implement email service)

3. **Revoke access**
   - Click "Revoke Access" to deactivate users
   - Users will lose access immediately

### Data Isolation

- All API routes are now user-aware
- Users can only see their own data
- Companies, deals, and files are filtered by `user_id`
- Admin users can see all data

## API Routes

### Authentication

- `GET /api/auth/signin` - Sign in page
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Admin

- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users/[userId]` - Update user access (admin only)

### User-Aware Routes

- `GET /api/companies` - User's companies only
- `POST /api/companies` - Create company for current user
- `GET /api/deals` - User's deals only
- `POST /api/deals` - Create deal for current user

## Customization

### Email Notifications

To implement email notifications for access approval:

1. Set up an email service (SendGrid, AWS SES, etc.)
2. Create an email service in `src/lib/email.ts`
3. Update the admin panel to send emails when access is granted

### Subscription Tiers

The system supports subscription tiers:

- `basic` - Limited features
- `premium` - Full features
- `enterprise` - All features + priority support

### Custom Access Control

You can extend the access control by:

1. Adding more user fields in the Prisma schema
2. Updating the auth callbacks in `src/lib/auth.ts`
3. Adding role-based permissions

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Database**: Use strong passwords and enable SSL
3. **OAuth**: Regularly rotate Google OAuth credentials
4. **Session**: Use a strong NEXTAUTH_SECRET
5. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**

   - Check Google OAuth redirect URIs in Google Cloud Console
   - Ensure NEXTAUTH_URL is set correctly

2. **"Database connection failed"**

   - Verify DATABASE_URL is correct
   - Check database server is running
   - Ensure database user has proper permissions

3. **"User not found"**

   - Run `npm run setup:admin` to create admin user
   - Check if user exists in database

4. **"Unauthorized" errors**
   - Verify user is authenticated and active
   - Check if user has proper permissions

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
DEBUG="next-auth:*"
```

## Production Deployment

1. **Set production environment variables**
2. **Use HTTPS in production**
3. **Set up proper email service**
4. **Configure Google OAuth for production domain**
5. **Set up monitoring and logging**

## Support

For issues or questions:

- Check the logs for error messages
- Verify all environment variables are set
- Ensure database migrations have run successfully
- Contact support at support@virgil.io
