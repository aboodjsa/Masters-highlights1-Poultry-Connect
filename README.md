# PoultryConnect

A cloud-based web marketplace that connects poultry farmers directly with
wholesale buyers — cutting out middlemen, improving price transparency for
farmers, and giving buyers a reliable sourcing channel.

**Stack:** React (Vite) · Node.js / Express · MongoDB Atlas · JWT auth
**Deployment target:** Frontend → Vercel · Backend → Render · Database → MongoDB Atlas

---

## 1. Project structure

```
poultryconnect/
├── backend/     Express REST API (auth, listings, orders)
└── frontend/    React (Vite) single-page application
```

## 2. Core features

- Two user roles: **Farmer** and **Buyer**, with JWT-based authentication
  and role-based access control (bcrypt-hashed passwords).
- Farmers: create, edit, delete, and toggle status of poultry listings;
  view and act on incoming orders (accept / reject / complete).
- Buyers: browse and filter the public marketplace, view listing details,
  and place orders; track order status on a personal dashboard.
- MongoDB Atlas as the cloud-hosted, managed database.
- Clean separation of concerns (routes → controllers → models) for
  maintainability and scalability.

See `backend/README-style comments in server.js` and the report for the
full architecture discussion.

---

## 3. Run it locally (do this first, before deploying)

### Prerequisites
Install these once on your computer:
- **Node.js** (v18 or later) — https://nodejs.org (download the LTS version)
- **Git** — https://git-scm.com/downloads
- A free **MongoDB Atlas** account — https://www.mongodb.com/cloud/atlas/register
- A free **GitHub** account — https://github.com/join
- A code editor, e.g. **VS Code** — https://code.visualstudio.com

### Step A — Create your MongoDB Atlas database
1. Go to https://cloud.mongodb.com and log in.
2. Click **Create a deployment** → choose the **Free (M0)** tier.
3. Pick any cloud provider/region close to you → click **Create**.
4. When prompted to create a database user, set a **username** and
   **password** (write these down) → click **Create User**.
5. Under **Network Access**, click **Add IP Address** → choose
   **Allow access from anywhere (0.0.0.0/0)** (fine for a student project).
6. Once the cluster is ready, click **Connect** → **Drivers** → copy the
   connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
7. Replace `<username>` and `<password>` with the ones you created, and add
   a database name before the `?`, e.g.:
   `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/poultryconnect?retryWrites=true&w=majority`
   Keep this string — you'll paste it into `backend/.env` next.

### Step B — Run the backend
1. Open a terminal in the `backend` folder:
   ```
   cd poultryconnect/backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create your environment file:
   ```
   cp .env.example .env
   ```
   (On Windows: `copy .env.example .env`)
4. Open `.env` in your editor and fill in:
   - `MONGO_URI` → the Atlas connection string from Step A
   - `JWT_SECRET` → any long random string, e.g. `poultry-secret-key-2026-xyz`
   - Leave `PORT=5000` and `CLIENT_URL=http://localhost:5173` as they are.
5. Start the server:
   ```
   npm run dev
   ```
6. You should see `MongoDB Atlas connected...` and `Server running on port 5000`.
7. Test it: open `http://localhost:5000` in your browser — you should see
   `{"message":"PoultryConnect API is running"}`. **Take a screenshot here.**

### Step C — Run the frontend
1. Open a **new** terminal (keep the backend running) in the `frontend` folder:
   ```
   cd poultryconnect/frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create the environment file:
   ```
   cp .env.example .env
   ```
4. Leave `VITE_API_URL=http://localhost:5000/api` as it is for local use.
5. Start the app:
   ```
   npm run dev
   ```
6. Open the URL shown in the terminal (usually `http://localhost:5173`)
   in your browser.

### Step D — Try the app and take your screenshots
1. Home page → **screenshot**.
2. Click **Get started** → register one account as a **farmer** and one
   (in an incognito window, or after logging out) as a **buyer** →
   **screenshot the registration form**.
3. Log in as the farmer → go to **My farm** → add 2–3 listings →
   **screenshot the dashboard with listings**.
4. Log out, log in as the buyer → go to **Marketplace** → open a listing →
   place an order → **screenshot the listing page and the order confirmation**.
5. Log back in as the farmer → go to **Orders received** → accept the
   order → **screenshot**.
6. Log back in as the buyer → **My orders** → see the status updated →
   **screenshot**.

That set of screenshots covers registration, listing management, ordering,
and order-status workflow — enough to demonstrate every core feature in
your report.

---

## 4. Push the project to GitHub

1. Go to https://github.com and click the **+** icon (top right) →
   **New repository**.
2. Name it `poultryconnect`, keep it **Public** (or Private if required),
   do **not** tick "Add a README" (you already have one) → **Create repository**.
3. Back in your terminal, go to the project root:
   ```
   cd poultryconnect
   ```
4. Initialize git and push:
   ```
   git init
   git add .
   git commit -m "Initial commit: PoultryConnect full-stack app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/poultryconnect.git
   git push -u origin main
   ```
   (Replace `<your-username>` with your actual GitHub username. GitHub may
   ask you to log in via a browser window the first time.)
5. Refresh your GitHub repository page — you should see all your files.
   **Screenshot this page for your report.**

Your `.gitignore` files already exclude `node_modules` and `.env`, so your
real secrets are never uploaded to GitHub.

---

## 5. Deploy to the cloud

### Deploy the backend → Render
1. Go to https://render.com and sign up/log in (you can use your GitHub account).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select your `poultryconnect` repository.
4. Configure:
   - **Name:** `poultryconnect-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment Variables**, add the same keys from your local
   `backend/.env` file: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and
   set `CLIENT_URL` to your future Vercel URL (you can update it after Step
   below — Render lets you edit env vars any time and redeploys automatically).
6. Click **Create Web Service**. Wait for the build to finish, then open
   the given URL (e.g. `https://poultryconnect-api.onrender.com`) — you
   should see the same `{"message":"PoultryConnect API is running"}` reply.
   **Screenshot this.**

   Note: Render's free tier "sleeps" after 15 minutes of inactivity, so the
   first request after a break can take ~30–50 seconds to wake up. This is
   normal and fine to mention in your report as a known limitation.

### Deploy the frontend → Vercel
1. Go to https://vercel.com and sign up/log in with GitHub.
2. Click **Add New** → **Project** → import your `poultryconnect` repository.
3. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://poultryconnect-api.onrender.com/api`
     (use your actual Render URL from the previous step)
5. Click **Deploy**. Once it finishes, open the given `.vercel.app` link —
   your live PoultryConnect site. **Screenshot the deployed site.**
6. Go back to Render → your web service → **Environment** → update
   `CLIENT_URL` to your Vercel URL (e.g. `https://poultryconnect.vercel.app`)
   so CORS allows requests from your live frontend → save (it redeploys
   automatically).

### Final check
Open your Vercel link, register a fresh account, create a listing, place
an order — exactly like your local test in Step D — to confirm the live,
deployed version works end to end. **This is your main "it's deployed"
screenshot for the report and demo video.**

---

## 6. What to include in your report and demo (per the assignment brief)

- **Problem & research:** the middleman problem in poultry supply chains
  and why a direct marketplace helps (see Home page copy and Section 7
  below for a starting point).
- **Architecture diagram:** React SPA ⇄ REST API (Express) ⇄ MongoDB Atlas,
  deployed on Vercel + Render, with JWT sitting in the browser's
  localStorage and sent as a Bearer token on each API call.
- **Technology justification:** MongoDB Atlas (flexible schema, managed
  cloud service, generous free tier), Express/Node (lightweight, widely
  supported, fast to build REST APIs), React/Vite (fast dev experience,
  component reusability), Render/Vercel (free, git-based continuous
  deployment satisfying the "CI" requirement without extra tooling).
- **Security:** bcrypt password hashing, JWT auth, role-based route
  protection, environment variables for secrets, CORS restricted to the
  known frontend origin.
- **Screenshots** from Section 3/5 above.
- **Live link** (Vercel) and **GitHub repository link**.

---

## 7. Suggested short problem statement (for your report)

Smallholder poultry farmers frequently sell through multiple layers of
middlemen before reaching wholesale buyers such as hotels, market traders,
and distributors, which compresses farmer margins and obscures price and
supply information for buyers. Digital direct-to-buyer marketplaces have
been shown in agritech literature to shorten these supply chains and
improve income transparency for smallholder producers. PoultryConnect
applies this model narrowly to the poultry sub-sector: farmers list
available stock (broilers, layers, eggs, turkey, duck) with quantity,
price, and location, and wholesale buyers discover and order directly,
removing intermediary mark-ups and giving farmers direct visibility into
demand.
