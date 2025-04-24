'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const Checkout = () => {
  const [productName, setProductName] = useState("Test Product");
  const [amount, setAmount] = useState("");  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const amountInCents = Math.round(Number(amount) * 100);  
    if (isNaN(amountInCents) || amountInCents <= 0) {
      alert("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://neopos-1.onrender.com/payment/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_name: productName,
          amount: amountInCents,  
          quantity: quantity
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);  

      if (data.url) {
        window.location.href = data.url;  
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product Name"
              />
            </div>
            <div>
              <Label>Amount (in dollars)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Amount in dollars"
              />
              {amount && (
                <p className="text-sm text-muted-foreground mt-1">${(Number(amount) || 0).toFixed(2)}</p>
              )}
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Quantity"
              />
            </div>
            <Button onClick={handleCheckout} disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" /> Processing...
                </span>
              ) : (
                "Proceed to Pay"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
