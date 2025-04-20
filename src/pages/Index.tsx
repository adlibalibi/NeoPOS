
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import { ShoppingCart, LineChart, ShieldCheck, CreditCard } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShoppingCart className="h-6 w-6 text-white" />,
      title: "Real-Time Inventory Tracking",
      description: "NeoPOS automatically updates stock levels with every transaction, helping businesses prevent overstocking or stockouts while keeping inventory accurate and up-to-date at all times."
    },
    {
      icon: <LineChart className="h-6 w-6 text-white" />,
      title: "Smart Sales Analytics Dashboard",
      description: "Track daily, weekly, and monthly performance using clear visualizations. NeoPOS can analyze large volumes of sales data quickly and accurately, offering valuable insights for better business decisions."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-white" />,
      title: "Role-Based Access Control",
      description: "NeoPOS ensures secure, organized access by assigning permissions based on user roles—Admin, Staff, or Customer—protecting sensitive data and simplifying team operations."
    },
    {
      icon: <CreditCard className="h-6 w-6 text-white" />,
      title: "Integrated Payment Options",
      description: "Accept multiple payment modes including UPI, cards, and cash—offering customers flexibility and faster checkout while keeping all transaction records synced in one system."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Empowering Your Every</span>
              <span className="block text-primary">New Business with NeoPOS</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Streamline your operations with NeoPOS - the smart choice for small businesses.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              NeoPOS Features
            </h2>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="pt-6 transition-transform duration-300 hover:-translate-y-2">
                  <div className="flow-root bg-primary-light rounded-lg px-6 pb-8 h-full">
                    <div className="-mt-6">
                      <div className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                        {feature.icon}
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-5 text-base text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
