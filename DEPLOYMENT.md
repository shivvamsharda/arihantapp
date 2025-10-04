# Deployment Guide

## Vercel Deployment Setup

### 1. Environment Variables
Add these to your Vercel project settings:
```
VITE_SUPABASE_URL=https://jbcowxyqgxdjuiygajea.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Supabase Authentication Configuration

**IMPORTANT:** Configure redirect URLs in Supabase Dashboard to fix magic link redirects.

#### Steps:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jbcowxyqgxdjuiygajea)
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following to **Redirect URLs**:
   - `http://localhost:5173` (for local development)
   - `http://localhost:5173/**` (wildcard for local)
   - `https://your-vercel-app.vercel.app` (your Vercel deployment URL)
   - `https://your-vercel-app.vercel.app/**` (wildcard for Vercel)
   - If you add a custom domain later, add that too

4. **Site URL**: Set to your primary domain (e.g., `https://your-vercel-app.vercel.app`)

#### Example Configuration:
```
Site URL: https://arihantapp.vercel.app

Redirect URLs:
- http://localhost:5173
- http://localhost:5173/**
- https://arihantapp.vercel.app
- https://arihantapp.vercel.app/**
- https://your-custom-domain.com (if applicable)
- https://your-custom-domain.com/** (if applicable)
```

### 3. How the Dynamic Redirect Works

The app already uses `window.location.origin` in two places:

**Login (src/contexts/AuthContext.tsx:113)**:
```typescript
const signIn = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}
```

**User Invitations (src/components/admin/UserManagement.tsx:132)**:
```typescript
await supabase.auth.signInWithOtp({
  email: inviteEmail,
  options: {
    emailRedirectTo: window.location.origin
  }
})
```

This means:
- When accessed from `localhost:5173` → redirects to `http://localhost:5173`
- When accessed from Vercel → redirects to `https://your-app.vercel.app`
- When accessed from custom domain → redirects to your custom domain

### 4. Test After Configuration

1. Deploy to Vercel
2. Update Supabase redirect URLs with your Vercel URL
3. Test login flow:
   - Try logging in from Vercel deployment
   - Check that magic link redirects to Vercel (not localhost)
   - Verify you can successfully authenticate

### 5. Common Issues

**Issue**: Magic links still redirect to localhost
**Solution**: Make sure you've added your Vercel URL to Supabase redirect URLs AND saved the changes

**Issue**: "Invalid redirect URL" error
**Solution**: Ensure the URL in Supabase settings exactly matches your deployment URL (including https://)

**Issue**: Email not sending
**Solution**: Check Supabase email settings under Authentication → Email Templates

### 6. Adding Custom Domain Later

When you add a custom domain:
1. Configure it in Vercel
2. Add it to Supabase redirect URLs
3. Update Site URL in Supabase if it's your primary domain
4. Test the login flow again
