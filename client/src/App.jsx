import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './routes/ProtectedRoute';
import AppLayout        from './layouts/AppLayout';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';

// Main pages
import DashboardPage    from './pages/dashboard/DashboardPage';
import ProductsPage     from './pages/products/ProductsPage';
import ProductFormPage  from './pages/products/ProductFormPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CategoriesPage   from './pages/categories/CategoriesPage';
import CategoryFormPage from './pages/categories/CategoryFormPage';
import CategoryDetailPage from './pages/categories/CategoryDetailPage';
import CustomersPage    from './pages/customers/CustomersPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import SuppliersPage    from './pages/suppliers/SuppliersPage';
import SupplierFormPage from './pages/suppliers/SupplierFormPage';
import SalesPage        from './pages/sales/SalesPage';
import NewSalePage      from './pages/sales/NewSalePage';
import SaleDetailPage   from './pages/sales/SaleDetailPage';
import PurchasesPage    from './pages/purchases/PurchasesPage';
import NewPurchasePage  from './pages/purchases/NewPurchasePage';
import PurchaseDetailPage from './pages/purchases/PurchaseDetailPage';
import InventoryPage    from './pages/inventory/InventoryPage';
import ReportsPage      from './pages/reports/ReportsPage';
import UsersPage        from './pages/users/UsersPage';
import ProfilePage      from './pages/profile/ProfilePage';
import NotFoundPage     from './pages/NotFoundPage';
import ForbiddenPage    from './pages/ForbiddenPage';

const App = () => (
  <AuthProvider>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403"   element={<ForbiddenPage />} />

      {/* Protected — all wrapped in sidebar layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={
          <ProtectedRoute permission="dashboard:read">
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="products" element={
          <ProtectedRoute permission="products:read">
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="products/new" element={
          <ProtectedRoute permission="products:create">
            <ProductFormPage />
          </ProtectedRoute>
        } />
        <Route path="products/:id" element={
          <ProtectedRoute permission="products:read">
            <ProductDetailPage />
          </ProtectedRoute>
        } />
        <Route path="products/:id/edit" element={
          <ProtectedRoute permission="products:update">
            <ProductFormPage />
          </ProtectedRoute>
        } />

        <Route path="categories" element={
          <ProtectedRoute permission="categories:read">
            <CategoriesPage />
          </ProtectedRoute>
        } />
        <Route path="categories/new" element={
          <ProtectedRoute permission="categories:create">
            <CategoryFormPage />
          </ProtectedRoute>
        } />
        <Route path="categories/:id/edit" element={
          <ProtectedRoute permission="categories:update">
            <CategoryFormPage />
          </ProtectedRoute>
        } />
        <Route path="categories/:id" element={
          <ProtectedRoute permission="categories:read">
            <CategoryDetailPage />
          </ProtectedRoute>
        } />

        <Route path="customers"  element={<CustomersPage />} />
        <Route path="customers/new" element={<CustomerFormPage />} />
        <Route path="customers/:id/edit" element={<CustomerFormPage />} />

        <Route path="suppliers"  element={<SuppliersPage />} />
        <Route path="suppliers/new" element={<SupplierFormPage />} />
        <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />

        <Route path="sales"      element={<SalesPage />} />
        <Route path="sales/new"  element={<NewSalePage />} />
        <Route path="sales/:id"  element={<SaleDetailPage />} />

        <Route path="purchases"     element={<PurchasesPage />} />
        <Route path="purchases/new" element={<NewPurchasePage />} />
        <Route path="purchases/:id" element={<PurchaseDetailPage />} />

        <Route path="inventory"  element={<InventoryPage />} />
        <Route path="reports"    element={<ReportsPage />} />

        <Route path="users"      element={
          <ProtectedRoute permission="users:read">
            <UsersPage />
          </ProtectedRoute>
        } />

        <Route path="profile"    element={<ProfilePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AuthProvider>
);

export default App;
