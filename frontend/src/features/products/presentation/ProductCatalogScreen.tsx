import {useEffect} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../../app/hooks';
import {formatMoney} from '../../../shared/presentation/formatMoney';
import {
  selectProducts,
  selectProductsError,
  selectProductsStatus,
  selectSelectedProduct,
} from '../application/productsSelectors';
import {loadProducts, selectProduct} from '../application/productsSlice';
import {Product} from '../domain/Product';

export function ProductCatalogScreen() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadProducts());
    }
  }, [dispatch, status]);

  return (
    <View style={styles.screen}>
      <View style={styles.backLayer}>
        <Text accessibilityRole="header" style={styles.title}>
          Checkout seguro
        </Text>
        <Text style={styles.subtitle}>
          Selecciona el producto y continua al pago con tarjeta.
        </Text>
      </View>

      <View style={styles.frontLayer}>
        <View style={styles.handle} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <Text style={styles.sectionMeta}>{products.length} disponibles</Text>
        </View>

        {status === 'loading' ? (
          <View style={styles.feedback}>
            <ActivityIndicator color="#0f3b66" />
            <Text style={styles.feedbackText}>Cargando productos...</Text>
          </View>
        ) : null}

        {status === 'failed' ? (
          <View style={styles.feedback}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => dispatch(loadProducts())}
              style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'succeeded' ? (
          <>
            <FlatList
              data={products}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({item}) => (
                <ProductItem
                  product={item}
                  selected={item.id === selectedProduct?.id}
                  onPress={() => dispatch(selectProduct(item.id))}
                />
              )}
            />

            <View style={styles.checkoutBar}>
              <View style={styles.checkoutCopy}>
                <Text style={styles.checkoutLabel}>Seleccionado</Text>
                <Text numberOfLines={1} style={styles.checkoutProduct}>
                  {selectedProduct?.name ?? 'Sin producto'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={!selectedProduct}
                style={({pressed}) => [
                  styles.payButton,
                  pressed ? styles.payButtonPressed : null,
                  !selectedProduct ? styles.payButtonDisabled : null,
                ]}>
                <Text style={styles.payButtonText}>Pagar con tarjeta</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

type ProductItemProps = {
  product: Product;
  selected: boolean;
  onPress: () => void;
};

function ProductItem({product, selected, onPress}: ProductItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.productCard,
        selected ? styles.productCardSelected : null,
        pressed ? styles.productCardPressed : null,
      ]}>
      <Image
        accessibilityIgnoresInvertColors
        source={{uri: product.imageUrl}}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        <Text style={styles.productStock}>{product.stock} unidades disponibles</Text>
      </View>
      <Text style={styles.productPrice}>
        {formatMoney(product.priceInCents, product.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f3b66',
  },
  backLayer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d6e4f0',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 360,
  },
  frontLayer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flex: 1,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    height: 4,
    width: 44,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionMeta: {
    color: '#64748b',
    fontSize: 13,
  },
  feedback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  feedbackText: {
    color: '#475569',
    fontSize: 15,
    marginTop: 12,
  },
  errorText: {
    color: '#b42318',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0f3b66',
    borderRadius: 6,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 128,
  },
  productCard: {
    alignItems: 'center',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 112,
    padding: 16,
  },
  productImage: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  productCardSelected: {
    borderColor: '#0f3b66',
    borderWidth: 2,
  },
  productCardPressed: {
    backgroundColor: '#f8fafc',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  productDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  productStock: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  productPrice: {
    color: '#0f3b66',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 96,
    textAlign: 'right',
  },
  checkoutBar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
  },
  checkoutCopy: {
    flex: 1,
  },
  checkoutLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  checkoutProduct: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  payButton: {
    backgroundColor: '#0f3b66',
    borderRadius: 6,
    minWidth: 144,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  payButtonPressed: {
    backgroundColor: '#0b2d4d',
  },
  payButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
