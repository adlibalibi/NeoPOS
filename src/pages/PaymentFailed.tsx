
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const PaymentFailed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // add error logging here but eh not rn
    console.log('Payment failed');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
              <X className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1F2C] mb-4">Payment Unsuccessful</h1>
            <p className="text-center text-gray-600 mb-6">
              Sorry, your payment could not be processed. Please try again or contact support.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/payment-portal')}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailed;