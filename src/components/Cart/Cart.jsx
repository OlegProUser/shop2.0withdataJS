// src/components/Cart/Cart.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiPackage } from 'react-icons/fi';
import {
  getCart,
  setCart,
  clearCart,
  getUser,
  createOrder,
} from '../../lib/storage';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import styles from './cart.module.css';

function formatPrice(value, currency = '₽') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toLocaleString('ru-RU')} ${currency}`;
}

// TODO(DB): придёт из API Почты России /v1/delivery/calculate
const DELIVERY_RANGE = '2 000 – 6 000 ₽';

function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Синхронизация с хранилищем
  useEffect(() => {
    const sync = () => {
      setItems(getCart());
      setUser(getUser());
    };
    sync();
    window.addEventListener('cart:updated', sync);
    window.addEventListener('user:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cart:updated', sync);
      window.removeEventListener('user:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
    [items]
  );

  const updateQty = (id, delta) => {
    const next = items.map((i) =>
      String(i.id) === String(id)
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
    );
    setItems(next);
    setCart(next);
  };

  const removeItem = (id) => {
    const next = items.filter((i) => String(i.id) !== String(id));
    setItems(next);
    setCart(next);
  };

  const handleCheckoutClick = () => {
    if (!user) {
      // Требуем авторизацию — уводим в профиль
      navigate('/profile', { state: { redirectTo: 'checkout' } });
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderCreated = (order) => {
    setSuccessOrder(order);
    clearCart();
    // TODO(DB): POST /api/orders уже вернёт id + трек-номер Почты России
    setTimeout(() => navigate('/profile'), 2500);
  };

  if (items.length === 0 && !successOrder) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.empty}>
            <FiPackage className={styles.empty_icon} />
            <h2>Корзина пуста</h2>
            <p>Добавьте товары, чтобы оформить заказ.</p>
            <Link to="/" className={styles.empty_link}>
              Перейти в каталог
            </Link>
          </div>
        </main>
        <footer className={styles.footer}>
          <Footer />
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <FiArrowLeft /> Назад
        </button>

        <h1 className={styles.title}>Корзина</h1>

        <div className={styles.layout}>
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.item_img}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className={styles.item_no_img}>Нет фото</div>
                  )}
                </div>

                <div className={styles.item_info}>
                  <h3 className={styles.item_name}>{item.name}</h3>
                  <div className={styles.item_price}>
                    {formatPrice(item.price, item.currency)}
                  </div>
                </div>

                <div className={styles.item_qty}>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    aria-label="Уменьшить"
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    aria-label="Увеличить"
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className={styles.item_total}>
                  {formatPrice(Number(item.price) * item.quantity, item.currency)}
                </div>

                <button
                  className={styles.item_remove}
                  onClick={() => removeItem(item.id)}
                  aria-label="Удалить"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          <aside className={styles.summary}>
            <h2 className={styles.summary_title}>Итого</h2>

            <div className={styles.summary_row}>
              <span>Товары ({items.length})</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className={styles.summary_row}>
              <span>Доставка Почтой России</span>
              <span className={styles.summary_muted}>{DELIVERY_RANGE}</span>
            </div>

            <div className={styles.summary_divider} />

            <div className={styles.summary_total}>
              <span>К оплате</span>
              <span>{formatPrice(total)}</span>
            </div>

            <p className={styles.summary_note}>
              Стоимость доставки рассчитывается Почтой России и добавляется
              при оформлении.
            </p>

            <button
              type="button"
              className={styles.checkout_btn}
              onClick={handleCheckoutClick}
            >
              Оформить заказ
            </button>

            {!user && (
              <p className={styles.auth_hint}>
                Для оформления нужно войти в{' '}
                <Link to="/profile">профиль</Link>.
              </p>
            )}
          </aside>
        </div>
      </main>

      <footer className={styles.footer}>
        <Footer />
      </footer>

      {showCheckout && (
        <CheckoutModal
          user={user}
          items={items}
          total={total}
          onClose={() => setShowCheckout(false)}
          onCreated={handleOrderCreated}
        />
      )}

      {successOrder && (
        <div className={styles.success_overlay}>
          <div className={styles.success_card}>
            <div className={styles.success_icon}>✓</div>
            <h2>Заказ оформлен</h2>
            <p>
              Номер заказа: <strong>{successOrder.id.slice(0, 8)}</strong>
            </p>
            <p className={styles.success_muted}>
              Мы отправили данные в Почту России. Трек-номер появится в
              профиле, когда заказ будет принят.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Checkout Modal ================= */

const initialForm = {
  recipientName: '',
  postalCode: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  branchAddress: '',
  comment: '',
};

function CheckoutModal({ user, items, total, onClose, onCreated }) {
  const [deliveryType, setDeliveryType] = useState('branch'); // 'branch' | 'address'
  const [form, setForm] = useState({
    ...initialForm,
    recipientName: user?.name ?? '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.recipientName.trim()) e.recipientName = 'Укажите ФИО получателя';

    if (!/^\d{6}$/.test(form.postalCode.trim())) {
      e.postalCode = 'Индекс — 6 цифр';
    }

    if (deliveryType === 'address') {
      if (!form.city.trim()) e.city = 'Укажите город';
      if (!form.street.trim()) e.street = 'Укажите улицу';
      if (!form.house.trim()) e.house = 'Укажите дом';
    } else {
      if (!form.branchAddress.trim())
        e.branchAddress = 'Укажите адрес отделения';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    // TODO(DB): POST /api/orders
    // Бэкенд:
    //  1) создаёт заказ в БД со статусом CREATED
    //  2) вызывает API Почты России "Отправка" → создаёт отправление
    //  3) получает трек-номер (РПО), сохраняет в order.trackNumber
    //  4) возвращает заказ + трек
    const order = createOrder({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      items,
      itemsTotal: total,
      delivery: {
        type: deliveryType, // 'branch' | 'address'
        costEstimate: DELIVERY_RANGE,
        recipientName: form.recipientName.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        house: form.house.trim(),
        apartment: form.apartment.trim(),
        branchAddress: form.branchAddress.trim(),
        comment: form.comment.trim(),
      },
    });

    setSubmitting(false);
    onCreated(order);
  };

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal_header}>
          <h2>Оформление заказа</h2>
          <button className={styles.modal_close} onClick={onClose}>
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.form_section}>
            <div className={styles.form_section_title}>Способ доставки</div>
            <div className={styles.delivery_tabs}>
              <button
                type="button"
                className={
                  deliveryType === 'branch'
                    ? `${styles.delivery_tab} ${styles.delivery_tab_active}`
                    : styles.delivery_tab
                }
                onClick={() => setDeliveryType('branch')}
              >
                В отделение Почты России
              </button>
              <button
                type="button"
                className={
                  deliveryType === 'address'
                    ? `${styles.delivery_tab} ${styles.delivery_tab_active}`
                    : styles.delivery_tab
                }
                onClick={() => setDeliveryType('address')}
              >
                Курьером по адресу
              </button>
            </div>
            <p className={styles.delivery_hint}>
              Стоимость доставки Почтой России: {DELIVERY_RANGE}. Точная сумма
              появится после расчёта на стороне Почты.
            </p>
          </div>

          <div className={styles.form_section}>
            <div className={styles.form_section_title}>Получатель</div>
            <Field
              label="ФИО получателя"
              value={form.recipientName}
              onChange={(v) => setField('recipientName', v)}
              error={errors.recipientName}
              placeholder="Иванов Иван Иванович"
            />
            <Field
              label="Индекс"
              value={form.postalCode}
              onChange={(v) => setField('postalCode', v.replace(/\D/g, '').slice(0, 6))}
              error={errors.postalCode}
              placeholder="123456"
            />
          </div>

          {deliveryType === 'address' ? (
            <div className={styles.form_section}>
              <div className={styles.form_section_title}>Адрес доставки</div>
              <Field
                label="Город"
                value={form.city}
                onChange={(v) => setField('city', v)}
                error={errors.city}
                placeholder="Москва"
              />
              <Field
                label="Улица"
                value={form.street}
                onChange={(v) => setField('street', v)}
                error={errors.street}
                placeholder="Тверская"
              />
              <div className={styles.form_row}>
                <Field
                  label="Дом"
                  value={form.house}
                  onChange={(v) => setField('house', v)}
                  error={errors.house}
                  placeholder="1"
                />
                <Field
                  label="Квартира"
                  value={form.apartment}
                  onChange={(v) => setField('apartment', v)}
                  placeholder="10"
                />
              </div>
            </div>
          ) : (
            <div className={styles.form_section}>
              <div className={styles.form_section_title}>Отделение Почты России</div>
              <Field
                label="Адрес отделения"
                value={form.branchAddress}
                onChange={(v) => setField('branchAddress', v)}
                error={errors.branchAddress}
                placeholder="г. Москва, ул. Тверская, 1, отделение 125009"
              />
            </div>
          )}

          <div className={styles.form_section}>
            <div className={styles.form_section_title}>Комментарий (необязательно)</div>
            <textarea
              className={styles.textarea}
              value={form.comment}
              onChange={(e) => setField('comment', e.target.value)}
              placeholder="Например: позвонить за час до доставки"
              rows={3}
            />
          </div>

          <div className={styles.form_total}>
            <span>Товары</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div className={styles.form_actions}>
            <button
              type="button"
              className={styles.btn_ghost}
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.btn_primary}
              disabled={submitting}
            >
              {submitting ? 'Отправка...' : 'Подтвердить заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <label className={styles.field}>
      <span className={styles.field_label}>{label}</span>
      <input
        type={type}
        className={error ? `${styles.input} ${styles.input_error}` : styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className={styles.field_error}>{error}</span>}
    </label>
  );
}

export default Cart;