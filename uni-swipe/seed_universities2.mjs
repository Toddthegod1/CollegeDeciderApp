// seed_campus_images2.mjs
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BAD_WORDS = ["logo", "seal", "crest", "emblem", "coat of arms", "map"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Wikimedia Commons search for a campus image
async function getCommonsCampusImageUrl(universityName) {
  // Try a couple of queries to improve hit rate
  const queries = [
    `${universityName} campus`,
    `${universityName} main building`,Sign out
    UniSwipe
    View selected
    toddjek@icloud.com
    
    Columbia University
    New York, NY, United States
    `${universityName} university campus`,
  ];

  for (const q of queries) {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query&format=json&origin=*" +
      "&generator=search" +
      `&gsrsearch=${encodeURIComponent(q)}` +
      "&gsrnamespace=6" + // File namespace
      "&gsrlimit=10" +
      "&prop=imageinfo" +
      "&iiprop=url" +
      "&iiurlwidth=1400";

    const res = await fetch(url);
    if (!res.ok) continue;

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) continue;

    // Prefer likely photo files, avoid logos/maps
    const candidates = Object.values(pages)
      .map((p) => ({
        title: (p.title || "").toLowerCase(),
        url: p.imageinfo?.[0]?.url || "",
      }))
      .filter((c) => c.url)
      .filter((c) => !BAD_WORDS.some((w) => c.title.includes(w)));

    if (candidates.length > 0) return candidates[0].url;
  }

  return "";
}

function isBlankPhotoUrl(photoUrl) {
  return (
    photoUrl === undefined ||
    photoUrl === null ||
    (typeof photoUrl === "string" && photoUrl.trim() === "")
  );
}

async function seedCampusImages() {
  // Pull docs without any where() filter so we don't miss missing-field docs
  const snap = await getDocs(query(collection(db, "universities"), limit(500)));

  console.log(`Fetched ${snap.size} universities (up to 500).`);

  let checked = 0;
  let updated = 0;

  for (const d of snap.docs) {
    checked++;
    const data = d.data();
    const name = data?.name;

    if (!name) continue;

    if (!isBlankPhotoUrl(data.photoUrl)) {
      // already has an image
      continue;
    }

    console.log(`🔎 Finding campus image for: ${name}`);
    const url = await getCommonsCampusImageUrl(name);

    if (!url) {
      console.log(`  ❌ No campus image found on Commons`);
      continue;
    }

    await updateDoc(doc(db, "universities", d.id), { photoUrl: url });
    updated++;
    console.log(`  ✅ Updated photoUrl`);

    // throttle to be polite
    await sleep(350);
  }

  console.log(`Done. Checked ${checked}. Updated ${updated}.`);
}

seedCampusImages().catch((e) => console.error("Seed failed:", e));