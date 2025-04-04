# Setting Up Google OAuth for Supabase

This guide will walk you through setting up Google OAuth for your Supabase project to enable Google Login in your application.

## Step 1: Configure OAuth in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "CREATE CREDENTIALS" → "OAuth client ID"
5. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: Agent from Loom
   - User support email: [your email]
   - Developer contact information: [your email]
   - Save and continue through the remaining steps

6. Return to "CREATE CREDENTIALS" → "OAuth client ID"
7. Choose "Web application" as the application type
8. Name: "Agent from Loom"
9. Under "Authorized JavaScript origins" add:
   - `https://dafizawmeehypygvgdge.supabase.co`
   - `http://localhost:3000` (for local development)

10. Under "Authorized redirect URIs" add:
    - `https://dafizawmeehypygvgdge.supabase.co/auth/v1/callback`
    - `http://localhost:3000/auth/callback` (for local development)

11. Click "CREATE"
12. Copy your **Client ID** and **Client Secret** 

## Step 2: Enable Google Auth in Supabase

1. Go to your Supabase dashboard: [https://dafizawmeehypygvgdge.supabase.co](https://dafizawmeehypygvgdge.supabase.co)
2. Navigate to **Authentication** → **Providers** → **Google**
3. Toggle the switch to enable Google authentication
4. Paste your **Client ID** and **Client Secret** from Step 1
5. Click "Save"

## Step 3: Configure Redirect URLs

Ensure that the following are set in Supabase Auth Settings:

1. Go to **Authentication** → **URL Configuration**
2. Set "Site URL" to: `http://localhost:3000` (for local development)
3. Add "Redirect URLs":
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

4. Click "Save"

## Step 4: Test the Integration

1. Run your application locally
2. Go to the login page and click "Sign in with Google"
3. You should be redirected to Google's login page
4. After successful authentication, you should be redirected back to your application

## Troubleshooting

If you encounter issues:

1. Check browser console for detailed error messages
2. Verify that the Client ID and Client Secret are correctly entered in Supabase
3. Make sure all redirect URIs are properly configured in both Google Cloud Console and Supabase
4. Check that the Google OAuth consent screen is properly configured
5. Ensure that the Google API is enabled for your project

For more detailed information, see the [Supabase Google OAuth documentation](https://supabase.com/docs/guides/auth/social-login/auth-google). 