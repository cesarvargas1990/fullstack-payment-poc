import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  clearCart,
  decreaseProductQuantity,
  loadProducts,
  removeProductFromCart,
} from '../application/productsSlice';
import {formatCardNumber, validateCardForm} from '../domain/cardValidation';
import {Product} from '../domain/Product';
import {payCart} from '../infrastructure/checkoutApi';

export function ProductCatalogScreen() {
  const [activeView, setActiveView] = useState<
    'products' | 'cart' | 'payment' | 'summary'
  >('products');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: '',
    customerEmail: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  });
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
  const cardValidation = validateCardForm(cardForm);
  const cardBrandLabel =
    cardValidation.brand === 'visa'
      ? 'Visa'
      : cardValidation.brand === 'mastercard'
        ? 'Mastercard'
        : 'No detectada';
  const cardNumberGroups = getCardNumberGroups(cardForm.cardNumber);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadProducts());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (activeView === 'payment' && cardForm.cardNumber.length > 0) {
      console.log('[card-validation]', {
        brand: cardValidation.brand,
        maskedNumber: cardValidation.maskedNumber,
        isNumberValid: cardValidation.isNumberValid,
        isExpiryValid: cardValidation.isExpiryValid,
        isCvcValid: cardValidation.isCvcValid,
      });
    }
  }, [
    activeView,
    cardForm.cardNumber,
    cardValidation.brand,
    cardValidation.isCvcValid,
    cardValidation.isExpiryValid,
    cardValidation.isNumberValid,
    cardValidation.maskedNumber,
  ]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleReviewPayment = () => {
    if (!cardValidation.isValid || cardForm.cardHolder.trim().length < 2) {
      showToast('Completa los datos validos de la tarjeta.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cardForm.customerEmail.trim())) {
      showToast('Ingresa un correo valido para crear la transaccion.');
      return;
    }

    setActiveView('summary');
  };

  const handlePay = async () => {
    if (cartItems.length === 0) {
      showToast('Agrega productos al carrito antes de pagar.');
      return;
    }

    if (!cardValidation.isValid) {
      showToast('Los datos de la tarjeta estan incompletos o no son validos.');
      return;
    }

    setIsPaying(true);

    try {
      const transactions = await payCart(cartItems, {
        ...cardForm,
        customerEmail: cardForm.customerEmail.trim(),
      });
      const hasDeclined = transactions.some(
        transaction => transaction.status !== 'APPROVED',
      );

      if (hasDeclined) {
        showToast('El pago fue rechazado. Revisa los datos e intenta de nuevo.');
        return;
      }

      console.log('[payment-success]', {
        transactionIds: transactions.map(transaction => transaction.id),
        totalInCents: cartTotalInCents,
        items: cartItemCount,
      });
      dispatch(clearCart());
      setActiveView('products');
      showToast('Pago aprobado. Transaccion completada.');
    } catch (paymentError) {
      console.log('[payment-error]', {
        message:
          paymentError instanceof Error
            ? paymentError.message
            : 'Unknown payment error',
      });
      showToast('No fue posible completar el pago.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backLayer}>
        <Text accessibilityRole="header" style={styles.title}>
          Checkout seguro
        </Text>
        <Text style={styles.subtitle}>
          {activeView === 'payment'
            ? 'Ingresa los datos ficticios de la tarjeta para continuar.'
            : 'Agrega articulos y continua al pago con tarjeta.'}
        </Text>
      </View>

      <View style={styles.frontLayer}>
        <View style={styles.handle} />
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {activeView === 'products'
                ? 'Productos'
                : activeView === 'cart'
                  ? 'Carrito'
                  : activeView === 'payment'
                    ? 'Pago con tarjeta'
                    : 'Resumen del pago'}
            </Text>
            <Text style={styles.sectionMeta}>
              {activeView === 'products'
                ? `${products.length} disponibles`
                : activeView === 'cart'
                  ? `${cartItemCount} articulos agregados`
                  : formatMoney(cartTotalInCents, 'COP')}
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
                onPress={() => setActiveView('payment')}
                style={({pressed}) => [
                  styles.payButton,
                  pressed ? styles.payButtonPressed : null,
                  cartItemCount === 0 ? styles.payButtonDisabled : null,
                ]}>
                <Text style={styles.payButtonText}>Pagar con tarjeta de credito</Text>
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
                onPress={() => setActiveView('payment')}
                style={({pressed}) => [
                  styles.payButton,
                  pressed ? styles.payButtonPressed : null,
                  cartItemCount === 0 ? styles.payButtonDisabled : null,
                ]}>
                <Text style={styles.payButtonText}>Pagar con tarjeta de credito</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {status === 'succeeded' && activeView === 'payment' ? (
          <>
            <FlatList
              data={[{id: 'payment-form'}]}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.paymentContent}
              renderItem={() => (
                <View>
                  <View style={styles.paymentSummary}>
                    <Text style={styles.paymentSummaryLabel}>Resumen</Text>
                    <Text style={styles.paymentSummaryTotal}>
                      {formatMoney(cartTotalInCents, 'COP')}
                    </Text>
                    <Text style={styles.paymentSummaryMeta}>
                      {cartItemCount} {cartItemCount === 1 ? 'articulo' : 'articulos'} en el carrito
                    </Text>
                  </View>

                  <View style={styles.cardForm}>
                    <Text style={styles.formTitle}>Informacion de la tarjeta</Text>
                    <Text style={styles.formHelp}>
                      Ingresa datos validos de la tarjeta.
                    </Text>

                    <Text style={styles.inputLabel}>Numero de tarjeta</Text>
                    <View style={styles.cardNumberRow}>
                      {cardNumberGroups.map((group, index) => (
                        <TextInput
                          accessibilityLabel={`Grupo ${index + 1} del numero de tarjeta`}
                          key={index}
                          keyboardType="number-pad"
                          maxLength={4}
                          onChangeText={value =>
                            setCardForm(current => ({
                              ...current,
                              cardNumber: updateCardNumberGroup(
                                current.cardNumber,
                                index,
                                value,
                              ),
                            }))
                          }
                          placeholder={index === 0 ? '4242' : '0000'}
                          placeholderTextColor="#94a3b8"
                          style={[styles.input, styles.cardNumberInput]}
                          value={group}
                        />
                      ))}
                    </View>
                    {cardValidation.brand !== 'unknown' ? (
                      <View style={styles.cardBrandRow}>
                        <Text style={styles.cardBrandLabel}>Franquicia</Text>
                        <CardBrandMark
                          brand={cardValidation.brand}
                          label={cardBrandLabel}
                        />
                      </View>
                    ) : null}
                    {cardForm.cardNumber.length > 0 &&
                    !cardValidation.isNumberValid ? (
                      <Text accessibilityRole="alert" style={styles.inputError}>
                        Ingresa una tarjeta Visa o Mastercard valida.
                      </Text>
                    ) : null}

                    <Text style={styles.inputLabel}>Nombre del titular</Text>
                    <TextInput
                      accessibilityLabel="Nombre del titular"
                      autoCapitalize="words"
                      onChangeText={cardHolder =>
                        setCardForm(current => ({...current, cardHolder}))
                      }
                      placeholder="Cliente de prueba"
                      placeholderTextColor="#94a3b8"
                      style={styles.input}
                      value={cardForm.cardHolder}
                    />

                    <Text style={styles.inputLabel}>Correo del comprador</Text>
                    <TextInput
                      accessibilityLabel="Correo del comprador"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={customerEmail =>
                        setCardForm(current => ({...current, customerEmail}))
                      }
                      placeholder="buyer@example.com"
                      placeholderTextColor="#94a3b8"
                      style={styles.input}
                      value={cardForm.customerEmail}
                    />

                    <View style={styles.inputRow}>
                      <View style={styles.inputColumn}>
                        <Text style={styles.inputLabel}>Mes</Text>
                        <TextInput
                          accessibilityLabel="Mes de expiracion"
                          keyboardType="number-pad"
                          maxLength={2}
                          onChangeText={expMonth =>
                            setCardForm(current => ({...current, expMonth}))
                          }
                          placeholder="12"
                          placeholderTextColor="#94a3b8"
                          style={styles.input}
                          value={cardForm.expMonth}
                        />
                      </View>
                      <View style={styles.inputColumn}>
                        <Text style={styles.inputLabel}>Ano</Text>
                        <TextInput
                          accessibilityLabel="Ano de expiracion"
                          keyboardType="number-pad"
                          maxLength={4}
                          onChangeText={expYear =>
                            setCardForm(current => ({...current, expYear}))
                          }
                          placeholder="29"
                          placeholderTextColor="#94a3b8"
                          style={styles.input}
                          value={cardForm.expYear}
                        />
                      </View>
                      <View style={styles.inputColumn}>
                        <Text style={styles.inputLabel}>CVC</Text>
                        <TextInput
                          accessibilityLabel="Codigo de seguridad"
                          keyboardType="number-pad"
                          maxLength={3}
                          onChangeText={cvc =>
                            setCardForm(current => ({
                              ...current,
                              cvc: cvc.replace(/\D/g, '').slice(0, 3),
                            }))
                          }
                          placeholder="123"
                          placeholderTextColor="#94a3b8"
                          secureTextEntry
                          style={styles.input}
                          value={cardForm.cvc}
                        />
                      </View>
                    </View>
                    {(cardForm.expMonth.length > 0 || cardForm.expYear.length > 0) &&
                    !cardValidation.isExpiryValid ? (
                      <Text accessibilityRole="alert" style={styles.inputError}>
                        La fecha de expiracion no es valida.
                      </Text>
                    ) : null}
                    {cardForm.cvc.length > 0 && !cardValidation.isCvcValid ? (
                      <Text accessibilityRole="alert" style={styles.inputError}>
                        El CVC debe tener 3 digitos.
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            />

            <View style={styles.checkoutBar}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveView('cart')}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleReviewPayment}
                style={({pressed}) => [
                  styles.payButton,
                  styles.confirmPaymentButton,
                  pressed ? styles.payButtonPressed : null,
                ]}>
                <Text style={styles.payButtonText}>Continuar</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {status === 'succeeded' && activeView === 'summary' ? (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={item => item.product.id}
              contentContainerStyle={styles.paymentContent}
              ListHeaderComponent={
                <View style={styles.paymentSummary}>
                  <Text style={styles.paymentSummaryLabel}>Resumen del pago</Text>
                  <Text style={styles.paymentSummaryTotal}>
                    {formatMoney(cartTotalInCents, 'COP')}
                  </Text>
                  <Text style={styles.paymentSummaryMeta}>
                    Se creara una transaccion PENDING y luego se procesara el pago.
                  </Text>
                </View>
              }
              renderItem={({item}) => (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>{item.product.name}</Text>
                  <Text style={styles.summaryItemMeta}>
                    {item.quantity} x{' '}
                    {formatMoney(item.product.priceInCents, item.product.currency)}
                  </Text>
                </View>
              )}
            />

            <View style={styles.checkoutBar}>
              <Pressable
                accessibilityRole="button"
                disabled={isPaying}
                onPress={() => setActiveView('payment')}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isPaying}
                onPress={handlePay}
                style={({pressed}) => [
                  styles.payButton,
                  styles.confirmPaymentButton,
                  pressed ? styles.payButtonPressed : null,
                  isPaying ? styles.payButtonDisabled : null,
                ]}>
                <Text style={styles.payButtonText}>
                  {isPaying ? 'Procesando...' : 'Pagar'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {toastMessage ? (
          <View style={styles.toast}>
            <Text accessibilityRole="alert" style={styles.toastText}>
              {toastMessage}
            </Text>
          </View>
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

type CardBrandMarkProps = {
  brand: 'visa' | 'mastercard';
  label: string;
};

function CardBrandMark({brand}: CardBrandMarkProps) {
  if (brand === 'visa') {
    return (
      <View accessibilityLabel="Tarjeta Visa detectada" style={styles.visaLogoFrame}>
        <Text style={styles.visaLogoText}>VISA</Text>
      </View>
    );
  }

  if (brand === 'mastercard') {
    return (
      <View
        accessibilityLabel="Tarjeta Mastercard detectada"
        style={styles.mastercardLogoFrame}>
        <View style={styles.mastercardLogoCircles}>
          <View style={[styles.mastercardLogoCircle, styles.mastercardLogoRed]} />
          <View
            style={[styles.mastercardLogoCircle, styles.mastercardLogoOrange]}
          />
        </View>
        <Text style={styles.mastercardLogoText}>Mastercard</Text>
      </View>
    );
  }
}

function getCardNumberGroups(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, '').slice(0, 16);

  return [0, 1, 2, 3].map(index => digits.slice(index * 4, index * 4 + 4));
}

function updateCardNumberGroup(cardNumber: string, index: number, value: string) {
  const groups = getCardNumberGroups(cardNumber);
  groups[index] = value.replace(/\D/g, '').slice(0, 4);

  return formatCardNumber(groups.join(''));
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
  paymentContent: {
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
  paymentSummary: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  paymentSummaryLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  paymentSummaryTotal: {
    color: '#0f3b66',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  paymentSummaryMeta: {
    color: '#475569',
    fontSize: 14,
    marginTop: 6,
  },
  summaryItem: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  summaryItemName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryItemMeta: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  cardForm: {
    marginTop: 18,
  },
  formTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  formHelp: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  cardNumberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 0,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  cardBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardBrandLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  visaLogoFrame: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 92,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visaLogoText: {
    color: '#1a1f71',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    transform: [{skewX: '-10deg'}],
  },
  mastercardLogoFrame: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 42,
    minWidth: 116,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mastercardLogoCircles: {
    flexDirection: 'row',
    height: 24,
    justifyContent: 'center',
    width: 46,
  },
  mastercardLogoCircle: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  mastercardLogoRed: {
    backgroundColor: '#eb001b',
    marginRight: -8,
  },
  mastercardLogoOrange: {
    backgroundColor: '#f79e1b',
    opacity: 0.95,
  },
  mastercardLogoText: {
    color: '#1f2937',
    fontSize: 11,
    fontWeight: '800',
    marginTop: -2,
  },
  inputError: {
    color: '#b42318',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputColumn: {
    flex: 1,
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
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: '#0f3b66',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmPaymentButton: {
    flex: 1,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    bottom: 84,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'absolute',
    right: 20,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
