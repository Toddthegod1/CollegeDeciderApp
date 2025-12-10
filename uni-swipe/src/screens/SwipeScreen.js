
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Swiper from 'react-native-deck-swiper';
import { collection, getDocs, addDoc, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function SwipeScreen() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  // initialize selected list from user's Firestore document
  useEffect(() => {
    const loadSelected = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (Array.isArray(data.visitedUniversities)) {
            setSelected(data.visitedUniversities);
          }
        }
      } catch (e) {
        console.log('Error loading selected universities:', e);
      }
    };

    loadSelected();
  }, []);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const snap = await getDocs(collection(db, 'universities'));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUniversities(data);
      } catch (err) {
        console.log('Error fetching universities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const handleSwipe = async (cardIndex, direction) => {
    const uni = universities[cardIndex];
    if (!uni || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'swipes'), {
        userId: auth.currentUser.uid,
        universityId: uni.id,
        direction, // "left" or "right"
        createdAt: new Date(),
      });
      // If user swiped right, add to their visited/selected universities
      if (direction === 'right') {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            visitedUniversities: arrayUnion(uni.id),
          });
          // update local selected list for immediate UI feedback
          setSelected((prev) => (prev.includes(uni.id) ? prev : [...prev, uni.id]));
        } catch (err) {
          console.log('Error adding to selected Universities:', err);
        }
      }
    } catch (err) {
      console.log('Error saving swipe:', err);
    }
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
      // navigate back to login after sign out
      try {
        router.replace('/login');
      } catch (e) {
        // ignore navigation errors
      }
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading universities...</Text>
      </View>
    );
  }

  if (!universities.length) {
    return (
      <View style={styles.center}>
        <Text>No universities to show yet.</Text>
        <Button title="Log out" onPress={onLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onLogout} style={styles.floatingLogout}>
        <Text style={styles.floatingLogoutText}>Sign out</Text>
      </Pressable>
      <View style={styles.header}>
        <Pressable onPress={onLogout} style={styles.logoutLinkLeft}>
          <Text style={styles.logoutLinkText}>Sign out</Text>
        </Pressable>
        <Text style={styles.title}>UniSwipe</Text>
        <Pressable onPress={() => router.push('/visited')} style={styles.viewSelectedLink}>
          <Text style={styles.viewSelectedText}>View selected</Text>
        </Pressable>
        <View style={styles.headerRight}>
          {auth.currentUser?.email ? (
            <Text style={styles.userEmail}>{auth.currentUser.email}</Text>
          ) : null}
        </View>
      </View>

      <Swiper
        cards={universities}
        renderCard={(card) => {
          if (!card) return null;

          return (
            <View style={styles.card}>
              {card.photoUrl ? (
                <Image source={{ uri: card.photoUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Text>No image</Text>
                </View>
              )}
              <Text style={styles.cardTitle}>{card.name}</Text>
              <Text style={styles.cardSubtitle}>
                {card.city}, {card.state}, {card.country}
              </Text>

              {Array.isArray(card.tags) && (
                <View style={styles.tagRow}>
                  {card.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        onSwipedLeft={(i) => handleSwipe(i, 'left')}
        onSwipedRight={(i) => handleSwipe(i, 'right')}
        backgroundColor="#f5f5f5"
        stackSize={3}
        cardIndex={0}
        animateCardOpacity
      />

      {/* Bottom bar showing visited/selected universities */}
      {selected && selected.length > 0 ? (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomTitle}>Selected Universities</Text>
          <ScrollView horizontal contentContainerStyle={styles.bottomScroll} showsHorizontalScrollIndicator={false}>
            {selected.map((id) => {
              const uni = universities.find((u) => u.id === id);
              const name = uni ? uni.name : id;
              return (
                <View key={id} style={styles.bottomChip}>
                  <Text style={styles.bottomChipText}>{name}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    marginRight: 12,
    color: '#555',
  },
  logoutLinkLeft: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  logoutLinkText: {
    color: '#ff4d4f',
    fontWeight: '600',
  },
  viewSelectedLink: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  viewSelectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  floatingLogout: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1000,
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 6,
  },
  floatingLogoutText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    flex: 0.75,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  bottomScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomChip: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  bottomChipText: {
    color: '#333',
  },
});
