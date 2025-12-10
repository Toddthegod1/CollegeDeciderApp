
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate immediately to the app area on web so user sees content right away
      router.replace('/swipe');
    } catch (err) {
      console.log(err);
      Alert.alert('Login Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UniSwipe Login</Text>

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

      <Button title="Log In" onPress={onLogin} />

      <View style={{ marginTop: 16 }}>
        <Text onPress={() => router.navigate('/register')} style={styles.link}>
          Don&apos;t have an account? Register
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