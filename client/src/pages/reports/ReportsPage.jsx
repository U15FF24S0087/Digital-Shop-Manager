import { useState } from 'react';
import { getSalesReport, getPurchasesReport, getProfitReport, getInventoryReport } from '../../services/reportService';
import useApi from '../../hooks/useApi';
import { PageSpinner } from '../../components/ui/Spinner';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const TABS = ['Sales', 'Purchases', 'Profit', 'Inventory'];

const ReportsPage = () => {
  const [tab,        setTab]        = useState('Sales');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [groupBy,    setGroupBy]    = useState('day');

  const params = { startDate: startDate || undefined, endDate: endDate || undefined, groupBy };

  const { data: salesData,     loading: l1 } = useApi(getSalesReport,     params, { deps: [tab === 'Sales',     JSON.stringify(params)], immediate: tab === 'Sales' });
  const { data: purchData,     loading: l2 } = useApi(getPurchasesReport, params, { deps: [tab === 'Purchases', JSON.stringify(params)], immediate: tab === 'Purchases' });
  const { data: profitData,    loading: l3 } = useApi(getProfitReport,    params, { deps: [tab === 'Profit',    JSON.stringify(params)], immediate: tab === 'Profit' });
  const { data: invData,       loading: l4 } = useApi(getInventoryReport, {},     { deps: [tab === 'Inventory'],                         immediate: tab === 'Inventory' });

  const loading = l1 || l2 || l3 || l4;

  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  const makeChart = (byPeriod, key, color) => ({
    labels: (byPeriod ?? []).map(d => d._id),
    datasets: [{ label: key, data: (byPeriod ?? []).map(d => d[key] ?? 0), backgroundColor: color, borderRadius: 4 }],
  });

  const StatRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div><label className="label">Start Date</label><input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div><label className="label">End Date</label><input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        {tab !== 'Inventory' && (
          <div><label className="label">Group By</label>
            <select className="input" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              {['day','week','month','year'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* Sales Report */}
          {tab === 'Sales' && salesData?.data && (() => { const d = salesData.data; return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card"><p className="text-xs text-slate-400 mb-1">Total Revenue</p><p className="text-xl font-bold">{fmt(d.summary.totalRevenue)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Total Sales</p><p className="text-xl font-bold">{d.summary.totalSales}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Avg Order</p><p className="text-xl font-bold">{fmt(d.summary.avgOrderValue)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Tax Collected</p><p className="text-xl font-bold">{fmt(d.summary.totalTax)}</p></div>
              </div>
              {d.byPeriod?.length > 0 && <div className="card"><h3 className="font-semibold mb-4">Revenue by Period</h3><Bar data={makeChart(d.byPeriod, 'revenue', 'rgba(37,99,235,0.7)')} options={chartOpts} height={80} /></div>}
              {d.topCustomers?.length > 0 && <div className="card"><h3 className="font-semibold mb-3">Top Customers</h3><div className="space-y-1">{d.topCustomers.map(c => <StatRow key={c._id} label={c.customerName ?? 'Unknown'} value={`${fmt(c.totalSpend)} · ${c.orderCount} orders`} />)}</div></div>}
            </div>
          ); })()}

          {/* Purchases Report */}
          {tab === 'Purchases' && purchData?.data && (() => { const d = purchData.data; return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="card"><p className="text-xs text-slate-400 mb-1">Total Cost</p><p className="text-xl font-bold">{fmt(d.summary.totalCost)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Total Orders</p><p className="text-xl font-bold">{d.summary.totalOrders}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Avg Order</p><p className="text-xl font-bold">{fmt(d.summary.avgOrderValue)}</p></div>
              </div>
              {d.byPeriod?.length > 0 && <div className="card"><h3 className="font-semibold mb-4">Cost by Period</h3><Bar data={makeChart(d.byPeriod, 'cost', 'rgba(245,158,11,0.7)')} options={chartOpts} height={80} /></div>}
              {d.topSuppliers?.length > 0 && <div className="card"><h3 className="font-semibold mb-3">Top Suppliers</h3><div className="space-y-1">{d.topSuppliers.map(s => <StatRow key={s._id} label={s.supplierName} value={`${fmt(s.totalSpend)} · ${s.orderCount} orders`} />)}</div></div>}
            </div>
          ); })()}

          {/* Profit Report */}
          {tab === 'Profit' && profitData?.data && (() => { const d = profitData.data; return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card"><p className="text-xs text-slate-400 mb-1">Revenue</p><p className="text-xl font-bold">{fmt(d.summary.totalRevenue)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">COGS</p><p className="text-xl font-bold">{fmt(d.summary.totalCost)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Gross Profit</p><p className="text-xl font-bold text-green-600">{fmt(d.summary.totalProfit)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Margin</p><p className="text-xl font-bold">{Number(d.summary.profitMargin ?? 0).toFixed(1)}%</p></div>
              </div>
              {d.byPeriod?.length > 0 && <div className="card"><h3 className="font-semibold mb-4">Profit by Period</h3><Bar data={makeChart(d.byPeriod, 'profit', 'rgba(34,197,94,0.7)')} options={chartOpts} height={80} /></div>}
              {d.byCategory?.length > 0 && <div className="card"><h3 className="font-semibold mb-3">Profit by Category</h3><div className="space-y-1">{d.byCategory.map(c => <StatRow key={c._id} label={c.categoryName ?? 'Unknown'} value={`${fmt(c.profit)} (${fmt(c.revenue)} rev)`} />)}</div></div>}
            </div>
          ); })()}

          {/* Inventory Report */}
          {tab === 'Inventory' && invData?.data && (() => { const d = invData.data; return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="card"><p className="text-xs text-slate-400 mb-1">Total Products</p><p className="text-xl font-bold">{d.summary.totalProducts}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Cost Value</p><p className="text-xl font-bold">{fmt(d.summary.totalCostValue)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Retail Value</p><p className="text-xl font-bold">{fmt(d.summary.totalSaleValue)}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Low Stock</p><p className="text-xl font-bold text-red-600">{d.summary.lowStockCount}</p></div>
                <div className="card"><p className="text-xs text-slate-400 mb-1">Out of Stock</p><p className="text-xl font-bold text-red-700">{d.summary.outOfStockCount}</p></div>
              </div>
              {d.byCategory?.length > 0 && <div className="card"><h3 className="font-semibold mb-3">By Category</h3><div className="space-y-1">{d.byCategory.map(c => <StatRow key={c._id} label={c.categoryName ?? 'Unknown'} value={`${c.totalStockQty} units · ${fmt(c.totalCostValue)}`} />)}</div></div>}
            </div>
          ); })()}
        </>
      )}
    </div>
  );
};
export default ReportsPage;
