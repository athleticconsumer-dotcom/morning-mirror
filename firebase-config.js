// Firebase web config. These values are NOT secret.
// Your data is protected by Google sign-in + firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyB4_-YEmQ2gn4hvbWsKtYEJn9ePdCaONUE",
  authDomain: "morning-mirror.firebaseapp.com",
  projectId: "morning-mirror",
  storageBucket: "morning-mirror.firebasestorage.app",
  messagingSenderId: "217229890641",
  appId: "1:217229890641:web:a4fa6687e57d17b8155470",

  // Photo meal analysis (Firebase AI Logic). Paste your reCAPTCHA Enterprise site key here (see README).
  appCheckSiteKey: "",
  aiModel: "gemini-3.5-flash"
};
