# 🛡️ VulnScope Supabase Setup Guide (Free Tier)

**Complete step-by-step guide to set up Supabase for VulnScope on the FREE TIER**

---

## 📋 **Prerequisites**

Before starting, ensure you have:
- [ ] A Supabase account (free tier)
- [ ] Access to your Supabase project dashboard
- [ ] Your project's environment variables ready
- [ ] The VulnScope project codebase

---

## 🚀 **Step 1: Create Supabase Project (If Not Done)**

### 1.1 Go to Supabase Dashboard
1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Click **"New Project"**

### 1.2 Configure Project
1. **Organization**: Select your organization
2. **Name**: `vulnscope` (or your preferred name)
3. **Database Password**: Generate a strong password (save it!)
4. **Region**: Choose closest to your users
5. **Pricing Plan**: Select **"Free"** tier
6. Click **"Create new project"**

### 1.3 Wait for Setup
- Project creation takes 2-3 minutes
- You'll see a progress indicator
- Don't close the browser during setup

---

## 🔑 **Step 2: Get Environment Variables**

### 2.1 Access Project Settings
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:

```env
# Your Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Anon Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Service Role Key (Secret - Keep Safe!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Update Your .env.local File
Create or update your `.env.local` file in the VulnScope project root:

```env
# MongoDB (Keep your existing values)
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB=vulnscope

# Supabase (Add these new values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ **Step 3: Run Database Setup Scripts**

### 3.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**

### 3.2 Run Main Setup Script
1. Open the file: `docs/supabase-setup-scripts.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

**Expected Result**: You should see "Success. No rows returned" or similar success messages.

### 3.3 Run Verification Script
1. Open the file: `docs/supabase-verification-script.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **"Run"**

**Expected Result**: You should see mostly ✅ checkmarks and "🎉 PERFECT" statuses.

---

## ⚙️ **Step 4: Configure Authentication**

### 4.1 Enable Email Authentication
1. Go to **Authentication** → **Settings**
2. Under **"Auth Providers"**, ensure **"Email"** is enabled
3. Configure **"Email Templates"** (optional):
   - Customize confirmation email
   - Customize password reset email
   - Add your branding

### 4.2 Configure OAuth Providers (Optional)
1. Go to **Authentication** → **Settings**
2. Under **"Auth Providers"**:

#### Google OAuth Setup:
1. Click **"Google"** provider
2. Enable the provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set **Redirect URL**: `https://your-project-id.supabase.co/auth/v1/callback`

#### GitHub OAuth Setup:
1. Click **"GitHub"** provider
2. Enable the provider
3. Add your GitHub OAuth credentials:
   - **Client ID**: From GitHub Developer Settings
   - **Client Secret**: From GitHub Developer Settings
4. Set **Redirect URL**: `https://your-project-id.supabase.co/auth/v1/callback`

### 4.3 Configure Site URL
1. Go to **Authentication** → **Settings**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`

---

## 🔔 **Step 5: Configure Real-time (Free Tier Limitations)**

### 5.1 Understanding Free Tier Limitations
**Important**: The free tier has limitations:
- ❌ **No Replication tab** in dashboard
- ❌ **No manual real-time configuration**
- ✅ **Real-time works automatically** for tables with RLS enabled
- ✅ **Limited to 2 concurrent real-time connections**

### 5.2 Verify Real-time is Working
1. Go to **Database** → **Tables**
2. You should see your tables: `notifications`, `user_preferences`, etc.
3. Real-time is automatically enabled for tables with RLS (which we set up)

### 5.3 Test Real-time Connection
1. In your application, the `useRealtimeNotifications` hook should work
2. Real-time subscriptions will work automatically
3. No additional configuration needed on free tier

---

## 🧪 **Step 6: Test Your Setup**

### 6.1 Test Authentication
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000`
3. Try to sign up with a new account
4. Check your email for verification
5. Try logging in

### 6.2 Test Database Connection
1. Go to the dashboard (should require login)
2. Check if user data is being stored
3. Look for any error messages in the console

### 6.3 Test Notifications (If Implemented)
1. Trigger a notification in your app
2. Check if it appears in the Supabase `notifications` table
3. Verify real-time updates work

---

## 🔍 **Step 7: Verification Checklist**

### ✅ **Database Setup**
- [ ] All 5 tables created successfully
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] Utility functions working
- [ ] Permissions granted correctly

### ✅ **Authentication**
- [ ] Email authentication working
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] OAuth providers configured (if used)

### ✅ **Environment Variables**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set correctly
- [ ] No environment variable errors in console

### ✅ **Application Integration**
- [ ] Supabase client initializes without errors
- [ ] Authentication middleware works
- [ ] Protected routes redirect correctly
- [ ] User data persists between sessions

---

## 🚨 **Troubleshooting Common Issues**

### Issue 1: "Supabase client not initialized"
**Solution**: Check your environment variables in `.env.local`

### Issue 2: "RLS policy violation"
**Solution**: Ensure user is authenticated and policies are correct

### Issue 3: "Real-time not working"
**Solution**: On free tier, real-time works automatically - no manual setup needed

### Issue 4: "OAuth redirect errors"
**Solution**: Check redirect URLs in Supabase settings match your app

### Issue 5: "Database connection errors"
**Solution**: Verify your Supabase URL and keys are correct

---

## 📊 **Free Tier Limitations & Workarounds**

### Limitations:
- **2 concurrent real-time connections**
- **500MB database storage**
- **2GB bandwidth per month**
- **No manual replication configuration**

### Workarounds:
- **Connection Pooling**: Use connection pooling for better performance
- **Data Cleanup**: Run cleanup functions regularly
- **Efficient Queries**: Optimize database queries
- **Caching**: Implement client-side caching

---

## 🎯 **Next Steps After Setup**

### 1. Test All Features
- [ ] User authentication
- [ ] Real-time notifications
- [ ] Alert system
- [ ] Team collaboration
- [ ] User preferences

### 2. Monitor Usage
- Check Supabase dashboard for usage metrics
- Monitor database size
- Watch bandwidth usage

### 3. Optimize Performance
- Add database indexes as needed
- Implement efficient queries
- Set up data cleanup routines

### 4. Prepare for Production
- Set up production environment variables
- Configure production redirect URLs
- Set up monitoring and alerts

---

## 📞 **Getting Help**

### If You Encounter Issues:
1. **Check the verification script results**
2. **Review error messages in browser console**
3. **Check Supabase dashboard for errors**
4. **Verify environment variables**
5. **Re-run setup scripts if needed**

### Useful Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Free Tier Limits](https://supabase.com/pricing)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🎉 **Setup Complete!**

If you've followed all steps and see mostly ✅ checkmarks in your verification, your Supabase setup is complete and ready for VulnScope!

Your hybrid architecture (MongoDB + Supabase) is now fully configured:
- **MongoDB**: Primary data storage for vulnerabilities
- **Supabase**: Authentication, real-time features, and user management

**Happy coding! 🚀**
