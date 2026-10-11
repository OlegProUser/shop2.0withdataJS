import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GrSearch } from 'react-icons/gr';
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import { products as productsData } from './product.data.js';
import Footer from '../Footer/Footer';
import styles from './product.module.css';
import Header from '../Header/Header'
const CART_KEY = 'cart';

function formatPrice(value, currency = '₽') {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('ru-RU')} ${currency}`;
}

function addToCart(product) {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    const existing = cart.find((i) => String(i.id) === String(product.id));

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency || '₽',
        image: product.images?.[0] ?? null,
        quantity: 1,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart:updated'));
  } catch (e) {
    console.error('Cart error:', e);
  }
}
function Product() {
  const navigate = useNavigate();
  const [products] = useState(productsData);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState(null);
  const [sortedProducts, setSortedProducts] = useState(productsData);
  const [isFound, setIsFound] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Счётчик корзины — читаем localStorage и слушаем обновления
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem('cart');
        const cart = raw ? JSON.parse(raw) : [];
        const total = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    readCart();
    window.addEventListener('cart:updated', readCart);
    window.addEventListener('storage', readCart);
    return () => {
      window.removeEventListener('cart:updated', readCart);
      window.removeEventListener('storage', readCart);
    };
  }, []);

  useEffect(() => {
    let next = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (sortDir === 'asc') next.sort((a, b) => a.price - b.price);
    if (sortDir === 'desc') next.sort((a, b) => b.price - a.price);

    setSortedProducts(next);
    setIsFound(search.trim().length > 0 && next.length === 0);
  }, [search, sortDir, products]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className={styles.wrapper}>
      <Header search={search} onSearchChange={setSearch} showSearch />

      <main className={styles.main}>
        <div className={styles.main_top}>
          <h1 className={styles.main_h}>Товары</h1>

          <div className={styles.sort_row}>
            <button
              type="button"
              className={
                sortDir === 'asc'
                  ? `${styles.sort_btn} ${styles.sort_btn_active}`
                  : styles.sort_btn
              }
              onClick={() => setSortDir(sortDir === 'asc' ? null : 'asc')}
            >
              По возрастанию
            </button>
            <button
              type="button"
              className={
                sortDir === 'desc'
                  ? `${styles.sort_btn} ${styles.sort_btn_active}`
                  : styles.sort_btn
              }
              onClick={() => setSortDir(sortDir === 'desc' ? null : 'desc')}
            >
              По убыванию
            </button>
          </div>
        </div>

        {isFound ? (
          <div className={styles.not_found}>
            <h2>Ничего не найдено</h2>
            <p>Попробуйте изменить запрос или сбросить поиск.</p>
          </div>
        ) : (
          <div className={styles.prod_row}>
            {sortedProducts.map((prod) => {
              const priceText = formatPrice(prod.price, prod.currency);
              const oldPriceText = prod.oldPrice
                ? formatPrice(prod.oldPrice, prod.currency)
                : null;
              const hasImage = prod.images && prod.images.length > 0;
              const isAdded = addedId === prod.id;
              const outOfStock = prod.inStock === false;

              return (
                <Link
                  to={`/products/${prod.id}`}
                  key={prod.id}
                  className={styles.prod_card}
                >
                  <div className={styles.prod_img_wrap}>
                    {hasImage ? (
                      <img
                        className={styles.prod_img}
                        src={prod.images[0]}
                        alt={prod.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.prod_no_img}>Нет изображения</div>
                    )}

                    {prod.tags?.length > 0 && (
                      <div className={styles.prod_tags}>
                        {prod.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className={styles.prod_tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {outOfStock && (
                      <div className={styles.prod_out_of_stock}>
                        Нет в наличии
                      </div>
                    )}
                  </div>

                  <div className={styles.prod_body}>
                    {prod.brand && (
                      <div className={styles.prod_brand}>{prod.brand}</div>
                    )}

                    <h2 className={styles.prod_name}>{prod.name}</h2>

                    {prod.rating != null && (
                      <div className={styles.prod_meta}>
                        <span className={styles.prod_rating}>
                          ★ {prod.rating}
                        </span>
                        {prod.reviewsCount ? (
                          <span className={styles.prod_reviews}>
                            ({prod.reviewsCount})
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className={styles.prod_price_row}>
                      {priceText && (
                        <span className={styles.prod_price}>{priceText}</span>
                      )}
                      {oldPriceText && (
                        <span className={styles.prod_old_price}>
                          {oldPriceText}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={
                        isAdded
                          ? `${styles.prod_btn} ${styles.prod_btn_added}`
                          : styles.prod_btn
                      }
                      onClick={(e) => handleAddToCart(e, prod)}
                      disabled={outOfStock}
                    >
                      {outOfStock
                        ? 'Нет в наличии'
                        : isAdded
                        ? '✓ Добавлено'
                        : 'В корзину'}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <Footer />
      </footer>
    </div>
  );
}

export default Product;