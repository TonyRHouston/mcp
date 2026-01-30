# Security Considerations for Google Drive Storage

## Overview

When using Google Drive as a storage backend for the MCP Memory Server, it's important to follow security best practices to protect sensitive data and credentials.

## Credential Management

### ⚠️ DO NOT
- **Never commit credentials to version control**: Do not add your Google Service Account credentials JSON file to git or any public repository
- **Avoid hardcoding credentials**: Do not hardcode credentials directly in configuration files that might be shared
- **Don't share credentials publicly**: Keep your service account credentials private and secure

### ✅ DO
- **Use environment variables**: Store credentials in environment variables rather than configuration files
- **Restrict service account permissions**: Give the service account only the minimum permissions needed (access only to specific folders)
- **Use separate credentials per environment**: Use different service accounts for development, staging, and production
- **Rotate credentials regularly**: Periodically create new service account keys and delete old ones
- **Store credentials securely**: Use secure credential management systems (e.g., password managers, secret management services)

## Google Service Account Best Practices

### 1. Minimal Permissions
- Only grant the service account access to the specific Google Drive folder needed
- Use "Editor" permission only if write access is required
- Consider "Viewer" permission if read-only access is sufficient

### 2. Access Control
- Share the Drive folder only with the specific service account email
- Don't make the folder publicly accessible
- Regularly audit who has access to the folder

### 3. Credential Rotation
- Set up a regular schedule to rotate service account keys
- Delete old keys after rotation is complete
- Monitor for unauthorized key usage

### 4. Monitoring
- Enable Google Cloud audit logs for the service account
- Monitor for unexpected API usage
- Set up alerts for unusual activity

## Data Security

### Encryption
- Data is encrypted in transit between the MCP server and Google Drive using HTTPS
- Data is encrypted at rest by Google Drive
- Consider additional client-side encryption for highly sensitive data

### Data Access
- The memory data stored in Google Drive is only accessible to:
  - Users/services with the Google Drive folder permissions
  - The service account itself
- Ensure the service account credentials are stored securely to prevent unauthorized access

### Concurrent Access
- **Single Instance Recommended**: The current implementation is designed for single-instance use
- **Multiple Instances**: If running multiple instances of the MCP server with the same Google Drive storage:
  - Be aware of potential race conditions when creating/updating files
  - The implementation includes basic retry logic for 404 errors
  - For production use with multiple instances, consider implementing distributed locking or using a database backend
- **File Caching**: The implementation caches the Google Drive file ID to reduce API calls. This cache is cleared on 404 errors.

## Example Secure Setup

### Using Environment Files (Not Committed)
Create a `.env` file (add to `.gitignore`):
```bash
STORAGE_TYPE=googledrive
GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account",...}'
GOOGLE_DRIVE_FILENAME=mcp-memory.json
```

Load it when starting the server:
```bash
# Load environment variables
source .env
npx -y @modelcontextprotocol/server-memory
```

### Using Secret Management Services
For production deployments, consider using:
- **AWS Secrets Manager**: Store credentials securely in AWS
- **Google Cloud Secret Manager**: Native integration with Google Cloud
- **HashiCorp Vault**: Enterprise secret management
- **Azure Key Vault**: For Azure-based deployments

## Incident Response

If you suspect your credentials have been compromised:
1. **Immediately revoke the compromised service account key** in Google Cloud Console
2. **Create a new service account** with new credentials
3. **Update your configuration** with the new credentials
4. **Audit access logs** to identify any unauthorized activity
5. **Review and update access permissions** on affected Google Drive folders

## Compliance

Depending on your use case, you may need to consider:
- **GDPR**: If storing personal data of EU residents
- **HIPAA**: If storing health information (additional safeguards needed)
- **SOC 2**: For enterprise compliance requirements
- **Industry-specific regulations**: Consult with your compliance team

## Questions?

For security issues or concerns, please follow the responsible disclosure process outlined in the main repository's SECURITY.md file.
