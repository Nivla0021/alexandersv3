'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Download,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SaleItem {
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  total: number;
}

interface CategorySale {
  category: string;
  quantity: number;
  total: number;
}

interface Statistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalItemsSold: number;
  codOrders: number;
  gcashOrders: number;
}

interface SalesData {
  products: SaleItem[];
  categories: CategorySale[];
  statistics: Statistics;
}

export default function SalesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesData>({
    products: [],
    categories: [],
    statistics: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItemsSold: 0,
      codOrders: 0,
      gcashOrders: 0,
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const res = await fetch(`/api/admin/sales?${params.toString()}`);
      if (res.ok) {
        const salesData = await res.json();
        setData(salesData);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default = today
    const today = new Date().toISOString().slice(0, 10);
    setFrom(today);
    setTo(today);
  }, []);

  useEffect(() => {
    if (from && to && status === 'authenticated') {
      fetchSales();
    }
  }, [from, to, status]);

  const setDateRange = (range: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    let startDate: string;

    switch (range) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().slice(0, 10);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().slice(0, 10);
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        startDate = yearAgo.toISOString().slice(0, 10);
        break;
    }

    setFrom(startDate);
    setTo(endDate);
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Category', 'Quantity Sold', 'Total Revenue'];
    const rows = data.products.map((item) => [
      item.productName,
      item.category || 'N/A',
      item.quantity.toString(),
      item.total.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'Summary',
      `Total Orders,${data.statistics.totalOrders}`,
      `Total Revenue,₱${data.statistics.totalRevenue.toFixed(2)}`,
      `Average Order Value,₱${data.statistics.averageOrderValue.toFixed(2)}`,
      `Total Items Sold,${data.statistics.totalItemsSold}`,
      `COD Orders,${data.statistics.codOrders}`,
      `GCash Orders,${data.statistics.gcashOrders}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${from}-to-${to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const bestSellers = [...data.products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // Chart data for category breakdown
  const categoryChartData = {
    labels: data.categories.map((c) => c.category),
    datasets: [
      {
        label: 'Revenue by Category',
        data: data.categories.map((c) => c.total),
        backgroundColor: [
          'rgba(217, 119, 6, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(252, 211, 77, 0.8)',
          'rgba(254, 243, 199, 0.8)',
        ],
        borderColor: [
          'rgba(217, 119, 6, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(252, 211, 77, 1)',
          'rgba(254, 243, 199, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for top products
  const productsChartData = {
    labels: bestSellers.map((p) => p.productName),
    datasets: [
      {
        label: 'Quantity Sold',
        data: bestSellers.map((p) => p.quantity),
        backgroundColor: 'rgba(217, 119, 6, 0.8)',
        borderColor: 'rgba(217, 119, 6, 1)',
        borderWidth: 2,
      },
      {
        label: 'Revenue (₱)',
        data: bestSellers.map((p) => p.total),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-amber-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/dashboard')}
                className="hover:bg-amber-100"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-amber-900">Sales Reports & Analytics</h1>
                <p className="text-sm text-gray-600">Track your business performance</p>
              </div>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={data.products.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Date Range Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>
          </div>

          {/* Quick Date Selectors */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDateRange('today')}
              className="border-amber-300 hover:bg-amber-50"
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setDateRange('week')}
              className="border-amber-300 hover:bg-amber-50"
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              onClick={() => setDateRange('month')}
              className="border-amber-300 hover:bg-amber-50"
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              onClick={() => setDateRange('year')}
              className="border-amber-300 hover:bg-amber-50"
            >
              Last Year
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Revenue</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              ₱{data.statistics.totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm text-amber-100">Total Revenue</p>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Orders</span>
            </div>
            <p className="text-3xl font-bold mb-1">{data.statistics.totalOrders}</p>
            <p className="text-sm text-orange-100">Total Orders</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Average</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              ₱{data.statistics.averageOrderValue.toFixed(2)}
            </p>
            <p className="text-sm text-yellow-100">Avg Order Value</p>
          </div>

          {/* Total Items Sold */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-amber-600" />
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Items
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-900 mb-1">
              {data.statistics.totalItemsSold}
            </p>
            <p className="text-sm text-gray-600">Items Sold</p>
          </div>

          {/* COD Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💵</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                COD
              </span>
            </div>
            <p className="text-3xl font-bold text-green-700 mb-1">
              {data.statistics.codOrders}
            </p>
            <p className="text-sm text-gray-600">Cash on Delivery</p>
          </div>

          {/* GCash Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💳</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                GCash
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-700 mb-1">
              {data.statistics.gcashOrders}
            </p>
            <p className="text-sm text-gray-600">GCash Payments</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl text-amber-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Revenue by Category
            </h2>
            {data.categories.length > 0 ? (
              <div className="h-64">
                <Pie data={categoryChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Top Products Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl text-amber-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top 5 Products
            </h2>
            {bestSellers.length > 0 ? (
              <div className="h-64">
                <Bar data={productsChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Best Sellers List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-xl text-amber-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Performing Products
          </h2>
          {bestSellers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No products sold in this period</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((product, index) => {
                const maxQuantity = Math.max(...bestSellers.map((p) => p.quantity));
                const percentage = (product.quantity / maxQuantity) * 100;

                return (
                  <div key={product.productId} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold ${
                            index === 0
                              ? 'text-amber-600'
                              : index === 1
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{product.productName}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-700">{product.quantity} sold</p>
                        <p className="text-sm text-gray-600">₱{product.total.toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0
                            ? 'bg-amber-500'
                            : index === 1
                            ? 'bg-orange-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Sales Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b-2 border-amber-200">
            <h2 className="font-bold text-xl text-amber-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detailed Product Sales
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                      </div>
                    </td>
                  </tr>
                ) : data.products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No sales data available for the selected period
                    </td>
                  </tr>
                ) : (
                  data.products.map((item, index) => (
                    <tr
                      key={item.productId}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                          {item.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-amber-700">
                          ₱{item.total.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.products.length > 0 && (
                <tfoot className="bg-amber-200">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 font-bold text-amber-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-amber-900">
                      {data.statistics.totalItemsSold}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-900">
                      ₱{data.statistics.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
