# Rental App

A comprehensive rental management platform built with Next.js, Node.js, TypeScript, and Supabase. This application helps tenants manage their rental properties, track important dates, handle repair requests, manage deposits, and organize rental documents.

## 🚀 Features

- **Property Management**: Track multiple rental properties with photos and documents
- **Timeline Tracking**: Monitor important rental events, lease dates, and deadlines
- **Repair Requests**: Submit and track repair requests with photo evidence
- **Deposit Management**: Track deposit requests and returns
- **Contract Analysis**: AI-powered contract scanning and analysis
- **Agreement Builder**: Create flatmate agreements for shared rentals
- **Document Storage**: Secure storage for leases, receipts, and correspondence
- **Calendar Integration**: Export rental events to calendar applications
- **Stripe Integration**: Payment processing for premium features
- **Multi-user Support**: Invite roommates and property managers

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **AI**: OpenAI (for contract analysis)
- **Mobile**: Flutter (in development)

### Project Structure

```
rental-app/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── db/             # Database migrations
│   │   └── utils/          # Helper functions
│   └── package.json
├── frontend/        # Next.js web application
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & API clients
│   │   └── types/          # TypeScript types
│   └── package.json
└── flutter_app/    # Flutter mobile app (in development)
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **bun** (package manager)
- **Supabase Account** ([sign up here](https://supabase.com))
- **Stripe Account** (for payment features, [sign up here](https://stripe.com))
- **OpenAI API Key** (for contract analysis features, [get one here](https://platform.openai.com))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rental-app.git
cd rental-app
```

### 2. Backend Setup

```bash
cd backend
npm install  # or bun install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Configure the following environment variables in `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key

# OpenAI (optional, for contract analysis)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup

Run the database migrations in order:

```bash
# Connect to your Supabase project SQL editor
# Run migrations from backend/src/db/migrations/ in order:
# 001_create_profiles.sql
# 002_create_timeline_events_table.sql
# ... (all migration files)
```

See [Database Migrations](#database-migrations) section for details.

### 4. Frontend Setup

```bash
cd ../frontend
npm install  # or bun install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

Configure the following environment variables in `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev  # or bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev  # or bun run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🗄️ Database Migrations

The database schema is managed through SQL migration files located in `backend/src/db/migrations/`. Run them in order:

1. `001_create_profiles.sql` - User profiles table
2. `002_create_timeline_events_table.sql` - Timeline events
3. `003_create_property_users.sql` - Property-user relationships
4. `004_insert_property_users.sql` - Initial data
5. `005_contract_summaries.sql` - Contract storage
6. `006_create_deposit_requests.sql` - Deposit requests
7. `007_create_agreements.sql` - Flatmate agreements
8. `008_create_repair_requests.sql` - Repair requests
9. `010_modify_deposit_requests.sql` - Deposit request updates
10. `011_agreement_checklist_events.sql` - Agreement events
11. `016_update_timeline_events_policy.sql` - RLS policies
12. `017_update_timeline_events_filtering.sql` - Filtering updates
13. `018_create_property_images.sql` - Image storage
14. `019_migrate_existing_images.sql` - Image migration
15. `020_update_storage_bucket_policy.sql` - Storage policies
16. `021_create_stripe_tables.sql` - Stripe integration

**Important**: Always review migration files before running them in production.

## 🔐 Security

This project follows security best practices:

- **No secrets in code**: All sensitive values are stored in environment variables
- **Row Level Security (RLS)**: Supabase RLS policies protect user data
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All API endpoints validate user input
- **CORS Protection**: Configured CORS policies

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## 📚 API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Main Endpoints

- `GET /api/health` - Health check
- `GET /api/properties` - List user properties
- `POST /api/properties` - Create property
- `GET /api/timeline` - Get timeline events
- `POST /api/repair-requests` - Create repair request
- `POST /api/deposit-requests` - Create deposit request
- `POST /api/contracts/scan` - Analyze contract document
- `POST /api/agreements` - Create flatmate agreement

See individual route files in `backend/src/routes/` for detailed endpoint documentation.

## 🧪 Development

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Prettier formatting (recommended)

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend infrastructure
- [Next.js](https://nextjs.org) for the web framework
- [Stripe](https://stripe.com) for payment processing
- [OpenAI](https://openai.com) for AI capabilities

## 📧 Support

For support, email director@arvinfinance.com or open an issue in the repository.

## 🗺️ Roadmap

See [TODO.md](./TODO.md) for planned features and development roadmap.

---

**Note**: This is an open-source project. Please ensure you never commit secrets or API keys to the repository. Always use environment variables for sensitive configuration.
