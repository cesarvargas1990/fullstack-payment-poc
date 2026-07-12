import {Provider} from 'react-redux';
import {StatusBar, StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {store} from './src/app/store';
import {ProductCatalogScreen} from './src/features/products/presentation/ProductCatalogScreen';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f3b66" />
        <SafeAreaView style={styles.safeArea}>
          <ProductCatalogScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f3b66',
  },
});

export default App;
