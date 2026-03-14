# 📋 Render Deployment Guide (The "Docker" Way - 100% Reliable)

The error you saw (`code 1`) happened because Render's standard environment doesn't allow the installation of browser libraries. We fixed this by adding a **`Dockerfile`**. 

Follow these new steps to deploy successfully:

---

### **Step 1: Create a New Web Service**
1.  In Render, click **New +** and select **Web Service**.
2.  Connect your GitHub repository and select the **`work`** branch.
3.  **IMPORTANT**: Render should now automatically detect the **Dockerfile**. 
    -   If it asks for "Runtime", select **Docker**.
    -   You do **NOT** need to enter a Build Command or Start Command anymore (the Dockerfile handles it).

### **Step 2: Choose Plan**
-   Select the **Free** tier.

### **Step 3: Environment Variables**
Go to the **Environment** tab and add these:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | (Paste your Neon/Database URL) |
| `NEXT_PUBLIC_APP_URL` | (Paste your Vercel Dashboard URL) |
| `NODE_ENV` | `production` |
| `HEADLESS` | `true` |
| `PORT` | `10000` |

---

### **Step 4: Keep-Alive (UptimeRobot)**
Once it's deployed, go to [UptimeRobot.com](https://uptimerobot.com) and set up a free monitor to "ping" your Render URL (found at the top of your Render page) every 5 minutes. 
-   This prevents the "Free Tier" from going to sleep.

---

### **Why this works:**
-   **No Sudo Required**: The Dockerfile uses a pre-built environment from Microsoft (Playwright) that already has all the Chrome libraries installed.
-   **Self-Healing**: It still uses the "Health Check" trick so Render stays happy.
-   **Untouched Code**: Your `worker.ts` remains exactly as it was!
