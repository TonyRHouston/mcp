import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import express, { Request, Response } from 'express';

export interface AuthConfig {
  enabled: boolean;
  // Additional auth config options can be added here later
}

export interface WellKnownOAuthMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
}

export function addAuthEndpoints(app: express.Application, config: AuthConfig): void {
  if (!config.enabled) {
    return;
  }

  // OAuth configuration must be provided via environment variables
  // This is a reference implementation - configure with your OAuth provider
  const authorizationUrl = process.env.OAUTH_AUTHORIZATION_URL;
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const revocationUrl = process.env.OAUTH_REVOCATION_URL; // Optional
  const issuerUrl = process.env.OAUTH_ISSUER_URL;
  const baseUrl = process.env.OAUTH_BASE_URL;
  const serviceDocUrl = process.env.OAUTH_SERVICE_DOC_URL;

  if (!authorizationUrl || !tokenUrl || !issuerUrl || !baseUrl || !serviceDocUrl) {
    throw new Error(
      'OAuth authentication is enabled but required environment variables are not set. ' +
      'Please configure: OAUTH_AUTHORIZATION_URL, OAUTH_TOKEN_URL, OAUTH_ISSUER_URL, ' +
      'OAUTH_BASE_URL, and OAUTH_SERVICE_DOC_URL. OAUTH_REVOCATION_URL is optional.'
    );
  }

  const proxyProvider = new ProxyOAuthServerProvider({
      endpoints: {
          authorizationUrl,
          tokenUrl,
          revocationUrl: revocationUrl || undefined,
      },
      verifyAccessToken: async (token) => {
          // WARNING: This is a minimal implementation for demonstration purposes.
          // In production, you MUST validate tokens against your OAuth provider.
          // Example: Call your OAuth provider's introspection endpoint or validate JWT signature
          // See AUTH.md for implementation requirements and examples.
          throw new Error('verifyAccessToken must be implemented with proper token validation. See AUTH.md for implementation requirements and examples.');
      },
      getClient: async (client_id) => {
          // WARNING: This is a minimal implementation for demonstration purposes.
          // In production, you MUST validate client_id and retrieve actual client configuration
          // from your OAuth provider or database.
          // See AUTH.md for implementation requirements and examples.
          throw new Error('getClient must be implemented with proper client validation. See AUTH.md for implementation requirements and examples.');
      }
  })

  app.use(mcpAuthRouter({
      provider: proxyProvider,
      issuerUrl: new URL(issuerUrl),
      baseUrl: new URL(baseUrl),
      serviceDocumentationUrl: new URL(serviceDocUrl),
  }))
}
