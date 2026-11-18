// Sends Morning Mirror reminders. Runs every 15 min from GitHub Actions.
// Needs the FIREBASE_SERVICE_ACCOUNT secret (JSON of a Firebase service account key).
import admin from 'firebase-admin';

const APP_URL = 'https://athleticconsumer-dotcom.github.io/morning-mirror/';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
const fcm = admin.messaging();

function localNow(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => parts.find(x => x.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, min: (Number(g('hour')) % 24) * 60 + Number(g('minute')) };
}
const toMin = s => { const [h, m] = String(s || '0:00').split(':').map(Number); return h * 60 + (m || 0); };

const users = await db.collection('push').where('enabled', '==', true).get();
for (const doc of users.docs) {
  const u = doc.data(), uid = doc.id;
  if (!Array.isArray(u.tokens) || !u.tokens.length) continue;
  let tz = u.tz || 'Europe/Zurich';
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch { tz = 'Europe/Zurich'; }
  const { date, min } = localNow(tz);
  const inWindow = t => min >= toMin(t) && min < toMin(t) + 180;   // up to 3 h late, never early
  const entries = db.collection('users').doc(uid).collection('entries');
  const update = {}, messages = [];
  let profile = null;
  const getProfile = async () => profile ??= ((await entries.doc('profile').get()).data() || {});

  if (u.morningOn !== false && inWindow(u.morning || '07:30') && u.lastMorning !== date) {
    update.lastMorning = date;
    const day = (await entries.doc('d-' + date).get()).data();
    if (!(day && (day.weight || day.photoData || day.photoId))) {
      const p = await getProfile();
      let body = 'Photo and weight before breakfast. 30 seconds.';
      if (p.actionsSince && Math.round((Date.parse(date) - Date.parse(p.actionsSince)) / 864e5) === 21)
        body = '3 weeks done: your review is unlocked. ' + body;
      messages.push({ title: 'Morning check-in', body, tag: 'morning', url: APP_URL + '#today' });
    }
  }
  if (u.eveningOn !== false && inWindow(u.evening || '20:30') && u.lastEvening !== date) {
    update.lastEvening = date;
    const items = ((await entries.doc('f-' + date).get()).data() || {}).items || [];
    const kcal = Math.round(items.reduce((s, i) => s + (Number(i.kcal) || 0), 0));
    const target = ((await getProfile()).targets || {}).kcal;
    messages.push({ title: 'Food log', tag: 'evening', url: APP_URL + '#fuel',
      body: items.length ? `${kcal.toLocaleString('en-US')}${target ? ' / ' + target.toLocaleString('en-US') : ''} kcal tracked today. Anything missing?`
                         : 'Nothing logged today yet. Add your meals before bed.' });
  }

  const dead = [];
  for (const m of messages) {
    const res = await fcm.sendEachForMulticast({ tokens: u.tokens, data: m,
      webpush: { headers: { Urgency: 'high', TTL: '10800' } } });
    res.responses.forEach((r, i) => {
      const code = (r.error && r.error.code) || '';
      if (!r.success && /not-registered|invalid-registration-token|invalid-argument/.test(code)) dead.push(u.tokens[i]);
    });
    console.log(uid.slice(0, 6), m.tag, `${res.successCount}/${u.tokens.length} sent`);
  }
  if (dead.length) update.tokens = admin.firestore.FieldValue.arrayRemove(...new Set(dead));
  if (Object.keys(update).length) await doc.ref.update(update);
}
console.log('done', new Date().toISOString(), users.size, 'subscribed');
