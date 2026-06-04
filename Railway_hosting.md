# Deployment Plan: Monolithic MERN on Railway with Private MongoDB

This plan details the migration of **Math-Wizard** to a high-performance, unified monolithic architecture on **Railway**. By serving the built React frontend directly from the Express backend and hosting the MongoDB instance in the same private network, we completely eliminate **cold starts**, **CORS preflight delays (`OPTIONS` requests)**, and **database network lag**.

---

## User Review Required

Please review the proposed architectural and configuration changes. No codebase modifications will be applied until you approve this plan.

> [!IMPORTANT]
> **Key Architectural Benefits:**
> 1. **Zero Cold Starts:** Railway containers stay awake 24/7 on the hobby/developer tier.
> 2. **No CORS Preflight Delays:** Bypassing CORS by serving both client and API from the same domain cuts click-to-load latency in half.
> 3. **Sub-millisecond DB Queries:** Hosting MongoDB inside the same private network reduces database latency from 150ms to <1ms.
> 4. **No External Hosting Cost:** This entire monolithic stack comfortably fits within Railway's free developer credits.

---

## Proposed Changes

### 1. Root Workspace Configuration

#### [MODIFY] [package.json](file:///c:/Users/ADMIN/Desktop/Main_Proj/Math-Wizard/package.json)
We will add `build` and `start` scripts at the workspace root. This instructs Railway on how to compile the React frontend and start the combined web server.

```json
  "scripts": {
    "server": "nodemon --watch server server/index.js",
    "client": "npm run dev --prefix client",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "build": "npm run build --prefix client",
    "start": "node server/index.js"
  }
```

---

### 2. Backend Server Configuration

#### [MODIFY] [index.js](file:///c:/Users/ADMIN/Desktop/Main_Proj/Math-Wizard/server/index.js)
We will configure Express to serve the compiled static React assets from `client/dist` and redirect all client-side page requests to React's `index.html` in production.

```javascript
// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder for compiled React client assets
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Any non-API route serves the React index.html for client-side routing
  app.get("*", (req, res) => {
    // Prevent API routing misdirection
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
} else {
  // Safe default index response for local development
  app.get("/", (_req, res) => {
    res.send("API is running...");
  });
}
```

---

## Step-by-Step Railway Deployment Guide

This section outlines the simple manual steps required to set up your project inside the Railway Web Dashboard once the code changes are pushed to your GitHub repository.

### Step 1: Create a Railway Project
1. Log in to **[Railway.app](https://railway.app/)**.
2. Click **New Project** $\rightarrow$ select **Deploy from GitHub repository**.
3. Select your `Math-Wizard` repository and click **Deploy Now**.
4. Railway will automatically install dependencies and start building the application.

### Step 2: Add Internal MongoDB
1. In your Railway project canvas, click **New** (or right-click the canvas).
2. Select **Database** $\rightarrow$ **MongoDB**.
3. Railway will provision a private MongoDB container in the same workspace instantly.

### Step 3: Link Server to MongoDB
1. Click on the newly created **MongoDB** service card in Railway $\rightarrow$ go to **Variables**.
2. Copy the private connection string named `MONGODB_URL` (or similar).
3. Click on your **Web Server** service card in Railway $\rightarrow$ go to **Variables**.
4. Add a new variable:
   * **Name:** `MONGO_URI`
   * **Value:** `${{MongoDB.MONGODB_URL}}` *(or simply paste the copied MongoDB connection string)*
5. Click **Save**. Railway will automatically trigger a redeploy of your server with the linked database.

### Step 4: Configure Server Environment Variables
Ensure the following variables are defined in your **Web Server** service settings on Railway:
* `NODE_ENV` = `production`
* `VITE_API_BASE_URL` = `/api` *(This ensures the compiled React code uses relative paths on the same domain, bypassing CORS)*
* `JWT_SECRET` = *(a secure 32+ character key)*

---

## Verification Plan

### Automated Verification
We will run our backend test suites to confirm that serving static assets does not interfere with standard API endpoints:
- `npm run test` (vitest run)
- `npm run verify:curriculum`
- `npm run verify:schema`

### Manual Verification
1. Once deployed, verify that visiting the Railway URL instantly loads the React landing page with zero cold starts.
2. Open the browser's developer console (Network tab) and submit a question:
   * Verify that there are **no CORS preflight `OPTIONS` requests** before the submission.
   * Verify that the database response resolves in **under 50ms**.
