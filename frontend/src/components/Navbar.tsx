
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow rounded-lg px-2 py-1"
              onClick={() => navigate('/')}>
              <ShoppingCart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">NeoPOS</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/inventory')}
                  className="text-gray-600 hover:text-primary"
                >
                  Inventory
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-primary"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="text-gray-600 hover:text-primary"
                >
                  Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-primary hover:bg-primary hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-primary"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-primary text-white hover:bg-primary-dark"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
