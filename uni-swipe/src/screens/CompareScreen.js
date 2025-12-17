import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TextInput, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // <-- make sure this exports db (Firestore instance)

/**
 * Navigate here with:
 * router.push({ pathname: '/compare', params: { leftId: "docId1", rightId: "docId2" } })
 */
export default function CompareScreen() {
  const { leftId, rightId } = useLocalSearchParams();

  const [leftUni, setLeftUni] = useState(null);
  const [rightUni, setRightUni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Ratings state: { universityId: { vibe: 3, academics: 3, location: 3, gutFeeling: 3 } }
  const [ratings, setRatings] = useState({});
  // Notes state: { universityId: "note text" }
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);

  const missingParams = useMemo(() => !leftId || !rightId, [leftId, rightId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (missingParams) {
        setErr("Missing university IDs. Navigate with { leftId, rightId }.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const leftRef = doc(db, "universities", leftId);
        const rightRef = doc(db, "universities", rightId);

        const [leftSnap, rightSnap] = await Promise.all([getDoc(leftRef), getDoc(rightRef)]);

        if (!leftSnap.exists() || !rightSnap.exists()) {
          throw new Error("One or both universities were not found in Firestore.");
        }

        if (!cancelled) {
          setLeftUni({ id: leftSnap.id, ...leftSnap.data() });
          setRightUni({ id: rightSnap.id, ...rightSnap.data() });
        }

        // Load user ratings and notes
        if (auth.currentUser && !cancelled) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userRatings = userData.ratings || {};
            const userNotes = userData.notes || {};

            setRatings({
              [leftId]: userRatings[leftId] || { vibe: 3, academics: 3, location: 3, gutFeeling: 3 },
              [rightId]: userRatings[rightId] || { vibe: 3, academics: 3, location: 3, gutFeeling: 3 }
            });

            setNotes({
              [leftId]: userNotes[leftId] || "",
              [rightId]: userNotes[rightId] || ""
            });
          } else {
            // Initialize with default ratings
            setRatings({
              [leftId]: { vibe: 3, academics: 3, location: 3, gutFeeling: 3 },
              [rightId]: { vibe: 3, academics: 3, location: 3, gutFeeling: 3 }
            });
            setNotes({
              [leftId]: "",
              [rightId]: ""
            });
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load universities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leftId, rightId, missingParams]);

  const updateRating = (universityId, category, value) => {
    setRatings(prev => ({
      ...prev,
      [universityId]: {
        ...prev[universityId],
        [category]: value
      }
    }));
  };

  const updateNote = (universityId, text) => {
    setNotes(prev => ({
      ...prev,
      [universityId]: text
    }));
  };

  const saveData = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        ratings: ratings,
        notes: notes
      });
      // Could add a success message here
    } catch (e) {
      console.log("Error saving data:", e);
      setErr("Failed to save your ratings and notes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading comparison…</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "crimson", fontWeight: "600" }}>{err}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Compare</Text>

      <View style={styles.row}>
        <UniColumn uni={leftUni} />
        <UniColumn uni={rightUni} />
      </View>

      {/* Skeleton section for your "decision" features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Ratings</Text>
        <View style={styles.ratingsContainer}>
          <View style={styles.ratingColumn}>
            <Text style={styles.uniName}>{leftUni?.name}</Text>
            <RatingSlider
              label="Vibe"
              value={ratings[leftId]?.vibe || 3}
              onValueChange={(value) => updateRating(leftId, 'vibe', value)}
            />
            <RatingSlider
              label="Academics"
              value={ratings[leftId]?.academics || 3}
              onValueChange={(value) => updateRating(leftId, 'academics', value)}
            />
            <RatingSlider
              label="Location"
              value={ratings[leftId]?.location || 3}
              onValueChange={(value) => updateRating(leftId, 'location', value)}
            />
            <RatingSlider
              label="Gut Feeling"
              value={ratings[leftId]?.gutFeeling || 3}
              onValueChange={(value) => updateRating(leftId, 'gutFeeling', value)}
            />
          </View>
          <View style={styles.ratingColumn}>
            <Text style={styles.uniName}>{rightUni?.name}</Text>
            <RatingSlider
              label="Vibe"
              value={ratings[rightId]?.vibe || 3}
              onValueChange={(value) => updateRating(rightId, 'vibe', value)}
            />
            <RatingSlider
              label="Academics"
              value={ratings[rightId]?.academics || 3}
              onValueChange={(value) => updateRating(rightId, 'academics', value)}
            />
            <RatingSlider
              label="Location"
              value={ratings[rightId]?.location || 3}
              onValueChange={(value) => updateRating(rightId, 'location', value)}
            />
            <RatingSlider
              label="Gut Feeling"
              value={ratings[rightId]?.gutFeeling || 3}
              onValueChange={(value) => updateRating(rightId, 'gutFeeling', value)}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Notes</Text>
        <View style={styles.notesContainer}>
          <View style={styles.noteColumn}>
            <Text style={styles.uniName}>{leftUni?.name}</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Add your notes about this university..."
              value={notes[leftId] || ""}
              onChangeText={(text) => updateNote(leftId, text)}
            />
          </View>
          <View style={styles.noteColumn}>
            <Text style={styles.uniName}>{rightUni?.name}</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Add your notes about this university..."
              value={notes[rightId] || ""}
              onChangeText={(text) => updateNote(rightId, text)}
            />
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveData}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Ratings & Notes"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function UniColumn({ uni }) {
  const tags = Array.isArray(uni?.tags) ? uni.tags : [];

  return (
    <View style={styles.col}>
      <Text style={styles.uniName} numberOfLines={2}>
        {uni?.name || "Unknown University"}
      </Text>

      {uni?.photoUrl ? (
        <Image source={{ uri: uni.photoUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.muted}>No image yet</Text>
        </View>
      )}

      <Text style={styles.label}>Location</Text>
      <Text style={styles.value}>
        {[uni?.city, uni?.state, uni?.country].filter(Boolean).join(", ") || "—"}
      </Text>

      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagsWrap}>
        {tags.length ? (
          tags.slice(0, 8).map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.value}>—</Text>
        )}
      </View>
    </View>
  );
}

function RatingSlider({ label, value, onValueChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <Pressable
            key={star}
            onPress={() => onValueChange(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              star <= value && styles.starSelected
            ]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingValue}>{value}/5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  uniName: { fontSize: 16, fontWeight: "700", marginBottom: 8, minHeight: 40 },
  image: { width: "100%", height: 140, borderRadius: 10, marginBottom: 10, backgroundColor: "#f2f2f2" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, fontWeight: "700", marginTop: 6, color: "#333" },
  value: { fontSize: 13, color: "#333", marginTop: 2 },
  muted: { color: "#666" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "#f0f0f0" },
  tagText: { fontSize: 12, color: "#333" },
  section: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  ratingsContainer: { flexDirection: "row", gap: 12 },
  ratingColumn: { flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ratingLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  starsContainer: { flexDirection: "row", gap: 4 },
  starButton: { padding: 2 },
  star: { fontSize: 18, color: "#ddd" },
  starSelected: { color: "#ffd700" },
  ratingValue: { fontSize: 12, color: "#666", marginLeft: 8 },
  notesContainer: { flexDirection: "row", gap: 12 },
  noteColumn: { flex: 1 },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 20
  },
  saveButtonDisabled: { backgroundColor: "#ccc" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});