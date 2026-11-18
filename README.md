# Morning Mirror

Daily physique tracker: one morning photo + one weight. 5-day average, signals, 3-week rule, food guide.

**Fuel tab:** kcal and macro tracker. Log food by AI photo analysis, barcode scan (Open Food Facts), the built-in food list or manual entry.

Photos and check-ins are stored per user in Firestore under `users/{uid}/entries`.
Only the signed-in owner can read them (see `firestore.rules`). No photos are ever stored in this repo.

## Setup
1. Firebase console → create project → add **Web app** → copy the config into `firebase-config.js`.
2. **Authentication** → Sign-in method → enable **Google**.
3. Authentication → Settings → **Authorized domains** → add `<your-username>.github.io`.
4. **Firestore Database** → create in **production mode** → Rules tab → paste `firestore.rules` → Publish.
5. GitHub repo → Settings → **Pages** → Deploy from branch `main`, folder `/ (root)`.
6. Open `https://<your-username>.github.io/<repo>/`, sign in with Google, done.

Optional: Google Cloud console → APIs & Services → Credentials → restrict the API key to your GitHub Pages domain.

## Photo meal analysis (AI)
Barcode scanning, food list and manual entry work without this. For the "Photo meal" button:
1. Firebase console → **AI Services → AI Logic** → Get started → choose **Gemini Developer API** (no cost).
2. The setup turns on **App Check**. Register the web app with **reCAPTCHA Enterprise**:
   Google Cloud console → Security → reCAPTCHA → Create key (type: Website, domain `athleticconsumer-dotcom.github.io`).
   Copy the key ID into Firebase → App Check → your web app → reCAPTCHA Enterprise.
3. Paste the same key into `appCheckSiteKey` in `firebase-config.js`.

Food data per user is stored in `users/{uid}/entries/f-YYYY-MM-DD` (same private rules).
