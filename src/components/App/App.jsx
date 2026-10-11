import { Routes, Route } from 'react-router-dom';
import Product from '../Product/Product.jsx';
import ProductDetails from '../Product/ProductDetails.jsx';
import Cart from '../Cart/Cart.jsx'
import Profile from '../Profile/Profile.jsx'
function App({products}) {

  return (
      <Routes>
		<Route path="/" element={<Product />} />
		<Route path="/products/:id" element={<ProductDetails />} />
		<Route path="/cart" element={<Cart />} />
		<Route path="/profile" element={<Profile />} />
	</Routes>
  );
}

export default App;