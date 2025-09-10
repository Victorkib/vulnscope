# 🛡️ VulnScope - Complete Download & Setup Checklist for MacBook

**A comprehensive guide to download and set up everything needed to run VulnScope on your MacBook**

---

## 📋 **Overview**

VulnScope is an advanced vulnerability intelligence platform built with **Next.js 15**, **React 19**, **MongoDB**, and **Supabase**. This checklist will guide you through downloading and installing all required software and services to get the project running locally.

---

## 🖥️ **System Requirements**

### **MacBook Specifications**
- **macOS**: 10.15 (Catalina) or later
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space minimum
- **Internet**: Stable broadband connection
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

---

## 📦 **Step 1: Download & Install Core Development Tools**

### **1.1 Node.js (REQUIRED)**
- **What**: JavaScript runtime for running the application
- **Version**: Node.js 18+ (recommended: Node.js 20+)
- **Download**: [https://nodejs.org/](https://nodejs.org/)
- **Installation**:
  1. Download the macOS installer (.pkg file)
  2. Run the installer and follow the setup wizard
  3. Verify installation: Open Terminal and run `node --version`
  4. Should show version 18.x.x or higher

### **1.2 npm (Comes with Node.js)**
- **What**: Package manager for JavaScript dependencies
- **Verification**: Run `npm --version` in Terminal
- **Should show**: 9.x.x or higher

### **1.3 Git (REQUIRED)**
- **What**: Version control system for cloning the repository
- **Download**: [https://git-scm.com/download/mac](https://git-scm.com/download/mac)
- **Installation**:
  1. Download the macOS installer
  2. Run the installer
  3. Verify: Run `git --version` in Terminal
- **Alternative**: Install via Homebrew: `brew install git`

### **1.4 Homebrew (RECOMMENDED)**
- **What**: Package manager for macOS
- **Download**: [https://brew.sh/](https://brew.sh/)
- **Installation**: Run in Terminal:
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- **Verify**: Run `brew --version`

---

## 🔧 **Step 2: Download & Install Development Tools**

### **2.1 Visual Studio Code (RECOMMENDED)**
- **What**: Code editor with excellent TypeScript support
- **Download**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **Installation**: Download .dmg file and drag to Applications
- **Extensions to install**:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

### **2.2 Terminal Enhancement (OPTIONAL)**
- **iTerm2**: [https://iterm2.com/](https://iterm2.com/)
- **Oh My Zsh**: [https://ohmyz.sh/](https://ohmyz.sh/)
- **Installation**:
  ```bash
  # Install iTerm2 via Homebrew
  brew install --cask iterm2
  
  # Install Oh My Zsh
  sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
  ```

---

## 📊 **Step 3: Download Additional Tools (OPTIONAL)**

### **3.1 Database Management Tools**
- **MongoDB Compass**: [https://www.mongodb.com/products/compass](https://www.mongodb.com/products/compass)

---

## 🔍 **Step 4: Verification Checklist**

### **✅ System Requirements**
- [ ] macOS 10.15+ installed
- [ ] 8GB+ RAM available
- [ ] 5GB+ free storage
- [ ] Stable internet connection

### **✅ Development Tools**
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] VS Code installed and configured

### **✅ Online Accounts**
- [ ] MongoDB Atlas account created
- [ ] Supabase account created
- [ ] Email service account (Resend/Gmail) created

### **✅ Project Setup**
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install` completed)
- [ ] Environment variables configured (`.env.local` created)
- [ ] Database connections working
- [ ] Development server running (`npm run dev`)

### **✅ Functionality Tests**
- [ ] Application loads at `http://localhost:3000`
- [ ] No console errors in browser
- [ ] User registration works
- [ ] User login works
- [ ] Database seeding successful
- [ ] Sample data visible in application

---

## 🚨 **Troubleshooting Common Issues**

### **Issue: "Command not found: node"**
**Solution**: Node.js not installed or not in PATH
```bash
# Reinstall Node.js from https://nodejs.org/
# Or install via Homebrew:
brew install node
```

### **Issue: "npm install" fails**
**Solution**: Clear npm cache and try again
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **Issue: "MongoDB connection failed"**
**Solution**: Check connection string and network access
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas
- Ensure connection string is correct

### **Issue: "Supabase client not initialized"**
**Solution**: Check environment variables
- Verify `.env.local` file exists
- Check Supabase URL and keys are correct
- Restart development server after changes

### **Issue: "Port 3000 already in use"**
**Solution**: Kill process using port 3000
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
npm run dev -- -p 3001
```

---

## 📚 **Additional Resources**

### **Documentation**
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **React Docs**: [https://react.dev/](https://react.dev/)
- **TypeScript Docs**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Tailwind CSS Docs**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **MongoDB Docs**: [https://docs.mongodb.com/](https://docs.mongodb.com/)

### **Learning Resources**
- **Next.js Learn Course**: [https://nextjs.org/learn](https://nextjs.org/learn)
- **React Tutorial**: [https://react.dev/learn](https://react.dev/learn)
- **TypeScript Handbook**: [https://www.typescriptlang.org/docs/handbook/intro.html](https://www.typescriptlang.org/docs/handbook/intro.html)

### **Community**
- **GitHub Repository**: [https://github.com/your-username/vulnscope](https://github.com/your-username/vulnscope)
- **Discord/Community**: (Add your community links here)

---

## 🎉 **You're All Set!**

If you've completed all the steps above and checked off all items in the verification checklist, you now have:

✅ **Complete development environment** set up on your MacBook  
✅ **All required services** configured and connected  
✅ **VulnScope application** running locally  
✅ **Sample data** loaded and ready for testing  

**Happy coding! 🚀**

---

## 📞 **Need Help?**

If you encounter any issues not covered in this checklist:

1. **Check the troubleshooting section** above
2. **Review the project documentation** in the `/docs` folder
3. **Check browser console** for error messages
4. **Verify all environment variables** are set correctly
5. **Ensure all services** (MongoDB, Supabase) are running

**Remember**: This is a complex application with many moving parts. Take your time with each step, and don't hesitate to refer back to the official documentation for each service.

---

*Last updated: December 2024*  
*For VulnScope v0.1.0*
