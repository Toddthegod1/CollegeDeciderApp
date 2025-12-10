
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    console.log('onRegister called', { email });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('createUserWithEmailAndPassword resolved', cred);
      try {
        // also show a browser alert for visibility on web
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Registered: ' + (cred.user?.uid || 'uid unknown'));
        }
      } catch (e) {
        /* ignore */
      }

      // Create a user document in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        visitedUniversities: [],
        createdAt: new Date(),
      });

      // After successful registration, navigate to the app area immediately
      router.replace('/swipe');
    } catch (err) {
      console.error('onRegister error', err);
      try {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Register Error: ' + (err?.message || String(err)));
        }
      } catch (e) {}
      Alert.alert('Register Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Register" onPress={onRegister} />

      <View style={{ marginTop: 16 }}>
        <Text onPress={() => router.navigate('/login')} style={styles.link}>
          Already have an account? Log in
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  link: {
    color: 'blue',
    textAlign: 'center',
  },
});
