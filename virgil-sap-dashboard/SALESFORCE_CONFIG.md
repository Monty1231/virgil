# Salesforce Configuration Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Salesforce Integration Configuration
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_access_token_here
SALESFORCE_REFRESH_TOKEN=your_refresh_token_here
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
SALESFORCE_API_VERSION=64.0
```

## Getting Your Salesforce Credentials

### Step 1: Create a Connected App

1. Log into your Salesforce instance
2. Go to **Setup** → **App Manager** → **New Connected App**
3. Fill in the basic information:
   - **Connected App Name**: Virgil Dashboard Integration
   - **API Name**: VirgilDashboardIntegration
   - **Contact Email**: your-email@company.com
4. Enable OAuth Settings:
   - **Callback URL**: `https://your-app-domain.com/auth/callback`
   - **Selected OAuth Scopes**:
     - `api` (Full access)
     - `refresh_token` (Perform requests at any time)
     - `offline_access` (Access and manage your data)

### Step 2: Get Access Token and Refresh Token

#### Method A: Using Salesforce CLI (Recommended)

```bash
# Install Salesforce CLI
npm install -g @salesforce/cli

# Login to your Salesforce instance
sfdx auth:web:login -r https://your-instance.salesforce.com

# Get access token and refresh token
sfdx auth:accesstoken:store -u your-username --json
```

#### Method B: Using REST API

```bash
curl -X POST https://your-instance.salesforce.com/services/oauth2/token \
  -d "grant_type=password" \
  -d "client_id=your_connected_app_client_id" \
  -d "client_secret=your_connected_app_client_secret" \
  -d "username=your_salesforce_username" \
  -d "password=your_salesforce_password_with_security_token"
```

### Step 3: Update Environment Variables

Replace the placeholder values in your `.env.local` file:

```bash
SALESFORCE_INSTANCE_URL=https://your-actual-instance.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_actual_access_token
SALESFORCE_REFRESH_TOKEN=your_actual_refresh_token
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
SALESFORCE_API_VERSION=58.0
```

## Automatic Token Refresh

The integration now includes automatic token refresh functionality:

- **Automatic Refresh**: When the access token expires, the system will automatically refresh it using the refresh token
- **Retry Logic**: Failed requests due to expired tokens will be retried once with the new token
- **Better Error Messages**: More helpful error messages for authentication issues

### Required for Token Refresh

To enable automatic token refresh, you need:

1. **Refresh Token**: Obtained during the initial OAuth flow
2. **Client ID**: Your Connected App's client ID
3. **Client Secret**: Your Connected App's client secret

If these are not provided, the system will still work but won't be able to automatically refresh expired tokens.

## Testing the Configuration

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the commissions page:**

   ```
   http://localhost:3001/commissions
   ```

3. **Try exporting a commission:**

   - Create or find a commission submission
   - Click "Export to Salesforce"
   - Configure the export options
   - Click "Export to Salesforce"

4. **Check the results:**
   - If successful, you'll see a Salesforce record ID
   - If in development mode, you'll see a mock success message
   - Check the browser console for detailed logs

## Troubleshooting

### Common Issues

1. **"Salesforce configuration missing" error**

   - Ensure all environment variables are set
   - Restart your development server after changing `.env.local`

2. **"401 Unauthorized" error**

   - Your access token may have expired
   - If you have refresh token configured, the system will automatically refresh
   - Otherwise, regenerate the access token manually
   - Check that your Connected App is properly configured

3. **"Failed to refresh Salesforce access token" error**

   - Your refresh token may have expired
   - Re-authenticate with Salesforce to get a new refresh token
   - Ensure your Connected App has the `refresh_token` scope enabled

4. **"Network error" during export**
   - Check your internet connection
   - Verify the Salesforce instance URL is correct
   - Ensure your Salesforce instance is accessible

### Development Mode

If you don't have Salesforce credentials, the system will run in development mode:

- All exports will be logged to the console
- No actual Salesforce API calls will be made
- Perfect for testing the UI and workflow

You'll see messages like:

```
[MOCK] Exporting to Salesforce CPQ: {commission data}
```

## Security Best Practices

1. **Never commit credentials to version control**

   - Keep `.env.local` in your `.gitignore`
   - Use environment variables for production

2. **Use minimal permissions**

   - Only grant the OAuth scopes you need
   - Regularly rotate access tokens and refresh tokens

3. **Monitor API usage**

   - Check Salesforce API usage limits
   - Monitor for unusual activity

4. **Secure token storage**
   - Store tokens securely in production
   - Use environment variables or secure key management systems

## Production Deployment

For production deployment:

1. **Set environment variables on your hosting platform**
2. **Use a production Salesforce instance**
3. **Implement proper error monitoring**
4. **Set up logging for API calls**
5. **Configure rate limiting if needed**
6. **Ensure all OAuth credentials are properly configured**

## Support

If you encounter issues:

1. Check the browser console for error details
2. Verify your Salesforce configuration
3. Test with development mode first
4. Review the Salesforce API documentation
5. Check your Salesforce org's API limits
6. Ensure your Connected App has the correct OAuth scopes
