import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../services/dashboardService';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat('en-IN');
const formatCurrency = (value) => currency.format(Number(value) || 0);
const formatNumber = (value) => number.format(Number(value) || 0);
const formatDate = (value) => (value ? format(new Date(value), 'dd MMM yyyy') : '—');
const formatChartDate = (value) => format(new Date(`${value}T00:00:00`), 'dd MMM');

const StatCard = ({ title, value, description, icon: Icon, color, to }) => (
  <Link
    to={to}
    className="card group flex min-w-0 items-start gap-4 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
  >
    <span className={`rounded-xl p-3 ${color}`}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <span className="min-w-0">
      <span className="block text-sm text-slate-500">{title}</span>
      <span className="mt-1 block truncate text-2xl font-bold text-slate-800">{value}</span>
      <span className="mt-1 block text-xs text-slate-400">{description}</span>
    </span>
    <ArrowTrendingUpIcon className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary-500" aria-hidden="true" />
  </Link>
);

const EmptyState = ({ children }) => (
  <p className="py-10 text-center text-sm text-slate-400">{children}</p>
);

const DashboardSkeleton = () => (
  <div className="space-y-6" aria-label="Loading dashboard" aria-busy="true">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_value, index) => (
        <div className="card flex gap-4" key={index}>
          <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }, (_value, index) => (
        <div className="card h-80 animate-pulse bg-slate-100" key={index} />
      ))}
    </div>
    <div className="card h-72 animate-pulse bg-slate-100" />
  </div>
);

const DashboardPage = () => {
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(7);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getDashboard({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setData(response.data.data);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load dashboard data. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retry]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="card mx-auto max-w-xl py-12 text-center">
        <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-slate-800">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">{error || 'No dashboard data was returned.'}</p>
        <button className="btn btn-primary mt-5" onClick={() => setRetry((value) => value + 1)}>
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  const cards = [
    { title: 'Total Products', value: formatNumber(data.counts.products), description: 'Active products', icon: CubeIcon, color: 'bg-blue-50 text-blue-600', to: '/products', permission: 'products:read' },
    { title: 'Total Categories', value: formatNumber(data.categoryStats?.total ?? data.counts.categories), description: `${formatNumber(data.categoryStats?.active ?? data.counts.categories)} active · ${formatNumber(data.categoryStats?.inactive)} inactive · ${formatNumber(data.categoryStats?.withProducts)} with products`, icon: TagIcon, color: 'bg-purple-50 text-purple-600', to: '/categories', permission: 'categories:read' },
    { title: 'Total Customers', value: formatNumber(data.counts.customers), description: 'Registered customers', icon: UsersIcon, color: 'bg-cyan-50 text-cyan-600', to: '/customers', permission: 'customers:read' },
    { title: 'Total Suppliers', value: formatNumber(data.counts.suppliers), description: 'Active suppliers', icon: TruckIcon, color: 'bg-orange-50 text-orange-600', to: '/suppliers', permission: 'suppliers:read' },
    { title: "Today's Sales", value: formatCurrency(data.today.sales), description: 'Completed sales today', icon: BanknotesIcon, color: 'bg-green-50 text-green-600', to: '/sales', permission: 'sales:read' },
    { title: "Today's Orders", value: formatNumber(data.today.salesCount), description: 'Sales transactions today', icon: ShoppingCartIcon, color: 'bg-indigo-50 text-indigo-600', to: '/sales', permission: 'sales:read' },
    { title: 'Total Purchases', value: formatCurrency(data.periodPurchases.amount), description: data.period.label, icon: ShoppingBagIcon, color: 'bg-amber-50 text-amber-600', to: '/purchases', permission: 'purchases:read' },
    { title: 'Low Stock Products', value: formatNumber(data.counts.lowStock), description: 'At or below minimum stock', icon: ExclamationTriangleIcon, color: 'bg-red-50 text-red-600', to: '/products', permission: 'products:read' },
  ].filter((card) => hasPermission(card.permission));

  const quickActions = [
    { label: 'Add Product', to: '/products/new', permission: 'products:create', icon: CubeIcon },
    { label: 'Add Customer', to: '/customers/new', permission: 'customers:create', icon: UsersIcon },
    { label: 'Add Supplier', to: '/suppliers/new', permission: 'suppliers:create', icon: TruckIcon },
    { label: 'Create Sale', to: '/sales/new', permission: 'sales:create', icon: ShoppingCartIcon },
    { label: 'Create Purchase', to: '/purchases/new', permission: 'purchases:create', icon: ShoppingBagIcon },
    { label: 'View Inventory', to: '/inventory', permission: 'inventory:read', icon: ArchiveBoxIcon },
    { label: 'Generate Report', to: '/reports', permission: 'reports:read', icon: ChartBarIcon },
  ].filter((action) => hasPermission(action.permission));

  const salesSeries = period === 7 ? data.salesLast7Days : data.salesLast30Days;
  const hasSales = salesSeries.some((day) => day.revenue > 0);
  const hasComparison = data.salesVsPurchases.some((day) => day.sales > 0 || day.purchases > 0);
  const saleStatusColor = { completed: 'badge-green', cancelled: 'badge-red', refunded: 'badge-yellow', pending: 'badge-blue' };
  const purchaseStatusColor = { received: 'badge-green', cancelled: 'badge-red', partial: 'badge-yellow', pending: 'badge-blue' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here is your shop's latest activity.
          </p>
        </div>
        <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {cards.length > 0 && (
        <section aria-label="Business summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <StatCard key={card.title} {...card} />)}
        </section>
      )}

      {quickActions.length > 0 && (
        <section className="card">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Jump straight to a common task.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-4 text-center text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasPermission('sales:read') && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Sales revenue</h2>
                <p className="mt-1 text-sm text-slate-500">Completed sales by day</p>
              </div>
              <div className="flex rounded-lg bg-slate-100 p-1" aria-label="Sales chart range">
                {[7, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    aria-pressed={period === days}
                    onClick={() => setPeriod(days)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${period === days ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
            {hasSales ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tickFormatter={(value) => `₹${formatNumber(value)}`} tickLine={false} axisLine={false} width={84} />
                    <Tooltip labelFormatter={formatChartDate} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#salesRevenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState>No completed sales in this period yet.</EmptyState>}
          </div>

          {hasPermission('purchases:read') && (
            <div className="card min-w-0">
              <div className="mb-5">
                <h2 className="font-semibold text-slate-800">Sales vs purchases</h2>
                <p className="mt-1 text-sm text-slate-500">Daily totals for {data.period.label.toLowerCase()}</p>
              </div>
              {hasComparison ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salesVsPurchases} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis tickFormatter={(value) => `₹${formatNumber(value)}`} tickLine={false} axisLine={false} width={84} />
                      <Tooltip labelFormatter={formatChartDate} formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="purchases" name="Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState>No sales or purchases in this period yet.</EmptyState>}
            </div>
          )}
        </section>
      )}

      {hasPermission('sales:read') && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="card min-w-0 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Recent sales</h2>
                <p className="mt-1 text-sm text-slate-500">Latest completed transactions</p>
              </div>
              <Link to="/sales" className="shrink-0 text-sm font-medium text-primary-600 hover:underline">View all</Link>
            </div>
            {data.recentSales.length > 0 ? (
              <div className="table-wrapper border-0">
                <table className="table">
                  <thead><tr><th>Sale</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th /></tr></thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.recentSales.map((sale) => (
                      <tr key={sale._id}>
                        <td className="font-medium">{sale.saleNumber || sale._id}</td>
                        <td>{sale.customer?.name ?? 'Walk-in'}</td>
                        <td>{formatDate(sale.saleDate)}</td>
                        <td className="font-medium">{formatCurrency(sale.totalAmount)}</td>
                        <td><span className={saleStatusColor[sale.status] || 'badge-gray'}>{sale.status}</span></td>
                        <td><Link to={`/sales/${sale._id}`} className="font-medium text-primary-600 hover:underline">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState>No sales transactions yet.</EmptyState>}
          </div>

          {hasPermission('products:read') && (
            <div className="card min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">Best-selling products</h2>
                  <p className="mt-1 text-sm text-slate-500">By quantity · last 30 days</p>
                </div>
                <Link to="/products" aria-label="View products" className="text-primary-600 hover:text-primary-700">
                  <CubeIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
              {data.bestSellingProducts.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bestSellingProducts} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="productName" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [formatNumber(value), 'Units sold']} />
                      <Bar dataKey="totalQty" name="Quantity sold" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState>No product sales in this period yet.</EmptyState>}
            </div>
          )}
        </section>
      )}

      {(hasPermission('products:read') || hasPermission('purchases:read')) && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {hasPermission('products:read') && (
            <div className="card min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">Low stock alerts</h2>
                  <p className="mt-1 text-sm text-slate-500">Products at or below their minimum stock</p>
                </div>
                <Link to={hasPermission('inventory:read') ? '/inventory' : '/products'} className="shrink-0 text-sm font-medium text-primary-600 hover:underline">
                  {hasPermission('inventory:read') ? 'Inventory' : 'Products'}
                </Link>
              </div>
              {data.lowStockProducts.length > 0 ? (
                <div className="table-wrapper border-0">
                  <table className="table">
                    <thead><tr><th>Product</th><th>SKU</th><th>Available</th><th>Minimum</th><th>Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.lowStockProducts.slice(0, 8).map((product) => (
                        <tr key={product._id}>
                          <td className="font-medium">
                            <Link to="/products" className="text-primary-700 hover:underline">{product.name}</Link>
                          </td>
                          <td className="font-mono text-xs text-slate-500">{product.sku}</td>
                          <td className="font-semibold text-red-600">{formatNumber(product.stock)} {product.unit}</td>
                          <td>{formatNumber(product.lowStockThreshold)} {product.unit}</td>
                          <td><span className="badge-red">Restock</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState>All active products are stocked above their minimum levels.</EmptyState>}
            </div>
          )}

          {hasPermission('purchases:read') && (
            <div className="card min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">Recent purchases</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest purchase transactions</p>
                </div>
                <Link to="/purchases" className="shrink-0 text-sm font-medium text-primary-600 hover:underline">View all</Link>
              </div>
              {data.recentPurchases.length > 0 ? (
                <div className="table-wrapper border-0">
                  <table className="table">
                    <thead><tr><th>Purchase</th><th>Supplier</th><th>Date</th><th>Total</th><th>Status</th><th /></tr></thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.recentPurchases.map((purchase) => (
                        <tr key={purchase._id}>
                          <td className="font-medium">{purchase.purchaseNumber || purchase._id}</td>
                          <td>{purchase.supplier?.name ?? 'Unknown supplier'}</td>
                          <td>{formatDate(purchase.purchaseDate)}</td>
                          <td className="font-medium">{formatCurrency(purchase.totalAmount)}</td>
                          <td><span className={purchaseStatusColor[purchase.status] || 'badge-gray'}>{purchase.status}</span></td>
                          <td><Link to={`/purchases/${purchase._id}`} className="font-medium text-primary-600 hover:underline">View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState>No purchase transactions yet.</EmptyState>}
            </div>
          )}
        </section>
      )}

      {hasPermission('dashboard:read') && cards.length === 0 && quickActions.length === 0 && (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <BuildingStorefrontIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          Your role does not currently have access to dashboard modules.
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
