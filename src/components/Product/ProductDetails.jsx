// src/components/Product/ProductDetails.jsx
import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from './product.data.js';
import { addToCart } from '../../lib/storage';
import Header from '../Header/Header';
import './productDetails.css';

const PLACEHOLDER = '/images/placeholder.jpg';

function formatPrice(value, currency = '₽') {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('ru-RU')} ${currency}`;
}

function ProductDetails() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = useMemo(
    () => products.find((p) => String(p.id) === String(id)),
    [id]
  );

  if (!product) {
    return (
		<><Header />
      <div className="product-details">
       
        <div className="product-details__not-found">
          <h2>Товар не найден</h2>
          <p>Возможно, он был удалён или ссылка устарела.</p>
          <Link to="/">← Вернуться к каталогу</Link>
        </div>
      </div>
		</> 
    );
  }

  const {
    name,
    brand,
    sku,
    price,
    oldPrice,
    currency = '₽',
    inStock,
    rating,
    reviewsCount,
    description,
    shortDescription,
    specs,
    images = [],
    tags = [],
  } = product;

  const gallery = images.length > 0 ? images : [PLACEHOLDER];
  const safeActive = Math.min(activeImage, gallery.length - 1);

  const priceFormatted = formatPrice(price, currency);
  const oldPriceFormatted = formatPrice(oldPrice, currency);
  const discount =
    oldPriceFormatted && priceFormatted && Number(oldPrice) > Number(price)
      ? Math.round((1 - Number(price) / Number(oldPrice)) * 100)
      : null;

  const specsEntries =
    specs && typeof specs === 'object' ? Object.entries(specs) : [];

  const handleAddToCart = () => {
    // Кладём товар в общее хранилище (localStorage → потом API).
    // Событие cart:updated внутри addToCart обновит счётчик в <Header />.
    addToCart(product);
    setAddedToCart(true);
  };

  return (
    <>
      <Header />
      <div className="product-details">
        <Link to="/" className="product-details__back">
          ← Назад к товарам
        </Link>

        <div className="product-details__layout">
          {/* Галерея */}
          <div className="product-details__gallery">
            <div className="product-details__main-image">
              <img
                src={gallery[safeActive]}
                alt={name || 'Товар'}
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER;
                }}
              />
            </div>

            {gallery.length > 1 && (
              <div className="product-details__thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className="product-details__thumb"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Изображение ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="product-details__info">
            {brand && <div className="product-details__brand">{brand}</div>}

            <h1 className="product-details__title">{name || 'Без названия'}</h1>

            <div className="product-details__meta">
              {rating != null && (
                <span>
                  <span className="product-details__rating">★ {rating}</span>
                  {reviewsCount ? ` (${reviewsCount})` : ''}
                </span>
              )}
              {sku && <span>Артикул: {sku}</span>}
              <span
                className={
                  'product-details__stock ' +
                  (inStock
                    ? 'product-details__stock--in'
                    : 'product-details__stock--out')
                }
              >
                {inStock ? '● В наличии' : '○ Нет в наличии'}
              </span>
            </div>

            {tags.length > 0 && (
              <div className="product-details__tags">
                {tags.map((tag) => (
                  <span key={tag} className="product-details__tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {priceFormatted && (
              <div className="product-details__price-row">
                <span className="product-details__price">{priceFormatted}</span>
                {oldPriceFormatted && (
                  <span className="product-details__old-price">
                    {oldPriceFormatted}
                  </span>
                )}
                {discount && (
                  <span className="product-details__discount">−{discount}%</span>
                )}
              </div>
            )}

            {(description || shortDescription) && (
              <p className="product-details__description">
                {description || shortDescription}
              </p>
            )}

            <div className="product-details__actions">
              {addedToCart ? (
                <Link
                  to="/cart"
                  className="product-details__btn product-details__btn--primary"
                >
                  Перейти в корзину →
                </Link>
              ) : (
                <button
                  type="button"
                  className="product-details__btn product-details__btn--primary"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                >
                  {inStock ? 'В корзину' : 'Нет в наличии'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Характеристики */}
        {specsEntries.length > 0 && (
          <section className="product-details__specs">
            <h2 className="product-details__specs-title">Характеристики</h2>
            <table className="product-details__specs-table">
              <tbody>
                {specsEntries.map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}

export default ProductDetails;