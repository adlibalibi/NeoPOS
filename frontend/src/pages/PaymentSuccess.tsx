import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Payment successful');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#9b87f5] rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1F2C] mb-4">Payment Successful!</h1>
            <p className="text-center text-gray-600 mb-6">
              Thank you for your purchase. Your transaction has been completed successfully.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
