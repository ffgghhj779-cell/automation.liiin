# 🔧 Fix: Worker Cannot Connect to Platform API

## ❌ The Error You're Seeing:

```
Broadcast error (non-fatal): TypeError: fetch failed
[cause]: AggregateError [ECONNREFUSED]
```

**What this means:**
The worker is trying to send screenshots to your platform API, but it **cannot connect** because:
1. The platform is not running, OR
2. The URL is wrong, OR
3. The environment variable is not set

---

## ✅ SOLUTION:

### **Step 1: Make Sure Platform is Running**

**Open Terminal 1:**
```bash
cd C:\Users\lenovo\Downloads\clonelink
npm run dev
```

**You should see:**
```
✓ Ready in 2s
○ Local:   http://localhost:3000
```

**Keep this terminal running!**

---

### **Step 2: Set Environment Variable for Worker**

**In Terminal 2 (PowerShell - where you run worker):**

```powershell
# Set the environment variable
$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Verify it's set
echo $env:NEXT_PUBLIC_APP_URL
# Should show: http://localhost:3000

# Now run the worker
npm run worker
```

---

### **Step 3: Open Live Viewer**

**In your browser:**
```
http://localhost:3000/dashboard/live-viewer
```

**You should now see screenshots appearing!**

---

## 🎯 The Complete Process:

### **Terminal 1 (Platform):**
```bash
npm run dev

# Output:
# ✓ Ready in 2s
# ○ Local:   http://localhost:3000
# ✓ Compiled in 500ms
```
**KEEP THIS RUNNING!**

---

### **Terminal 2 (Worker) - PowerShell:**
```powershell
# IMPORTANT: Set environment variable FIRST
$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Then run worker
npm run worker

# You should see:
# 🚀 Worker starting...
# ✅ Browser launched - starting automation
# NO MORE "Broadcast error" messages!
```

---

### **Browser:**
```
http://localhost:3000/dashboard/live-viewer

# You'll see:
# - Screenshots appearing (every 2-3 seconds)
# - Action logs updating in real-time
# - Green connection indicator
```

---

## 🔍 Why This Happens:

The worker code does this:
```typescript
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
await fetch(`${API_URL}/api/worker-events`, { ... });
```

**If `NEXT_PUBLIC_APP_URL` is not set:**
- It defaults to `http://localhost:3000`
- But if platform isn't running there, it fails with `ECONNREFUSED`

**Solution:** 
1. Make sure platform is running on port 3000
2. Set the environment variable before running worker

---

## ✅ Verification Checklist:

### **Before Running Worker:**

- [ ] Platform is running (`npm run dev` in Terminal 1)
- [ ] Platform shows: `○ Local: http://localhost:3000`
- [ ] Environment variable is set: `$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"`
- [ ] Browser can access: `http://localhost:3000`

### **After Running Worker:**

- [ ] Worker starts without "Broadcast error"
- [ ] Worker logs show: "Processing keyword..."
- [ ] Live viewer shows screenshots
- [ ] Action logs update in real-time

---

## 🐛 Troubleshooting:

### **Issue: Still getting "Broadcast error"**

**Check 1: Is platform running?**
```powershell
# In browser, go to:
http://localhost:3000

# Should show your dashboard, not error page
```

**Check 2: Is environment variable set?**
```powershell
echo $env:NEXT_PUBLIC_APP_URL
# Should show: http://localhost:3000
# If blank or wrong, set it again
```

**Check 3: Is port 3000 in use by something else?**
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# If something else is using it, either:
# 1. Kill that process, OR
# 2. Run platform on different port
```

---

### **Issue: Platform won't start**

```powershell
# Kill any existing Next.js processes
taskkill /F /IM node.exe

# Clean and restart
rm -r .next
npm run dev
```

---

### **Issue: Worker runs but no screenshots in live viewer**

**Check 1: Is live viewer page open?**
```
http://localhost:3000/dashboard/live-viewer
```

**Check 2: Check browser console for errors**
- Press F12
- Look for errors in Console tab

**Check 3: Manually test API**
```powershell
# In PowerShell, test API is accessible:
curl http://localhost:3000/api/worker-events

# Should return: {"events":[]}
```

---

## 📝 Quick Reference:

### **For Local Testing (Same Machine):**

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2 (PowerShell):**
```powershell
$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"
npm run worker
```

**Browser:**
```
http://localhost:3000/dashboard/live-viewer
```

---

### **For Remote Worker (Different Machines):**

**Platform Machine:**
```bash
npm run dev
# Or already deployed on Vercel
```

**Worker Machine (PowerShell):**
```powershell
# Use your actual Vercel URL
$env:NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
npm run worker
```

**Any Device:**
```
https://your-app.vercel.app/dashboard/live-viewer
```

---

## 🎯 Expected Behavior (When Working):

### **Worker Terminal:**
```
🚀 Worker starting...
✅ Browser launched - starting automation
Processing keyword [1/2]: "AI"
Searching LinkedIn for: "AI"
✅ Page loaded
Found 15 posts, 8 match criteria
✅ Comment posted successfully!

NO "Broadcast error" messages!
```

### **Live Viewer Page:**
```
[Green dot] LIVE

Left side: LinkedIn screenshots updating
Right side: Action logs appearing in real-time

14:23:45 🚀 Worker activated
14:23:46 🔍 Processing keyword: "AI"
14:23:48 🔍 Searching LinkedIn for: "AI"
14:23:52 ✅ Found 15 posts, 8 match criteria
```

---

## ✅ Summary:

**The Problem:** Worker can't connect to platform API

**The Solution:**
1. Make sure platform is running (`npm run dev`)
2. Set environment variable: `$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"`
3. Run worker
4. Open live viewer: `http://localhost:3000/dashboard/live-viewer`

**Follow these steps and it will work!** 🎉

---

## 🚀 One-Command Fix (Copy-Paste):

**In PowerShell (from your project directory):**

```powershell
# Terminal 1 (run this first)
npm run dev

# Then in Terminal 2 (new PowerShell window)
$env:NEXT_PUBLIC_APP_URL="http://localhost:3000"; npm run worker
```

**That's it!** ✅
