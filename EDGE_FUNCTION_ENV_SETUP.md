# Edge Function Environment Variables Setup Guide

## Overview
Your Supabase Edge Function (`generate-prd`) needs environment variables to work properly. This guide shows you how to configure them in Coolify.

---

## Step-by-Step Instructions

### Step 1: Access Your Supabase Resource in Coolify

1. **Log into Coolify**
2. **Navigate to your project** (PRD)
3. **Find your Supabase resource** (usually named something like "supabase" or "supabase-kong")
4. **Click on the Supabase resource** to open its configuration

---

### Step 2: Find Environment Variables Section

The location depends on how Supabase is deployed in Coolify. Try these locations:

#### Option A: Supabase Resource Settings
1. In your Supabase resource page, look for tabs like:
   - **"Environment Variables"** or **"Environment"**
   - **"Configuration"** → then look for "Environment Variables"
   - **"Settings"** → then "Environment Variables"

#### Option B: If Supabase is deployed as multiple services
- Look for a service/resource specifically for **Edge Functions**
- Or check if there's a **"Functions"** section in the Supabase resource

#### Option C: Global Environment Variables
- Some Coolify setups use global environment variables
- Check the main project/resource settings

---

### Step 3: Required Environment Variables

Add these environment variables to your Edge Function configuration:

#### 1. SUPABASE_URL (Required)
- **Variable Name:** `SUPABASE_URL`
- **Value:** `https://supabase.vibecodingfield.com` (or your Supabase URL)
- **Note:** This should match your Supabase resource URL

#### 2. SUPABASE_SERVICE_ROLE_KEY (Required)
- **Variable Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Your Supabase service role key (see "How to Get Service Role Key" below)

#### 3. API Key (Choose ONE - Required for PRD generation)
Choose one of these:

**Option A: Google Gemini API Key (Recommended - Free)**
- **Variable Name:** `GOOGLE_API_KEY` (or `GEMINI_API_KEY`)
- **Value:** Your Google Gemini API key (see "How to Get Google Gemini API Key" below)

**Option B: Lovable API Key (If you have one)**
- **Variable Name:** `LOVABLE_API_KEY`
- **Value:** Your Lovable API key

---

### Step 4: How to Get SUPABASE_SERVICE_ROLE_KEY

1. **Access Supabase Studio:**
   - In Coolify, find your Supabase resource
   - Look for a link/button to open **"Studio"** or **"Dashboard"**
   - Or navigate to: `https://supabase.vibecodingfield.com` (if Studio is accessible)

2. **Navigate to API Settings:**
   - In Supabase Studio, click **"Settings"** (gear icon, usually in sidebar)
   - Click **"API"** in the settings menu

3. **Copy the Service Role Key:**
   - Look for **"service_role"** key (NOT the anon key)
   - Click the **eye icon** to reveal it (or copy button)
   - ⚠️ **IMPORTANT:** This is a secret key - keep it secure!
   - Copy the entire key (starts with `eyJ...`)

4. **Paste into Coolify:**
   - Go back to Coolify
   - Add `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Paste the key as the value

---

### Step 5: How to Get Google Gemini API Key (Recommended)

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click **"Create API Key"** button
   - Select a Google Cloud project (or create a new one)
   - Copy the generated API key

3. **Add to Coolify:**
   - In Coolify Edge Function environment variables
   - Add variable: `GOOGLE_API_KEY`
   - Paste the API key as the value

**Note:** Google Gemini has a free tier with generous limits, perfect for development!

---

## Visual Guide: Adding Environment Variables in Coolify

When you find the Environment Variables section, you'll typically see:

```
┌─────────────────────────────────────────┐
│ Environment Variables                   │
├─────────────────────────────────────────┤
│ Name              │ Value              │
├───────────────────┼────────────────────┤
│ SUPABASE_URL      │ [Enter value]      │ ← Add this
│                   │                    │
│ [Add Variable]                          │ ← Click to add new
└─────────────────────────────────────────┘
```

**Steps:**
1. Click **"Add Variable"** or **"+"** button
2. Enter variable name (e.g., `SUPABASE_URL`)
3. Enter variable value
4. Click **"Save"** or **"Add"**
5. Repeat for each variable

---

## Complete Example Configuration

Here's what your environment variables should look like:

```
SUPABASE_URL=https://supabase.vibecodingfield.com
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
GOOGLE_API_KEY=AIzaSyC... (your actual key)
```

---

## Step 6: Save and Redeploy

After adding all environment variables:

1. **Save the configuration** in Coolify
2. **Redeploy/Restart the Edge Function:**
   - Look for a **"Redeploy"** or **"Restart"** button
   - Or trigger a rebuild of the Supabase resource
   - The Edge Function should restart with the new environment variables

---

## Step 7: Verify Configuration

1. **Test PRD Generation:**
   - Go to your app: https://prd.vibecodingfield.com
   - Try generating a PRD
   - It should work now!

2. **Check Logs (if still having issues):**
   - In Coolify, go to your Supabase resource
   - Open **"Logs"** tab
   - Look for any error messages
   - The improved error handling should show clear messages if something is missing

---

## Troubleshooting

### "Can't find Environment Variables section"
- **Try:** Look in different tabs (Configuration, Settings, Advanced)
- **Try:** Check if there's a separate "Functions" resource
- **Alternative:** Some Coolify setups use `.env` files - check for that option

### "Service Role Key doesn't work"
- Make sure you copied the **service_role** key, NOT the **anon** key
- The service_role key should be longer than the anon key
- Double-check there are no extra spaces when pasting

### "Still getting 500 errors"
- Check the Edge Function logs in Coolify for specific error messages
- Verify all environment variables are set correctly
- Make sure you saved and restarted/redeployed after adding variables

### "Edge Functions not visible in Coolify"
- If you're using a self-hosted Supabase instance, Edge Functions might need to be deployed separately
- Check if there's a separate deployment process for functions
- Consider using Supabase CLI to deploy functions if Coolify doesn't support them directly

---

## Alternative: Using Supabase CLI (If Coolify doesn't support Edge Functions directly)

If you can't configure Edge Functions through Coolify, you can use Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (environment variables)
supabase secrets set SUPABASE_URL=https://supabase.vibecodingfield.com
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set GOOGLE_API_KEY=your_google_api_key

# Deploy the function
supabase functions deploy generate-prd
```

---

## Security Notes

⚠️ **Important Security Tips:**

1. **Never commit** service role keys or API keys to git
2. **Keep keys secure** - they have full access to your database
3. **Rotate keys** if they're ever exposed
4. **Use environment variables** - never hardcode keys in code

---

## Summary Checklist

- [ ] Found Environment Variables section in Coolify
- [ ] Added `SUPABASE_URL` environment variable
- [ ] Got Supabase Service Role Key from Studio → Settings → API
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` environment variable
- [ ] Got Google Gemini API key from https://makersuite.google.com/app/apikey
- [ ] Added `GOOGLE_API_KEY` environment variable
- [ ] Saved configuration
- [ ] Redeployed/Restarted Edge Function
- [ ] Tested PRD generation

---

Need help? If you're stuck on any step, let me know which step you're on and I can provide more specific guidance!

