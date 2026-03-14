# 🚀 Koyeb Deployment Guide (No Credit Card Required)

If Render is asking for a card, **Koyeb** is the best alternative. It allows you to run one Docker container for **free** without needing a credit card for the "Hobby" plan.

---

### **Step 1: Create a Koyeb Account**
1.  Go to [Koyeb.com](https://www.koyeb.com/) and sign up.
2.  Choose the **"Hobby" (Free)** plan. It should not ask for a card.

### **Step 2: Create a New Service**
1.  Click **"Create Service"**.
2.  Select **GitHub** as the source.
3.  Connect your repository and select the **`work`** branch.

### **Step 3: Configure Settings**
1.  **Workaround for Automation**: Koyeb will automatically detect your `Dockerfile`. 
2.  **Instance Type**: Select **"Nano"** (This is the free one).
3.  **Region**: Choose any (e.g., Washington D.C. or Frankfurt).

### **Step 4: Environment Variables**
Add these in the "Environment Variables" section:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | (Your Neon DB URL) |
| `NEXT_PUBLIC_APP_URL` | (Your Vercel Dashboard URL) |
| `NODE_ENV` | `production` |
| `HEADLESS` | `true` |
| `PORT` | `10000` |

---

### **Step 5: Port & Health Check**
1.  Ensure the **Exposed Port** is set to `10000`.
2.  Koyeb will use this to check if the worker is "healthy."

### **Step 6: Deploy**
1.  Click **"Deploy"**.
2.  Koyeb will build the Docker container (this takes 2-3 minutes) and start your worker.

---

### **Why this works:**
-   **No Card**: Koyeb's Starter plan is designed to be accessible without verification for basic use.
-   **Dockerfile Support**: Because we are using the `Dockerfile` I created, Playwright will have everything it needs (browsers, libraries) pre-installed.
-   **Always On**: Unlike Render's free tier, Koyeb's Hobby services don't "sleep" as aggressively, but you should still use [UptimeRobot.com](https://uptimerobot.com) to ping your Koyeb URL just to be safe!
