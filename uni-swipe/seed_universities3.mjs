// seed_campus_images_overwrite_like_before.mjs
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

/**
 * Firebase config (same as src/firebase.js)
 */
const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp.firebaseapp.com".includes("firebaseapp.com")
    ? "collegedeciderapp"
    : "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
  measurementId: "G-P8EJV8MVF4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Same idea as before: avoid obvious non-campus files, but keep it LIGHT
const BAD_WORDS = ["logo", "seal", "crest", "emblem", "coat of arms", "map", "flag"];

// Throttle helper
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * This uses Wikimedia Commons "generator=search" (like the earlier working script)
 * and tries multiple query variants for higher hit rate.
 */
async function getCommonsCampusImageUrl(universityName) {
  const searchQueries = [
    `${universityName} campus`,
    `${universityName} university`,
    `${universityName} main building`,
    `${universityName} quad`,
  ];

  for (const q of searchQueries) {
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

    // Prefer images that aren't obviously logos/maps
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

/**
 * MAIN: overwrite photoUrl for up to N docs.
 * (This does NOT skip docs that already have a photoUrl.)
 */
async function overwriteCampusImages() {
  const MAX_DOCS_TO_SCAN = 500; // change if you want
  const snap = await getDocs(query(collection(db, "universities"), limit(MAX_DOCS_TO_SCAN)));

  console.log(`Fetched ${snap.size} universities (up to ${MAX_DOCS_TO_SCAN}).`);

  let checked = 0;
  let updated = 0;
  let noImageFound = 0;

  for (const d of snap.docs) {
    checked++;
    const data = d.data();
    const name = data?.name;

    if (!name) continue;

    console.log(`🔄 Overwriting campus image for: ${name}`);

    const photoUrl = await getCommonsCampusImageUrl(name);

    if (!photoUrl) {
      console.log(`  ❌ No Wikimedia Commons campus image found`);
      noImageFound++;
      continue;
    }

    await updateDoc(doc(db, "universities", d.id), { photoUrl });
    console.log(`  ✅ Overwrote photoUrl`);
    updated++;

    // Be polite to Wikimedia
    await sleep(350);
  }

  console.log("\n==== Summary ====");
  console.log(`Checked: ${checked}`);
  console.log(`Updated (overwritten): ${updated}`);
  console.log(`No image found: ${noImageFound}`);
  console.log("=================\n");
}

overwriteCampusImages().catch((err) => {
  console.error("Overwrite seeding failed:", err);
});
