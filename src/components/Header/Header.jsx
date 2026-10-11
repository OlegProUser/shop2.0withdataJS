// src/components/Header/Header.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GrSearch } from 'react-icons/gr';
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import { getCart, getUser } from '../../lib/storage';
import styles from './Header.module.css';
import logo from '../../assets/logo.png';

export default function Header({ search, onSearchChange, showSearch = false }) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sync = () => {
      const cart = getCart();
      setCartCount(cart.reduce((s, i) => s + (i.quantity || 1), 0));
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

  return (
    <header className={styles.header}>
      <div className={styles.contain}>
        <div className={styles.row}>
          <Link to="/" className={styles.logo_link}>
            <img className={styles.logo} src={logo} alt="logo" />
		  </Link>

          {showSearch && (
            <div className={styles.search}>
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Введите запрос"
              />
              <GrSearch className={styles.search_icon} />
            </div>
          )}

          <nav className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              onClick={() => navigate('/cart')}
              aria-label="Корзина"
            >
              <FiShoppingCart className={styles.action_icon} />
              <span className={styles.action_label}>Корзина</span>
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount}</span>
              )}
            </button>

            <button
              type="button"
              className={styles.action}
              onClick={() => navigate('/profile')}
              aria-label="Профиль"
            >
              <FiUser className={styles.action_icon} />
              <span className={styles.action_label}>
                {user?.name ? user.name : 'Профиль'}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}