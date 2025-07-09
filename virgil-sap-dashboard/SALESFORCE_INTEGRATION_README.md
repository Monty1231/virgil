# Salesforce Integration for Commission Data Export

This document explains how to set up and use the Salesforce integration feature for exporting commission data from the Virgil SAP Dashboard.

## Overview

The Salesforce integration allows you to export commission submissions directly to Salesforce as Opportunities, Quotes, or Orders. The integration supports both development (mock) and production environments with automatic token refresh functionality.

## Features

- **Multiple Export Types**: Export as Opportunity, Quote, Order, or all three
- **Configurable Options**: Set stage, probability, close date, and additional notes
- **Account Creation**: Optionally create account records in Salesforce
- **Progress Tracking**: Real-time export progress with detailed feedback
- **Error Handling**: Comprehensive error reporting and validation
- **Development Mode**: Mock mode for testing without Salesforce credentials
- **Automatic Token Refresh**: Automatically refresh expired access tokens
- **Connection Testing**: Pre-flight connection validation before export

## Setup Instructions

### 1. Environment Variables

To enable real Salesforce integration, set the following environment variables in your `.env.local` file:

```bash
# Salesforce Configuration
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_access_token_here

SALESFORCE_REFRESH_TOKEN=your_refresh_token_here
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
SALESFORCE_API_VERSION=64.0
```

### 2. Salesforce Authentication

#### Option A: Connected App with OAuth (Recommended)

1. **Create a Connected App in Salesforce:**

   - Go to Setup → App Manager → New Connected App
   - Enable OAuth Settings
   - Set Callback URL to your application URL
   - Add required OAuth scopes:
     - `api` (Full access)
     - `refresh_token` (Perform requests at any time)
     - `offline_access` (Access and manage your data)

2. **Generate Access Token and Refresh Token:**
   ```bash
   # Using Salesforce CLI
   sfdx auth:web:login -r https://your-instance.salesforce.com
   sfdx auth:accesstoken:store -u your-username --json
   ```

#### Option B: Username-Password Flow

1. **Create a Connected App with Username-Password flow**
2. **Get access token via REST API:**
   ```bash
   curl -X POST https://your-instance.salesforce.com/services/oauth2/token \
     -d "grant_type=password" \
     -d "client_id=your_connected_app_client_id" \
     -d "client_secret=your_connected_app_client_secret" \
     -d "username=your_salesforce_username" \
     -d "password=your_salesforce_password_with_security_token"
   ```

### 3. Automatic Token Refresh

The integration now includes automatic token refresh functionality:

- **Automatic Refresh**: When the access token expires, the system will automatically refresh it using the refresh token
- **Retry Logic**: Failed requests due to expired tokens will be retried once with the new token
- **Better Error Messages**: More helpful error messages for authentication issues

**Required for Token Refresh:**

- `SALESFORCE_REFRESH_TOKEN`: Your refresh token from the OAuth flow
- `SALESFORCE_CLIENT_ID`: Your Connected App's client ID
- `SALESFORCE_CLIENT_SECRET`: Your Connected App's client secret

### 4. Development Mode

If you don't have Salesforce credentials, the system will run in development mode:

- All exports will be logged to the console
- No actual Salesforce API calls will be made
- Perfect for testing the UI and workflow

## Usage

### 1. Access the Commission Page

Navigate to `/commissions` in your application.

### 2. Export Commission Data

1. **Find a commission submission** in the Submission History section
2. **Click "Export to Salesforce"** button
3. **Configure export options:**
   - **Export Type**: Choose Opportunity, Quote, Order, or All
   - **Stage**: Set the Salesforce opportunity stage
   - **Probability**: Set the win probability percentage
   - **Close Date**: Set the expected close date
   - **Additional Notes**: Add any extra information
   - **Create Account**: Optionally create an account record
4. **Click "Export to Salesforce"** to proceed

### 3. Monitor Export Progress

- **Progress Bar**: Shows real-time export progress
- **Success Message**: Displays Salesforce record ID on completion
- **Error Handling**: Shows detailed error messages if export fails
- **Connection Testing**: Validates Salesforce connection before export

## API Endpoints

### POST `/api/commissions/export-to-salesforce`

Exports commission data to Salesforce.

**Request Body:**

```json
{
  "id": 1,
  "deal_id": 123,
  "deal_name": "TechCorp S/4HANA Implementation",
  "deal_value": 750000,
  "commission_rate": 5,
  "commission_amount": 37500,
  "submission_status": "Approved",
  "submission_date": "2024-01-10",
  "notes": "Q4 2023 deal",
  "submitted_by": 1,
  "exportOptions": {
    "exportType": "opportunity",
    "stage": "Prospecting",
    "probability": 20,
    "closeDate": "2024-02-10",
    "additionalNotes": "Additional information",
    "createAccount": false,
    "accountName": ""
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully exported to Salesforce CPQ",
  "data": {
    "salesforceId": "006XXXXXXXXXXXXXXX",
    "opportunity": {
      "Name": "TechCorp S/4HANA Implementation",
      "Amount": 750000,
      "CloseDate": "2024-02-10",
      "StageName": "Prospecting",
      "Description": "Commission submission for deal 123...",
      "Type": "New Customer",
      "LeadSource": "Virgil Dashboard",
      "Probability": 20
    },
    "commissionData": { ... }
  }
}
```

## Salesforce Object Mapping

### Opportunity Fields

- `Name` → Deal name or "Commission Deal {deal_id}"
- `Amount` → Deal value
- `CloseDate` → Configurable close date
- `StageName` → Configurable stage
- `Description` → Commission details + notes
- `Type` → "New Customer"
- `LeadSource` → "Virgil Dashboard"
- `Probability` → Configurable probability

### Quote Fields (Future Implementation)

- `Name` → "Quote for {deal_name}"
- `OpportunityId` → Created opportunity ID
- `ExpirationDate` → Close date + 30 days
- `Status` → "Draft"
- `GrandTotal` → Deal value

### Order Fields (Future Implementation)

- `OpportunityId` → Created opportunity ID
- `EffectiveDate` → Close date
- `Status` → "Draft"
- `TotalAmount` → Deal value

## Error Handling

### Common Errors

1. **Missing Salesforce Configuration**

   ```
   Error: Salesforce configuration missing. Please set SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN environment variables.
   ```

   **Solution**: Set the required environment variables.

2. **Invalid Access Token**

   ```
   Error: Salesforce API error: 401 Unauthorized
   ```

   **Solution**:

   - If you have refresh token configured, the system will automatically refresh
   - Otherwise, regenerate your access token manually

3. **Failed to refresh Salesforce access token**

   ```
   Error: Failed to refresh Salesforce access token. Please re-authenticate.
   ```

   **Solution**:

   - Your refresh token may have expired
   - Re-authenticate with Salesforce to get a new refresh token
   - Ensure your Connected App has the `refresh_token` scope enabled

4. **Failed to connect to Salesforce**

   ```
   Error: Failed to connect to Salesforce. Please check your credentials and try again.
   ```

   **Solution**:

   - Verify your Salesforce instance URL is correct
   - Check that your access token is valid
   - Ensure your Salesforce instance is accessible

5. **Missing Required Fields**
   ```
   Error: Missing required commission data
   ```
   **Solution**: Ensure all required commission fields are provided.

## Troubleshooting

### Authentication Issues

1. **Session Expired**: The system will automatically attempt to refresh the token
2. **Refresh Token Expired**: Re-authenticate with Salesforce
3. **Invalid Credentials**: Double-check your environment variables

### Connection Issues

1. **Network Problems**: Check your internet connection
2. **Salesforce Instance**: Verify the instance URL is correct
3. **API Limits**: Check your Salesforce org's API usage limits

### Development Mode

If you encounter issues with real Salesforce integration:

1. **Test in Development Mode**: Remove Salesforce environment variables to test the UI
2. **Check Console Logs**: Look for detailed error messages
3. **Verify Configuration**: Ensure all environment variables are set correctly

## Security Best Practices

1. **Secure Token Storage**

   - Store tokens securely in production
   - Use environment variables or secure key management systems
   - Never commit credentials to version control

2. **Minimal Permissions**

   - Only grant the OAuth scopes you need
   - Regularly rotate access tokens and refresh tokens

3. **Monitor Usage**
   - Check Salesforce API usage limits
   - Monitor for unusual activity
   - Set up proper logging for API calls

## Production Deployment

For production deployment:

1. **Environment Variables**: Set all required environment variables on your hosting platform
2. **Production Instance**: Use a production Salesforce instance
3. **Error Monitoring**: Implement proper error monitoring and alerting
4. **Logging**: Set up comprehensive logging for API calls
5. **Rate Limiting**: Configure rate limiting if needed
6. **OAuth Configuration**: Ensure all OAuth credentials are properly configured
7. **Security**: Use secure token storage and management

## Support

If you encounter issues:

1. Check the browser console for error details
2. Verify your Salesforce configuration
3. Test with development mode first
4. Review the Salesforce API documentation
5. Check your Salesforce org's API limits
6. Ensure your Connected App has the correct OAuth scopes
7. Test the connection using the built-in connection test
