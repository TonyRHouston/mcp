# OAuth Authentication Configuration

## Overview

The Everything MCP server includes optional OAuth authentication support. This is a **reference implementation** for demonstration purposes and requires proper configuration before use in any environment.

## ⚠️ Security Warning

The default authentication implementation is **NOT production-ready**. It includes placeholder functions that throw errors and must be replaced with proper OAuth provider integration.

## Configuration

### Required Environment Variables

To enable OAuth authentication, you must configure the following environment variables:

```bash
# OAuth Provider Endpoints
OAUTH_AUTHORIZATION_URL=https://your-oauth-provider.com/oauth2/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth2/token
OAUTH_REVOCATION_URL=https://your-oauth-provider.com/oauth2/revoke  # Optional
OAUTH_ISSUER_URL=https://your-oauth-provider.com
OAUTH_BASE_URL=https://your-mcp-server.com
OAUTH_SERVICE_DOC_URL=https://docs.your-mcp-server.com/
```

### Implementation Requirements

Before enabling authentication in production, you **MUST** implement:

1. **Token Verification** (`verifyAccessToken`)
   - Validate tokens against your OAuth provider's introspection endpoint
   - Or verify JWT signatures using your provider's public keys
   - Return proper token information including scopes and client ID

2. **Client Validation** (`getClient`)
   - Validate client_id against your OAuth provider or database
   - Retrieve actual client configuration including authorized redirect URIs
   - Implement proper client authentication

### Example OAuth Providers

Common OAuth providers you can integrate:

- **GitHub OAuth**: https://docs.github.com/en/developers/apps/building-oauth-apps
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Auth0**: https://auth0.com/docs/authenticate
- **Okta**: https://developer.okta.com/docs/guides/implement-oauth-for-okta/overview/
- **Azure AD**: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

## Usage

Authentication is disabled by default. To enable it:

```typescript
import { addAuthEndpoints } from './auth.js';

const authConfig = { enabled: true };
addAuthEndpoints(app, authConfig);
```

## Security Best Practices

1. **Never hardcode credentials** - Always use environment variables
2. **Validate all tokens** - Don't trust tokens without verification
3. **Use HTTPS** - OAuth requires secure transport
4. **Implement rate limiting** - Protect against brute force attacks
5. **Log authentication events** - Monitor for suspicious activity
6. **Rotate secrets regularly** - Update client secrets and signing keys
7. **Implement proper error handling** - Don't leak sensitive information in errors

## Testing

For development/testing purposes only, you can use a test OAuth provider like:
- [Mock OAuth2 Server](https://github.com/navikt/mock-oauth2-server)
- [ORY Hydra](https://www.ory.sh/hydra/)

**Never use test/mock servers in production.**
