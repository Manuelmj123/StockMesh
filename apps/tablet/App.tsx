import React, { useMemo, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import HomeScreen from './src/features/inventory/components/HomeScreen';
import AddProductScreen from './src/features/inventory/components/AddProductScreen';
import { ProductFormValues, ProductItem } from './src/types/inventory';
import { createMockInventory, locationDetails } from './src/data/mockInventory';
import { useInventory } from './src/features/inventory/hooks/useInventory';

type AppPage = 'home' | 'add';

function AppShell() {
  const insets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const [page, setPage] = useState<AppPage>('home');
  const [initialInventory] = useState<ProductItem[]>(() => createMockInventory());
  const inventory = useInventory(initialInventory);

  const location = useMemo(() => locationDetails, []);

  const handleSaveProduct = (values: ProductFormValues) => {
    inventory.addProduct(values);
    setPage('home');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {page === 'home' ? (
        <HomeScreen
          location={location}
          inventoryState={inventory}
          onAddPress={() => setPage('add')}
        />
      ) : (
        <AddProductScreen
          location={location}
          onCancel={() => setPage('home')}
          onSave={handleSaveProduct}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
});