# Enable OTP Authentication in Supabase

To receive OTP codes instead of magic links, follow these steps in your Supabase Dashboard:

## Step 1: Update Email Templates

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → Email Templates**
3. Select the **Confirm signup** template
4. Change the template to send OTP code format:

### Original Template (Magic Link):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### Change to OTP Template:
```html
<h2>Your verification code</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; font-family: monospace; letter-spacing: 4px; text-align: center; background: #f4f4f4; padding: 20px; border-radius: 8px;">{{ .Token }}</h1>
<p>This code will expire in 60 minutes.</p>
<p>If you didn't request this code, please ignore this email.</p>
```

## Step 2: Update Magic Link Template

1. Still in **Email Templates**
2. Select the **Magic Link** template  
3. Update it similarly:

```html
<h2>Your login code</h2>
<p>Your login code is:</p>
<h1 style="font-size: 32px; font-family: monospace; letter-spacing: 4px; text-align: center; background: #f4f4f4; padding: 20px; border-radius: 8px;">{{ .Token }}</h1>
<p>This code will expire in 60 minutes.</p>
```

## Step 3: Disable Email Link Validity (Optional)

1. Go to **Authentication → URL Configuration**
2. Remove or comment out the redirect URLs temporarily
3. This forces Supabase to send codes instead of links

## Step 4: Update Auth Settings

1. Go to **Authentication → Providers → Email**
2. Make sure these settings are configured:
   - Enable Email Provider: ✅
   - Confirm Email: ✅ (if you want email verification)
   - Secure Email Change: ✅
   - Secure Password Change: ✅

## Step 5: Test the Configuration

1. Try signing up with a new email
2. You should receive a 6-digit code instead of a link
3. Enter the code in the app to verify

## Alternative: Use Supabase CLI

If you prefer using the CLI, you can update the config:

```bash
supabase init
supabase db remote set <your-project-ref>
```

Create a file `supabase/config.toml`:

```toml
[auth]
enable_signup = true
enable_email_autoconfirm = false

[auth.email]
enable_confirmations = true
template.confirmation = """
<h2>Your verification code</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; font-family: monospace; letter-spacing: 4px;">{{ .Token }}</h1>
"""
```

## Troubleshooting

If you're still receiving magic links:

1. **Clear browser cache** and cookies for your app
2. **Check Supabase logs** in Dashboard → Logs → Auth Logs
3. **Verify email templates** saved correctly
4. **Check redirect URLs** are not interfering

## Note

The `{{ .Token }}` variable in the email template will automatically be replaced with the 6-digit OTP code when Supabase sends the email.
