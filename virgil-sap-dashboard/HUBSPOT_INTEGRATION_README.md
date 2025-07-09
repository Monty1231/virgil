# HubSpot Integration Guide

This guide explains how to set up and use the HubSpot integration for your Virgil SAP Dashboard.

## Overview

The HubSpot integration allows you to:

- Connect your application to HubSpot via OAuth
- Sync companies, contacts, and deals between your local database and HubSpot
- Create and update records in HubSpot from your application
- Maintain data consistency across both platforms

## Setup Instructions

### 1. Create a HubSpot App

1. Go to [HubSpot Developers](https://developers.hubspot.com/)
2. Sign in with your HubSpot account
3. Click "Create App"
4. Fill in the app details:
   - App name: "Virgil SAP Dashboard"
   - Description: "Integration for SAP solutions dashboard"
5. Save the app

### 2. Configure OAuth Settings

1. In your HubSpot app, go to "Auth" → "OAuth"
2. Add the following scopes:
   - `contacts` - Read and write contacts
   - `crm.objects.contacts.read` - Read contact data
   - `crm.objects.contacts.write` - Write contact data
   - `crm.objects.companies.read` - Read company data
   - `crm.objects.companies.write` - Write company data
   - `crm.objects.deals.read` - Read deal data
   - `crm.objects.deals.write` - Write deal data
3. Set the redirect URL to: `http://localhost:3000/api/hubspot/auth/callback`
4. Save the settings

### 3. Get Your Credentials

1. In your HubSpot app, go to "Auth" → "OAuth"
2. Copy the Client ID and Client Secret
3. You'll also need to generate an access token (see step 4)

### 4. Generate Access Token

#### Option A: Using the OAuth Flow (Recommended)

1. Set up your environment variables (see step 5)
2. Start your application
3. Go to Settings → HubSpot Integration
4. Click "Connect to HubSpot"
5. Complete the OAuth flow
6. The access token will be automatically stored

#### Option B: Manual Token Generation

1. Go to your HubSpot app → "Auth" → "OAuth"
2. Click "Generate Access Token"
3. Copy the generated token

### 5. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# HubSpot Configuration
HUBSPOT_CLIENT_ID="your_hubspot_client_id"
HUBSPOT_CLIENT_SECRET="your_hubspot_client_secret"
HUBSPOT_ACCESS_TOKEN="your_hubspot_access_token"
HUBSPOT_REDIRECT_URI="http://localhost:3000/api/hubspot/auth/callback"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database Configuration (if not already set)
DATABASE_URL="postgresql://username:password@localhost:5432/virgil_dashboard"
```

### 6. Install Dependencies

The HubSpot SDK is already installed. If you need to reinstall:

```bash
npm install @hubspot/api-client
```

## Usage

### Connecting to HubSpot

1. Go to Settings in your application
2. Find the "HubSpot Integration" section
3. Click "Connect to HubSpot"
4. Complete the OAuth authorization flow
5. You'll be redirected back to your application

### Syncing Data

Once connected, you can sync data in several ways:

#### Sync Companies

- Syncs all companies from your local database to HubSpot
- Creates new companies or updates existing ones
- Maps company properties appropriately

#### Sync Contacts

- Syncs contact information from your companies
- Creates contacts for primary and secondary contacts
- Associates contacts with their respective companies

#### Sync Deals

- Syncs deal pipeline data to HubSpot
- Maps deal stages to HubSpot pipeline stages
- Associates deals with companies and contacts

#### Sync All

- Performs a complete sync of all data types
- Recommended for initial setup or periodic synchronization

### API Endpoints

The integration provides the following API endpoints:

#### `/api/hubspot`

- `GET`: Test HubSpot connection
- `POST`: Create/update contacts, deals, or companies

#### `/api/hubspot/auth`

- `GET`: Initiate OAuth flow
- `POST`: Exchange authorization code for access token

#### `/api/hubspot/auth/callback`

- `GET`: Handle OAuth callback and token exchange

#### `/api/hubspot/sync`

- `POST`: Sync data between local database and HubSpot

## Data Mapping

### Company Properties

| Local Field  | HubSpot Property  | Description             |
| ------------ | ----------------- | ----------------------- |
| name         | name              | Company name            |
| industry     | industry          | Industry classification |
| website      | website           | Company website         |
| notes        | description       | Company description     |
| company_size | numberofemployees | Employee count range    |

### Contact Properties

| Local Field | HubSpot Property | Description        |
| ----------- | ---------------- | ------------------ |
| email       | email            | Contact email      |
| firstname   | firstname        | First name         |
| lastname    | lastname         | Last name          |
| company     | company          | Associated company |
| phone       | phone            | Phone number       |
| jobtitle    | jobtitle         | Job title          |

### Deal Properties

| Local Field         | HubSpot Property | Description         |
| ------------------- | ---------------- | ------------------- |
| deal_name           | dealname         | Deal name           |
| deal_value          | amount           | Deal value          |
| stage               | dealstage        | Pipeline stage      |
| expected_close_date | closedate        | Expected close date |
| notes               | description      | Deal description    |

## Troubleshooting

### Common Issues

#### "HUBSPOT_ACCESS_TOKEN environment variable is required"

- Make sure you've set the `HUBSPOT_ACCESS_TOKEN` in your environment variables
- Verify the token is valid and not expired

#### "Connection failed"

- Check that your HubSpot app is properly configured
- Verify the Client ID and Client Secret are correct
- Ensure the redirect URI matches your app settings

#### "OAuth error"

- Check that the redirect URI in your HubSpot app matches your environment variable
- Verify the scopes are properly configured
- Make sure your app is approved in HubSpot

#### "Failed to sync data"

- Check that your access token has the required permissions
- Verify the data format matches expected schemas
- Check the console for detailed error messages

### Debug Mode

To enable debug logging, add this to your environment variables:

```env
DEBUG=true
```

This will provide detailed logs for API calls and data synchronization.

## Security Considerations

1. **Access Tokens**: Store access tokens securely. In production, use a secure database or vault service.
2. **Environment Variables**: Never commit sensitive credentials to version control.
3. **OAuth Flow**: Use HTTPS in production for secure OAuth communication.
4. **Rate Limiting**: HubSpot has API rate limits. The integration handles basic rate limiting, but monitor usage.

## Production Deployment

For production deployment:

1. Update the redirect URI to your production domain
2. Use a secure method to store access tokens
3. Implement proper error handling and logging
4. Set up monitoring for sync operations
5. Consider implementing webhooks for real-time updates

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the server logs for detailed error information
3. Verify your HubSpot app configuration
4. Test the connection using the "Test Connection" button in settings

## API Reference

For detailed API documentation, see:

- [HubSpot API Documentation](https://developers.hubspot.com/docs/api/overview)
- [HubSpot Node.js SDK](https://github.com/HubSpot/hubspot-api-nodejs)
