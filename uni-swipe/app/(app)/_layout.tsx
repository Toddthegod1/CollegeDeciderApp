import React from 'react';
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="swipe"
        options={{ title: 'Swipe' }}
      />
      <Tabs.Screen
        name="visited"
        options={{ title: 'Selected' }}
      />
    </Tabs>
  );
}
