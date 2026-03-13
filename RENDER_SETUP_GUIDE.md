# 📋 Render Web Service: Complete Step-by-Step Guide

To run your worker for **free** without changing any code, follow these exact settings on Render.

### **Step 1: Choose the Right Service**
1.  In your Render Dashboard, click **New +** and select **Web Service**.
2.  Connect your GitHub repository and select the **`work`** branch.

### **Step 2: Basic Configuration**
Fill in these exact values:
-   **Name**: `linkedin-worker`
-   **Region**: (Pick the one closest to you/the client)
-   **Runtime**: `Node`
-   **Build Command**:
    ```bash
    npm install && npx playwright install chromium --with-deps
    ```
-   **Start Command** (⚠️ *CRITICAL: This allows your original code to work without modifications*):
    ```bash
    npx tsx -e "require('http').createServer((q,res)=>{res.writeHead(200);res.end('ok')}).listen(process.env.PORT||10000); require('./worker.ts')"
    ```

### **Step 3: Choose Plan**
-   Scroll down and select the **Free** tier.

### **Step 4: Environment Variables**
Click the **"Advanced"** button (or go to the **Environment** tab after creating) and add these:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | (Paste your Neon/Database URL) |
| `NEXT_PUBLIC_APP_URL` | (Paste your Vercel Dashboard URL) |
| `NODE_ENV` | `production` |
| `HEADLESS` | `true` |
| `PORT` | `10000` |

---

### **Step 5: How it works (Technically)**
-   **Why Web Service?** Render's "Background Workers" are not free. "Web Services" are free.
-   **The Secret**: By using that special **Start Command**, we create a tiny "mini-server" *in the command line* that answers Render's health checks. 
-   **Result**: Your `worker.ts` remains **exactly the same** and untouched, but Render sees a "web service" it can keep alive.

### **Step 6: Don't forget UptimeRobot!**
Once it's deployed, go to [UptimeRobot.com](https://uptimerobot.com) and set up a free monitor to "ping" your Render URL (e.g., `https://linkedin-worker.onrender.com`) every 5 minutes. This prevents the "Free Tier" from going to sleep after 15 minutes of inactivity.
