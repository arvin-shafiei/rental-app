# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Security Best Practices

### Environment Variables

**CRITICAL**: Never commit secrets or API keys to the repository.

- All sensitive values must be stored in environment variables
- Use `.env.example` files as templates (without actual values)
- Add `.env` files to `.gitignore`
- Rotate keys regularly
- Use different keys for development and production

### Required Environment Variables

#### Backend (`backend/.env`)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase (REQUIRED)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # KEEP SECRET

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key  # KEEP SECRET

# OpenAI (OPTIONAL - for contract analysis)
OPENAI_API_KEY=your_openai_api_key  # KEEP SECRET
```

#### Frontend (`frontend/.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Supabase (Public keys only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: Only `NEXT_PUBLIC_*` variables are exposed to the browser. Never use service role keys or secret keys in frontend code.

### Authentication & Authorization

- **JWT Tokens**: All API requests use JWT tokens from Supabase Auth
- **Row Level Security (RLS)**: Database tables use RLS policies to protect user data
- **Token Validation**: Backend validates tokens on every protected endpoint
- **Service Role Key**: Only used server-side, never exposed to clients

### Data Protection

- **Encryption**: Supabase handles encryption at rest and in transit
- **HTTPS**: Always use HTTPS in production
- **Input Validation**: All user inputs are validated
- **SQL Injection**: Use parameterized queries (Supabase handles this)

### Storage Security

- **Bucket Policies**: Supabase storage buckets have RLS policies
- **File Upload Limits**: Implemented on both frontend and backend
- **File Type Validation**: Only allowed file types are accepted
- **Access Control**: Users can only access their own files

### API Security

- **CORS**: Configured to allow only trusted origins
- **Rate Limiting**: Consider implementing rate limiting for production
- **Error Handling**: Don't expose sensitive information in error messages

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, please email security@example.com with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will:

1. Acknowledge receipt within 48 hours
2. Investigate and provide an initial assessment within 7 days
3. Keep you informed of the progress
4. Credit you in the security advisory (if desired)

## Security Checklist for Contributors

Before submitting a PR, ensure:

- [ ] No secrets or API keys in code
- [ ] All environment variables documented in `.env.example`
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive information
- [ ] Database queries use parameterized statements
- [ ] Authentication checks on protected endpoints
- [ ] RLS policies updated if adding new tables
- [ ] File uploads validated and restricted

## Known Security Considerations

### Supabase Service Role Key

The service role key bypasses RLS policies. It should:

- Only be used server-side
- Never be exposed to the frontend
- Be rotated if compromised
- Have minimal scope (only what's needed)

### Stripe Keys

- Use test keys for development
- Use live keys only in production
- Never commit keys to version control
- Rotate keys if exposed

### OpenAI API Key

- Store securely in environment variables
- Monitor usage to detect abuse
- Use API key restrictions if available
- Rotate if compromised

## Updates and Patches

Security updates will be:

- Released as patches for supported versions
- Documented in release notes
- Prioritized over feature development

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!

