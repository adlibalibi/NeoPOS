'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type InventoryItem = {
  name: string;
  price: number;
  stock: number;
};

export default function Inventory() {
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({ id: '', name: '', price: '', stock: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/inventory/all');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: newItem.id,
          name: newItem.name,
          price: parseInt(newItem.price),
          stock: parseInt(newItem.stock)
        })
      });

      if (response.ok) {
        await fetchInventory();
        setNewItem({ id: '', name: '', price: '', stock: '' });
      } else {
        alert('Failed to add item.');
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Product ID" value={newItem.id} onChange={(e) => setNewItem({ ...newItem, id: e.target.value })} />
            <Input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <Input placeholder="Price (in cents)" type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
            <Input placeholder="Stock" type="number" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })} />
            <Button onClick={handleAddItem} disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add Item'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(inventory).map(([id, item]) => (
              <div key={id} className="border p-4 rounded shadow">
                <p><strong>ID:</strong> {id}</p>
                <p><strong>Name:</strong> {item.name}</p>
                <p><strong>Price:</strong> ${(item.price / 100).toFixed(2)}</p>
                <p><strong>Stock:</strong> {item.stock}</p>
              </div>
            ))}
            {Object.keys(inventory).length === 0 && <p className="text-muted">No items in inventory.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
