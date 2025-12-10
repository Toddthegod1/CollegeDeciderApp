// seed_universities.mjs
import fs from "fs";
import { parse } from "csv-parse/sync";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// 1. Your Firebase config (same as src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
  measurementId: "G-P8EJV8MVF4"
};

// 2. Initialize Firebase (client SDK is fine for a one-off local script)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Read the CSV file (the one you created)
const csvText = fs.readFileSync("./universities.csv", "utf-8");

// 4. Parse CSV into objects using header row
// Columns: name,tags,photoUrl,city,state,country
const records = parse(csvText, {
  columns: true,          // use header row as keys
  skip_empty_lines: true
});

// Optional: limit how many to insert (you said 200 total)
const MAX_DOCS = 200;

async function seed() {
  let count = 0;

  for (const row of records) {
    if (count >= MAX_DOCS) break;

    // Convert "tag1,tag2,tag3" into ["tag1","tag2","tag3"]
    const tagsArray = row.tags
      ? row.tags.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const docData = {
      name: row.name,
      tags: tagsArray,
      photoUrl: row.photoUrl || "",
      city: row.city || "",
      state: row.state || "",
      country: row.country || ""
    };

    try {
      console.log(`Adding: ${docData.name}`);
      await addDoc(collection(db, "universities"), docData);
      count++;
    } catch (err) {
      console.error(`Error adding ${docData.name}:`, err);
    }
  }

  console.log(`Done seeding ${count} universities.`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
});
