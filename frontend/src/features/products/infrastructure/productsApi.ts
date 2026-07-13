import {API_BASE_URL} from '../../../shared/config/apiConfig';
import {Product} from '../domain/Product';

type ProductResponse = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInCents: number;
  currency: 'COP';
  stock: number;
};

export async function fetchProducts(): Promise<Product[]> {
  const url = `${API_BASE_URL}/products`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('No fue posible cargar los productos');
  }

  const products = (await response.json()) as ProductResponse[];

  return products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    priceInCents: product.priceInCents,
    currency: product.currency,
    stock: product.stock,
  }));
}
