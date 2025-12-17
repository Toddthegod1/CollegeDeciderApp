import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function VisitedListScreen() {
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const router = useRouter();

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

  const toggleSelection = (universityId) => {
    setSelectedForCompare(prev => {
      if (prev.includes(universityId)) {
        return prev.filter(id => id !== universityId);
      } else {
        return [...prev, universityId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length >= 2) {
      // Compare the first 2 selected universities
      router.push({
        pathname: '/compare',
        params: {
          leftId: selectedForCompare[0],
          rightId: selectedForCompare[1]
        }
      });
    }
  };

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
      <Text style={styles.headerTitle}>Selected Universities</Text>
      {selectedForCompare.length >= 2 && (
        <Pressable onPress={handleCompare} style={styles.compareButton}>
          <Text style={styles.compareButtonText}>Compare Selected ({selectedForCompare.length})</Text>
        </Pressable>
      )}
      <Text style={styles.selectionText}>
        {selectedForCompare.length === 0 ? 'Select universities to compare' :
         selectedForCompare.length === 1 ? 'Select more universities to compare' :
         `Selected ${selectedForCompare.length} universities for comparison`}
      </Text>
      <FlatList
        data={universities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleSelection(item.id)}
            style={[
              styles.card,
              selectedForCompare.includes(item.id) && styles.selectedCard
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.city}, {item.country}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedForCompare.includes(item.id) && styles.checkboxSelected
              ]}>
                {selectedForCompare.includes(item.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  compareButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'center',
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#666' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
