'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Lead Pipeline Chart
function LeadPipelineChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Lead Pipeline</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Lead Sources Pie Chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function LeadSourcesChart({ data }: { data: any[] }) {
  const renderLabel = (entry: any) => {
    const percent = entry.percent || 0;
    return `${entry.name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Lead Sources</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Revenue Over Time
function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Services Distribution
function ServicesChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Services Breakdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="service" width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Metric Card
function MetricCard({ title, value, change, changeType }: { title: string, value: string, change: string, changeType: 'up' | 'down' }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalLeads: 47,
        activeClients: 23,
        monthlyRevenue: 8750,
        conversionRate: 68,
      });
      setLoading(false);
    }, 500);
  }, []);

  const leadPipelineData = [
    { status: 'New', count: 12 },
    { status: 'Contacted', count: 8 },
    { status: 'Qualified', count: 5 },
    { status: 'Proposal', count: 3 },
    { status: 'Won', count: 7 },
  ];

  const leadSourcesData = [
    { name: 'Referral', value: 35 },
    { name: 'Website', value: 25 },
    { name: 'Social', value: 20 },
    { name: 'Partner', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 5500 },
    { month: 'Jun', revenue: 7200 },
  ];

  const servicesData = [
    { service: 'Tax Prep', count: 24 },
    { service: 'Bookkeeping', count: 18 },
    { service: 'Payroll', count: 15 },
    { service: 'Insurance', count: 12 },
    { service: 'Automation', count: 8 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={stats?.totalLeads?.toString() || '0'}
          change="+12% from last month"
          changeType="up"
        />
        <MetricCard
          title="Active Clients"
          value={stats?.activeClients?.toString() || '0'}
          change="+5% from last month"
          changeType="up"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          change="+8% from last month"
          changeType="up"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats?.conversionRate || 0}%`}
          change="-2% from last month"
          changeType="down"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadPipelineChart data={leadPipelineData} />
        <LeadSourcesChart data={leadSourcesData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <ServicesChart data={servicesData} />
      </div>
    </div>
  );
}
