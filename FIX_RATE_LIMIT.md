# Fix Rate Limit Issues with Google Gemini API

## Problem
Even with a fresh API key from a new account, you're still getting rate limit errors (429).

## Possible Causes

### 1. IP-Based Rate Limiting
Google may rate limit by IP address, not just API key. If your server IP was rate-limited, even a new key might hit limits.

**Solution:**
- Wait 5-10 minutes for IP rate limits to reset
- Try from a different network/IP address if possible

### 2. Free Tier Limits
Google Gemini free tier has daily/hourly limits that reset periodically.

**Check your quota:**
1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Look for "Requests per minute" and "Requests per day" quotas
3. Check if you've exceeded the free tier limits

### 3. API Not Enabled
Make sure the Generative Language API is enabled for your project.

**Enable it:**
1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Select your project
3. Click "Enable"

### 4. Billing Required
Some Google APIs require billing to be enabled even for free tier.

**Enable billing (free tier still free):**
1. Go to: https://console.cloud.google.com/billing
2. Link a billing account (you won't be charged for free tier usage)

## Quick Solutions

### Solution 1: Wait and Retry
- Wait 5-10 minutes
- Try again

### Solution 2: Use OpenAI Instead (Recommended)
If Google rate limits persist, switch to OpenAI:

1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Add it in Admin Dashboard → API Keys:
   - Key Type: `openai`
   - API Key: Your OpenAI key
   - Global: ✓

OpenAI typically has better rate limits.

### Solution 3: Check Google Cloud Console
1. Verify API key is active
2. Check quotas and limits
3. Verify billing is enabled (even for free tier)

## Testing

After fixing, test by:
1. Wait 10 minutes
2. Try generating a PRD
3. Check browser console for detailed error messages

