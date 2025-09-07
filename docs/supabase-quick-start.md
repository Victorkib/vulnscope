# 🚀 VulnScope Supabase Quick Start Guide

**Get your Supabase setup running in 15 minutes!**

---

## ⚡ **Quick Setup (15 Minutes)**

### **Step 1: Create Supabase Project (5 minutes)**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `vulnscope`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to you
   - **Plan**: Select **"Free"**
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

### **Step 2: Get Your Keys (2 minutes)**
1. Go to **Settings** → **API**
2. Copy these values to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **Step 3: Run Database Scripts (5 minutes)**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `docs/supabase-setup-scripts.sql`
3. Click **"Run"**
4. Copy and paste the contents of `docs/supabase-verification-script.sql`
5. Click **"Run"** - you should see mostly ✅ checkmarks

### **Step 4: Test Your Setup (3 minutes)**
1. Start your app: `npm run dev`
2. Go to `http://localhost:3000`
3. Try to sign up for a new account
4. Check if you can access the dashboard

---

## 🎯 **What You Get**

✅ **Authentication**: User signup, login, password reset  
✅ **Real-time Notifications**: Live alerts and updates  
✅ **User Preferences**: Customizable notification settings  
✅ **Alert Rules**: Custom vulnerability monitoring rules  
✅ **Team Collaboration**: Team management and sharing  
✅ **Row Level Security**: Secure data access  
✅ **Free Tier Optimized**: Works within free tier limits  

---

## 🔧 **Files Created**

| File | Purpose |
|------|---------|
| `supabase-setup-scripts.sql` | Main database setup |
| `supabase-verification-script.sql` | Verify setup worked |
| `supabase-testing-script.sql` | Test all functionality |
| `supabase-setup-guide.md` | Detailed setup guide |
| `supabase-free-tier-adjustments.md` | Free tier optimizations |
| `supabase-quick-start.md` | This quick start guide |

---

## 🚨 **If Something Goes Wrong**

### **Common Issues & Solutions**

**❌ "Supabase client not initialized"**
- Check your `.env.local` file has the correct keys
- Restart your development server

**❌ "RLS policy violation"**
- Make sure you're logged in
- Check if the user exists in Supabase Auth

**❌ "Table doesn't exist"**
- Re-run the setup script
- Check for any error messages in SQL Editor

**❌ "Real-time not working"**
- On free tier, real-time works automatically
- Check browser console for connection errors

---

## 📞 **Need Help?**

1. **Check the verification script results** - should show mostly ✅
2. **Review error messages** in browser console
3. **Re-run setup scripts** if needed
4. **Check Supabase dashboard** for any errors

---

## 🎉 **You're Done!**

If you can sign up, log in, and access the dashboard, your Supabase setup is working perfectly!

**Next steps:**
- Test real-time notifications
- Set up alert rules
- Create teams
- Customize user preferences

**Happy coding! 🚀**
