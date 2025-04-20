
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, TrendingUp, Users, DollarSign, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Dashboard = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    dailySales: 0,
    totalCustomers: 0,
    averageOrder: 0,
    revenue: 0
  });

  // Generate random transactions with INR
  const recentTransactions = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    customer: `Customer ${i + 1}`,
    amount: Math.floor(Math.random() * 100000) + 10000, // Larger numbers for INR
    status: Math.random() > 0.3 ? 'completed' : 'pending',
    date: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
  }));

  useEffect(() => {
    // Generate random sales data
    const data = Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      sales: Math.floor(Math.random() * 100000) + 50000 // Larger numbers for INR
    }));
    setSalesData(data);

    // Generate random metrics with INR values
    setMetrics({
      dailySales: Math.floor(Math.random() * 1000) + 500,
      totalCustomers: Math.floor(Math.random() * 1000) + 500,
      averageOrder: Math.floor(Math.random() * 20000) + 5000,
      revenue: Math.floor(Math.random() * 1000000) + 500000
    });
  }, []);

  const cards = [
    { title: 'Daily Sales', value: metrics.dailySales, icon: ShoppingCart, color: 'text-blue-600' },
    { title: 'Total Customers', value: metrics.totalCustomers, icon: Users, color: 'text-green-600' },
    { title: 'Average Order', value: `₹${metrics.averageOrder.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-yellow-600' },
    { title: 'Revenue', value: `₹${metrics.revenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Select defaultValue="current-week">
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-week">Apr 21 - Apr 27, 2025</SelectItem>
              <SelectItem value="prev-week">Apr 14 - Apr 20, 2025</SelectItem>
              <SelectItem value="two-weeks-ago">Apr 07 - Apr 13, 2025</SelectItem>
              <SelectItem value="three-weeks-ago">Mar 31 - Apr 06, 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`rounded-full p-3 ${card.color} bg-opacity-10 mr-4`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold">{card.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `₹${(value/1000)}K`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

