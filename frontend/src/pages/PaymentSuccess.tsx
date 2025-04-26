import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Loader2 } from 'lucide-react'; // Spinner icon

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        console.error('No session ID found');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`https://neopos-1.onrender.com/payment/session/${sessionId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }
        console.log('Payment verified and stock updated');
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#9b87f5]" />
      </div>
    );
  }

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
