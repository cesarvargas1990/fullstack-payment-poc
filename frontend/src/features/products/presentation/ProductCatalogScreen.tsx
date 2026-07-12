import {useEffect, useState} from 'react';
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
  selectCartItemCount,
  selectCartItems,
  selectCartTotalInCents,
} from '../application/productsSelectors';
import {
  addProductToCart,
  decreaseProductQuantity,
  loadProducts,
  removeProductFromCart,
} from '../application/productsSlice';
import {Product} from '../domain/Product';

export function ProductCatalogScreen() {
  const [activeView, setActiveView] = useState<'products' | 'cart'>('products');
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const cartItems = useAppSelector(selectCartItems);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartTotalInCents = useAppSelector(selectCartTotalInCents);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);
  const cartQuantities = Object.fromEntries(
    cartItems.map(item => [item.product.id, item.quantity]),
  );

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
          Agrega articulos y continua al pago con tarjeta.
        </Text>
      </View>

      <View style={styles.frontLayer}>
        <View style={styles.handle} />
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {activeView === 'products' ? 'Productos' : 'Carrito'}
            </Text>
            <Text style={styles.sectionMeta}>
              {activeView === 'products'
                ? `${products.length} disponibles`
                : `${cartItemCount} articulos agregados`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver carrito"
            onPress={() =>
              setActiveView(activeView === 'products' ? 'cart' : 'products')
            }
            style={styles.cartShortcut}>
            <View style={styles.cartShortcutIcon}>
              <View style={styles.cartBasket} />
              <View style={styles.cartWheelRow}>
                <View style={styles.cartWheel} />
                <View style={styles.cartWheel} />
              </View>
            </View>
            <Text style={styles.cartShortcutText}>
              {activeView === 'products' ? 'Carro' : 'Productos'}
            </Text>
            {cartItemCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.segmentedControl}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveView('products')}
            style={[
              styles.segmentButton,
              activeView === 'products' ? styles.segmentButtonActive : null,
            ]}>
            <Text
              style={[
                styles.segmentText,
                activeView === 'products' ? styles.segmentTextActive : null,
              ]}>
              Buscar productos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveView('cart')}
            style={[
              styles.segmentButton,
              activeView === 'cart' ? styles.segmentButtonActive : null,
            ]}>
            <Text
              style={[
                styles.segmentText,
                activeView === 'cart' ? styles.segmentTextActive : null,
              ]}>
              Ver carrito
            </Text>
          </Pressable>
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

        {status === 'succeeded' && activeView === 'products' ? (
          <>
            <FlatList
              data={products}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({item}) => (
                <ProductItem
                  product={item}
                  quantity={cartQuantities[item.id] ?? 0}
                  onAdd={() => dispatch(addProductToCart(item.id))}
                  onDecrease={() => dispatch(decreaseProductQuantity(item.id))}
                  onRemove={() => dispatch(removeProductFromCart(item.id))}
                />
              )}
            />

            <View style={styles.checkoutBar}>
              <View style={styles.checkoutCopy}>
                <Text style={styles.checkoutLabel}>
                  {cartItemCount} {cartItemCount === 1 ? 'articulo' : 'articulos'}
                </Text>
                <Text numberOfLines={1} style={styles.checkoutProduct}>
                  {cartItemCount > 0
                    ? formatMoney(cartTotalInCents, 'COP')
                    : 'Carrito vacio'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={cartItemCount === 0}
                style={({pressed}) => [
                  styles.payButton,
                  pressed ? styles.payButtonPressed : null,
                  cartItemCount === 0 ? styles.payButtonDisabled : null,
                ]}>
                <Text style={styles.payButtonText}>Pagar con tarjeta</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {status === 'succeeded' && activeView === 'cart' ? (
          <>
            {cartItems.length === 0 ? (
              <View style={styles.feedback}>
                <Text style={styles.emptyCartTitle}>Tu carrito esta vacio</Text>
                <Text style={styles.emptyCartText}>
                  Agrega productos desde el catalogo para continuar.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveView('products')}
                  style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Buscar productos</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={cartItems}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.listContent}
                renderItem={({item}) => (
                  <ProductItem
                    product={item.product}
                    quantity={item.quantity}
                    onAdd={() => dispatch(addProductToCart(item.product.id))}
                    onDecrease={() =>
                      dispatch(decreaseProductQuantity(item.product.id))
                    }
                    onRemove={() =>
                      dispatch(removeProductFromCart(item.product.id))
                    }
                  />
                )}
                ListFooterComponent={
                  <View style={styles.cartSummary}>
                    <Text style={styles.cartSummaryLabel}>Total a pagar</Text>
                    <Text style={styles.cartSummaryTotal}>
                      {formatMoney(cartTotalInCents, 'COP')}
                    </Text>
                  </View>
                }
              />
            )}

            <View style={styles.checkoutBar}>
              <View style={styles.checkoutCopy}>
                <Text style={styles.checkoutLabel}>
                  {cartItemCount} {cartItemCount === 1 ? 'articulo' : 'articulos'}
                </Text>
                <Text numberOfLines={1} style={styles.checkoutProduct}>
                  {cartItemCount > 0
                    ? formatMoney(cartTotalInCents, 'COP')
                    : 'Carrito vacio'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={cartItemCount === 0}
                style={({pressed}) => [
                  styles.payButton,
                  pressed ? styles.payButtonPressed : null,
                  cartItemCount === 0 ? styles.payButtonDisabled : null,
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
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

function ProductItem({
  product,
  quantity,
  onAdd,
  onDecrease,
  onRemove,
}: ProductItemProps) {
  const hasItems = quantity > 0;
  const reachedStock = quantity >= product.stock;

  return (
    <View
      style={[
        styles.productCard,
        hasItems ? styles.productCardSelected : null,
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
        {hasItems ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRemove}
            style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Quitar</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.productActions}>
        <Text style={styles.productPrice}>
          {formatMoney(product.priceInCents, product.currency)}
        </Text>
        <View style={styles.quantityControls}>
          <Pressable
            accessibilityLabel={`Disminuir ${product.name}`}
            accessibilityRole="button"
            disabled={!hasItems}
            onPress={onDecrease}
            style={[
              styles.quantityButton,
              !hasItems ? styles.quantityButtonDisabled : null,
            ]}>
            <Text style={styles.quantityButtonText}>-</Text>
          </Pressable>
          <Text accessibilityLabel={`${quantity} en carrito`} style={styles.quantityText}>
            {quantity}
          </Text>
          <Pressable
            accessibilityLabel={`Agregar ${product.name}`}
            accessibilityRole="button"
            disabled={reachedStock}
            onPress={onAdd}
            style={[
              styles.quantityButton,
              reachedStock ? styles.quantityButtonDisabled : null,
            ]}>
            <Text style={styles.quantityButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
  cartShortcut: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 10,
    position: 'relative',
  },
  cartShortcutIcon: {
    height: 18,
    justifyContent: 'center',
    width: 20,
  },
  cartBasket: {
    borderBottomWidth: 2,
    borderColor: '#0f3b66',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    height: 10,
    transform: [{skewX: '-8deg'}],
  },
  cartWheelRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 2,
  },
  cartWheel: {
    backgroundColor: '#0f3b66',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  cartShortcutText: {
    color: '#0f3b66',
    fontSize: 13,
    fontWeight: '700',
  },
  cartBadge: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 5,
    position: 'absolute',
    right: -8,
    top: -8,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentedControl: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#0f3b66',
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
  emptyCartTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCartText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
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
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  productActions: {
    alignItems: 'flex-end',
    gap: 12,
    minWidth: 96,
  },
  quantityControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: '#0f3b66',
    borderRadius: 6,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  quantityButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  quantityText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  removeButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  removeButtonText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
  },
  cartSummary: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    padding: 16,
  },
  cartSummaryLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  cartSummaryTotal: {
    color: '#0f3b66',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
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
