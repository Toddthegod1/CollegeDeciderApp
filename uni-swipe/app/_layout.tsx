import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase';

export default function RootLayout() {
	const [user, setUser] = useState<any>(null);
	const [initializing, setInitializing] = useState<boolean>(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (firebaseUser) => {
			setUser(firebaseUser || null);
			if (initializing) setInitializing(false);
		});

		return () => unsub();
	}, [initializing]);

	if (initializing) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<Stack>
			{user ? (
				<Stack.Screen name="(app)" options={{ headerShown: false }} />
			) : (
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			)}
		</Stack>
	);
}

