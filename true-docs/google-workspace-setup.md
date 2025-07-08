# Google Workspace Integration Setup Guide

This guide explains how to enable Google Workspace integration for the Ganger Actions application to automatically create and manage users in your Google Workspace domain.

## Prerequisites

- Google Workspace Admin access
- Google Cloud Console access
- Access to update environment variables

## Setup Steps

### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details:
   - Service account name: `ganger-workspace-admin`
   - Service account ID: `ganger-workspace-admin`
   - Description: `Service account for Ganger Actions Google Workspace integration`
6. Click **Create and Continue**

### 2. Grant Service Account Permissions

1. Skip the "Grant this service account access to project" step (not needed)
2. Click **Done**

### 3. Create Service Account Key

1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded JSON file securely

### 4. Enable Admin SDK API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Admin SDK API"
3. Click on it and press **Enable**

### 5. Configure Domain-Wide Delegation

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Security** > **API controls** > **Domain-wide delegation**
3. Click **Add new**
4. Enter:
   - Client ID: (found in the service account JSON file as `client_id`)
   - OAuth Scopes:
     ```
     https://www.googleapis.com/auth/admin.directory.user
     https://www.googleapis.com/auth/admin.directory.group
     https://www.googleapis.com/auth/admin.directory.orgunit
     ```
5. Click **Authorize**

### 6. Configure Environment Variables

Open the service account JSON file and add these values to your `.env` file:

```bash
# Google Workspace Service Account Configuration
GOOGLE_CLIENT_EMAIL="ganger-workspace-admin@your-project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# These should already be set:
GOOGLE_DOMAIN=gangerdermatology.com
GOOGLE_IMPERSONATE_EMAIL=anand@gangerdermatology.com
GOOGLE_TARGET_GROUP=gci-users@gangerdermatology.com
GOOGLE_TARGET_OU="/Google Cloud Identity"
```

**Important**: 
- Copy the entire private key including the BEGIN/END lines
- Keep the `\n` characters in the private key
- Ensure no extra spaces or line breaks are added

### 7. Test the Integration

1. Start the Ganger Actions application:
   ```bash
   cd apps/ganger-actions
   npm run dev
   ```

2. As an admin user, go to the Google Sync admin page
3. Click "Validate Configuration" to test the setup

## How It Works

When creating a new user in Ganger Actions:

1. The user is created in the local database
2. The system automatically:
   - Creates a Google Workspace account
   - Sets up the user in the correct Organizational Unit (`/Google Cloud Identity`)
   - Adds them to the appropriate group (`gci-users@gangerdermatology.com`)
   - Sets their department and manager information
   - Configures their work location and phone number

## Troubleshooting

### "Missing service account credentials" error
- Ensure `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set in `.env`
- Check that the private key is copied correctly with `\n` characters

### "Request had insufficient authentication scopes" error
- Verify domain-wide delegation is configured with all required scopes
- Check that `GOOGLE_IMPERSONATE_EMAIL` has admin privileges

### "User already exists" error
- The user may already exist in Google Workspace
- Use the sync function to update existing users

### "Failed to create user" error
- Check Google Admin audit logs for specific error details
- Verify the service account has proper permissions
- Ensure the impersonation email is a Super Admin

## Security Notes

- Keep the service account key file secure
- Never commit the private key to version control
- Regularly rotate service account keys
- Monitor Google Admin audit logs for unusual activity

## Manual Sync Options

For existing users or bulk operations:

1. **Single User Sync**: Use the admin interface to sync individual users
2. **Bulk Sync**: Sync all active users at once
3. **Create Workspace User**: Manually create a Google Workspace account for a database user

Last updated: January 7, 2025