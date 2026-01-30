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

  // TODO: use github(?)
  const proxyProvider = new ProxyOAuthServerProvider({
      endpoints: {
          authorizationUrl: "https://auth.external.com/oauth2/v1/authorize",
          tokenUrl: "https://auth.external.com/oauth2/v1/token",
          revocationUrl: "https://auth.external.com/oauth2/v1/revoke",
      },
      verifyAccessToken: async (token) => {
          return {
              token,
              clientId: "123",
              scopes: ["openid", "email", "profile"],
          }
      },
      getClient: async (client_id) => {
          return {
              client_id,
              redirect_uris: ["http://localhost:3000/callback"],
          }
      }
  })

  app.use(mcpAuthRouter({
      provider: proxyProvider,
      issuerUrl: new URL("https://auth.external.com"),
      baseUrl: new URL("https://mcp.example.com"),
      serviceDocumentationUrl: new URL("https://docs.example.com/"),
  }))
}
