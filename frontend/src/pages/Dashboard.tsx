import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { PlusCircle, ShoppingCart, DollarSign, BarChart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price: number;
}

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalStock: 0,
    totalValue: 0
  });
  const [chartData, setChartData] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchInventoryStats(currentUser.uid);
      } else {
        setUser(null);
        setInventoryStats({
          totalItems: 0,
          totalStock: 0,
          totalValue: 0
        });
        setChartData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchInventoryStats = async (userId: string) => {
    try {
      const inventoryRef = collection(db, "users", userId, "inventory");
      const inventorySnap = await getDocs(inventoryRef);

      let totalItems = 0;
      let totalStock = 0;
      let totalValue = 0;
      const chartList: InventoryItem[] = [];

      inventorySnap.forEach((doc) => {
        const data = doc.data() as DocumentData;
        totalItems++;
        totalStock += data.stock;
        totalValue += data.stock * data.price;
        chartList.push({
          id: doc.id,
          name: data.name,
          stock: data.stock,
          price: data.price
        });
      });

      setInventoryStats({ totalItems, totalStock, totalValue });
      setChartData(chartList);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  const handleReportDownload = () => {
    if (chartData.length === 0) return;

    const csvRows = [
      ["Item Name", "Stock", "Price", "Total Value"],
      ...chartData.map((item) => [
        item.name,
        item.stock,
        item.price,
        item.stock * item.price
      ])
    ];

    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_report.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleReportDownload}
              className="bg-white hover:bg-gray-100 border border-gray-200 shadow-sm transition-all"
            >
              <BarChart className="w-4 h-4 mr-2 text-blue-600" /> Export Report
            </Button>
            <Link to="/checkout">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
                <CreditCard className="w-4 h-4 mr-2" /> Payments
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle className="text-green-900">Total Items</CardTitle>
              <CardDescription className="text-green-700">The total number of items in your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-5xl font-bold text-green-800">{inventoryStats.totalItems}</div>
                <div className="p-3 bg-green-100 rounded-full">
                  <PlusCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle className="text-amber-900">Total Stock</CardTitle>
              <CardDescription className="text-amber-700">Total quantity across all items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-5xl font-bold text-amber-800">{inventoryStats.totalStock}</div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <ShoppingCart className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle className="text-blue-900">Total Value</CardTitle>
              <CardDescription className="text-blue-700">Value of all inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-5xl font-bold text-blue-800">₹{inventoryStats.totalValue.toFixed(2)}</div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/*Chart*/}
        <Card className="border shadow-lg bg-white mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Inventory Stock Levels</CardTitle>
            <CardDescription className="text-gray-600">Track how much stock is available for each item</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-x-auto">
              <div className="min-w-full" style={{ minWidth: Math.max(chartData.length * 100, 1000) + 'px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#666', fontSize: 14 }}
                      tickLine={{ stroke: '#ccc' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 14 }}
                      tickLine={{ stroke: '#ccc' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }} 
                      labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="stock" 
                      name="Stock Quantity"
                      stroke="url(#stockGradient)" 
                      strokeWidth={3} 
                      dot={{ r: 6, stroke: '#8884d8', strokeWidth: 2, fill: 'white' }} 
                      activeDot={{ r: 8, stroke: '#8884d8', strokeWidth: 2, fill: '#8884d8' }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      name="Price (₹)"
                      stroke="url(#priceGradient)" 
                      strokeWidth={3} 
                      dot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2, fill: 'white' }} 
                      activeDot={{ r: 8, stroke: '#82ca9d', strokeWidth: 2, fill: '#82ca9d' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-center mt-4 text-gray-500 font-medium">
              <span>Scroll horizontally to view all items →</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel*/}
        <Card className="border shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">Perform common actions quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/inventory" className="w-full">
                <Button variant="outline" className="w-full h-20 px-2 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all">
                  <PlusCircle className="w-6 h-6 mb-1 text-indigo-600" />
                  <span className="text-sm font-medium">Add Item</span>
                </Button>
              </Link>
              <Link to="/inventory" className="w-full">
                <Button variant="outline" className="w-full h-20 px-2 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all">
                  <ShoppingCart className="w-6 h-6 mb-1 text-amber-600" />
                  <span className="text-sm font-medium">View Inventory</span>
                </Button>
              </Link>
              <Link to="/checkout" className="w-full">
                <Button variant="outline" className="w-full h-20 px-2 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all">
                  <CreditCard className="w-6 h-6 mb-1 text-blue-600" />
                  <span className="text-sm font-medium">Payments</span>
                </Button>
              </Link>
              <Button onClick={handleReportDownload} variant="outline" className="w-full h-20 px-2 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all">
                <BarChart className="w-6 h-6 mb-1 text-green-600" />
                <span className="text-sm font-medium">Download Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;