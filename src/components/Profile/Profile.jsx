// src/components/Profile/Profile.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiPackage, FiUser } from 'react-icons/fi';
import {
  getUser,
  setUser,
  clearUser,
  getOrdersByUser,
} from '../../lib/storage';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import styles from './Profile.module.css';

function formatPrice(value, currency = '₽') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toLocaleString('ru-RU')} ${currency}`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_LABELS = {
  CREATED: 'Создан',
  PAID: 'Оплачен',
  SENT: 'Отправлен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

const STATUS_CLASSES = {
  CREATED: 'status_created',
  PAID: 'status_paid',
  SENT: 'status_sent',
  DELIVERED: 'status_delivered',
  CANCELLED: 'status_cancelled',
};

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUserState] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const sync = () => {
      const u = getUser();
      setUserState(u);
      setOrders(u ? getOrdersByUser(u.id) : []);
    };
    sync();
    window.addEventListener('user:updated', sync);
    window.addEventListener('orders:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('user:updated', sync);
      window.removeEventListener('orders:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Если пользователь пришёл из корзины "оформить" — после логина вернём обратно
  useEffect(() => {
    if (user && location.state?.redirectTo === 'checkout') {
      navigate('/cart', { replace: true });
    }
  }, [user, location.state, navigate]);

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {!user ? (
          <AuthPanel onAuth={setUser} />
        ) : (
          <div className={styles.profile_layout}>
            <aside className={styles.sidebar}>
              <div className={styles.user_card}>
                <div className={styles.user_avatar}>
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className={styles.user_name}>{user.name}</div>
                <div className={styles.user_phone}>{user.phone}</div>
                {user.email && (
                  <div className={styles.user_email}>{user.email}</div>
                )}
              </div>

              <button className={styles.logout_btn} onClick={handleLogout}>
                <FiLogOut /> Выйти
              </button>
            </aside>

            <section className={styles.orders_section}>
              <h1 className={styles.section_title}>
                <FiPackage /> Мои заказы
              </h1>

              {orders.length === 0 ? (
                <div className={styles.no_orders}>
                  <p>У вас пока нет заказов.</p>
                  <button
                    className={styles.go_catalog}
                    onClick={() => navigate('/')}
                  >
                    Перейти в каталог
                  </button>
                </div>
              ) : (
                <div className={styles.orders_list}>
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <Footer />
      </footer>
    </div>
  );
}

/* ================= Auth Panel ================= */

function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  return (
    <div className={styles.auth_panel}>
      <div className={styles.auth_tabs}>
        <button
          className={mode === 'login' ? `${styles.auth_tab} ${styles.auth_tab_active}` : styles.auth_tab}
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button
          className={mode === 'register' ? `${styles.auth_tab} ${styles.auth_tab_active}` : styles.auth_tab}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>

      {mode === 'login' ? (
        <LoginForm onAuth={onAuth} />
      ) : (
        <RegisterForm onAuth={onAuth} />
      )}
    </div>
  );
}

function normalizePhone(raw) {
  return raw.replace(/[^\d+]/g, '');
}

function isValidPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

function LoginForm({ onAuth }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isValidPhone(phone)) {
      setError('Введите корректный номер телефона');
      return;
    }

    // TODO(DB): POST /api/auth/login { phone, name }
    // Реальный бэкенд: ищем пользователя по телефону. Если нет — 404.
    const known = JSON.parse(localStorage.getItem('known_users') || '[]');
    const match = known.find(
      (u) => u.phone === normalizePhone(phone)
    );

    if (!match) {
      setError('Пользователь не найден. Зарегистрируйтесь.');
      return;
    }

    onAuth(match);
  };

  return (
    <form className={styles.auth_form} onSubmit={handleSubmit}>
      <h2 className={styles.auth_title}>Вход в профиль</h2>

      <Field
        label="Телефон"
        value={phone}
        onChange={setPhone}
        placeholder="+7 999 123-45-67"
      />
      <Field
        label="Имя (необязательно)"
        value={name}
        onChange={setName}
        placeholder="Иван"
      />

      {error && <div className={styles.auth_error}>{error}</div>}

      <button type="submit" className={styles.auth_submit}>
        Войти
      </button>
    </form>
  );
}

function RegisterForm({ onAuth }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};

    if (!name.trim()) errs.name = 'Укажите имя';
    if (!isValidPhone(phone)) errs.phone = 'Введите корректный номер';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Некорректный email';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // TODO(DB): POST /api/auth/register { name, phone, email }
    // Бэкенд должен проверить уникальность телефона и вернуть созданного пользователя
    const newUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email.trim() || null,
      createdAt: new Date().toISOString(),
    };

    // Заглушка "базы пользователей"
    const known = JSON.parse(localStorage.getItem('known_users') || '[]');
    if (known.some((u) => u.phone === newUser.phone)) {
      setErrors({ phone: 'Этот номер уже зарегистрирован' });
      return;
    }
    known.push(newUser);
    localStorage.setItem('known_users', JSON.stringify(known));

    onAuth(newUser);
  };

  return (
    <form className={styles.auth_form} onSubmit={handleSubmit}>
      <h2 className={styles.auth_title}>Регистрация</h2>

      <Field
        label="Имя"
        value={name}
        onChange={setName}
        placeholder="Иван"
        error={errors.name}
      />
      <Field
        label="Телефон"
        value={phone}
        onChange={setPhone}
        placeholder="+7 999 123-45-67"
        error={errors.phone}
      />
      <Field
        label="Email (необязательно)"
        value={email}
        onChange={setEmail}
        placeholder="ivan@example.com"
        error={errors.email}
      />

      <button type="submit" className={styles.auth_submit}>
        Зарегистрироваться
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, error, type = 'text' }) {
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

/* ================= Order Card ================= */

function OrderCard({ order }) {
  const statusClass = STATUS_CLASSES[order.status] || 'status_created';

  return (
    <div className={styles.order_card}>
      <div className={styles.order_head}>
        <div>
          <div className={styles.order_id}>
            Заказ #{order.id.slice(0, 8)}
          </div>
          <div className={styles.order_date}>{formatDate(order.createdAt)}</div>
        </div>
        <span className={`${styles.status} ${styles[statusClass]}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className={styles.order_items}>
        {order.items.map((it) => (
          <div key={it.id} className={styles.order_item}>
            <span className={styles.order_item_name}>
              {it.name} × {it.quantity}
            </span>
            <span className={styles.order_item_price}>
              {formatPrice(Number(it.price) * it.quantity, it.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.order_delivery}>
        <div className={styles.order_delivery_row}>
          <span>Способ доставки</span>
          <span>
            {order.delivery.type === 'branch'
              ? `Отделение Почты России — ${order.delivery.branchAddress}`
              : `Курьером — ${order.delivery.city}, ${order.delivery.street} ${order.delivery.house}${
                  order.delivery.apartment ? `, кв. ${order.delivery.apartment}` : ''
                }`}
          </span>
        </div>
        <div className={styles.order_delivery_row}>
          <span>Индекс</span>
          <span>{order.delivery.postalCode}</span>
        </div>
        {order.trackNumber && (
          <div className={styles.order_delivery_row}>
            <span>Трек-номер</span>
            <span className={styles.order_track}>{order.trackNumber}</span>
          </div>
        )}
      </div>

      <div className={styles.order_footer}>
        <span className={styles.order_total_label}>Итого</span>
        <span className={styles.order_total}>
          {formatPrice(order.itemsTotal)}
        </span>
      </div>
    </div>
  );
}

export default Profile;