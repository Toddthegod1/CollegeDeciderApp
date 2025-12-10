import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function VisitedListScreen() {
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    const fetchVisited = async () => {
      if (!auth.currentUser) {
        setUniversities([]);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUniversities([]);
          setLoading(false);
          return;
        }

        const data = userSnap.data();
        const visited = Array.isArray(data.visitedUniversities) ? data.visitedUniversities : [];

        // fetch each university doc
        const uniDocs = await Promise.all(
          visited.map(async (id) => {
            try {
              const uref = doc(db, 'universities', id);
              const usnap = await getDoc(uref);
              return usnap.exists() ? { id: usnap.id, ...usnap.data() } : null;
            } catch (e) {
              return null;
            }
          })
        );

        setUniversities(uniDocs.filter(Boolean));
      } catch (err) {
        console.log('Error loading visited list', err);
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVisited();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!universities.length) {
    return (
      <View style={styles.center}>
        <Text>No selected universities yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={universities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.city}, {item.country}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#666' },
});
