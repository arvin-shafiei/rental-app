# Authentication Middleware

This directory contains middleware for handling authentication in the application.

## Auth Middleware

The auth middleware (`auth.ts`) provides a way to protect routes by requiring a valid Supabase JWT token.

### How it works

1. The middleware extracts the JWT token from the Authorization header (in Bearer format)
2. It verifies the token by making a request to Supabase's auth.getUser() endpoint, which validates the token
3. If the token is valid, the user is attached to the request object and the request continues
4. If the token is invalid or missing, an appropriate error response is sent

### How to use

To protect a route with authentication:

```typescript
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// This route requires authentication
router.get('/some-protected-route', authenticateUser, (req, res) => {
  // The authenticated user is available as req.user
  const user = (req as any).user;
  
  // Your route logic here...
  res.json({ data: 'Protected data', user: user.email });
});

export default router;
```

### Client-side usage

From the client side, you need to:

1. Get the access token after login (from Supabase Auth)
2. Include it in API requests to protected routes:

```javascript
// Example with fetch
const response = await fetch('http://localhost:3001/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Security Considerations

- This implementation uses Supabase's `auth.getUser()` method which makes a network request to Supabase to verify the token
- While slightly slower than local JWT verification, this approach is more secure because:
  - It checks if the token has been revoked
  - It doesn't require storing the JWT secret on your server
  - The verification logic stays updated with Supabase's security practices

### Error Handling

The middleware returns appropriate status codes and messages for different error scenarios:
- 401 - Token missing, expired, or invalid
- 500 - Server error during verification 