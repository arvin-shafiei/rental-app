# Quick Start Guide

Get the Rental App up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Stripe account (for payment features)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/rental-app.git
cd rental-app

# Install backend dependencies
cd backend
npm install  # or bun install

# Install frontend dependencies
cd ../frontend
npm install  # or bun install
```

## Step 2: Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Project Settings > API
3. Copy your project URL and keys

## Step 3: Configure Environment Variables

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_test_key
```

### Frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 4: Set Up Database

1. Go to your Supabase project SQL Editor
2. Run the migrations from `backend/src/db/migrations/` in order:
   - Start with `001_create_profiles.sql`
   - Continue sequentially through all numbered files

**Quick migration script** (run in Supabase SQL Editor):
```sql
-- Copy and paste each migration file content in order
-- Or use Supabase CLI if you have it installed
```

## Step 5: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 6: Access the App

Open your browser to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/health

## Step 7: Create Your First Account

1. Go to http://localhost:3000/auth
2. Sign up with your email
3. Verify your email (check Supabase Auth emails)
4. Sign in and start using the app!

## Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Verify Supabase credentials are correct
- Check port 3001 is not in use

### Frontend won't start
- Check that `NEXT_PUBLIC_BACKEND_URL` points to your backend
- Verify Supabase keys are correct
- Check port 3000 is not in use

### Database errors
- Ensure all migrations have been run
- Check RLS policies are enabled
- Verify service role key has correct permissions

### Authentication issues
- Check Supabase Auth is enabled in your project
- Verify email confirmation is set up correctly
- Check browser console for errors

## Next Steps

- Read the [full README](./README.md) for detailed documentation
- Check [API.md](./API.md) for API endpoints
- Review [SECURITY.md](./SECURITY.md) for security best practices
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute

## Need Help?

- Open an issue on GitHub
- Check existing documentation
- Review the code comments

Happy coding! 🚀

