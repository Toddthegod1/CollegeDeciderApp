// seed_images.mjs
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";

// ✅ Your Firebase config (same as src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
  measurementId: "G-P8EJV8MVF4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Wikipedia thumbnail lookup ---
async function getWikipediaThumbnail(universityName) {
  const url =
    "https://en.wikipedia.org/w/api.php" +
    `?action=query&format=json&origin=*` +
    `&titles=${encodeURIComponent(universityName)}` +
    `&prop=pageimages&pithumbsize=1000`;

  const res = await fetch(url);
  if (!res.ok) return "";

  const data = await res.json();
  const pages = data?.query?.pages || {};
  const firstKey = Object.keys(pages)[0];
  const page = pages[firstKey];

  return page?.thumbnail?.source || "";Sign out
  UniSwipe
  View selected
  toddjek@icloud.com
  No image
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function seedImages() {
  // Only update docs with empty photoUrl
  const q = query(
    collection(db, "universities"),
    where("photoUrl", "==", ""),
    limit(200) // change this if you want to do more per run
  );

  const snap = await getDocs(q);
  console.log(`Found ${snap.size} universities with empty photoUrl`);

  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const name = data.name;

    if (!name) continue;

    console.log(`Looking up image for: ${name}`);

    const photoUrl = await getWikipediaThumbnail(name);

    if (!photoUrl) {
      console.log(`  ❌ No Wikipedia thumbnail found for: ${name}`);
      continue;
    }

    await updateDoc(doc(db, "universities", d.id), { photoUrl });
    updated++;
    console.log(`  ✅ Updated photoUrl`);

    // Be polite to Wikipedia (rate-limit)
    await sleep(250);
  }

  console.log(`Done. Updated ${updated} universities.`);
}

seedImages().catch((e) => {
  console.error("Image seeding failed:", e);
});