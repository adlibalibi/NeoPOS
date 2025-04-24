'use client';

import { useState, useEffect } from 'react';
import { MoreVertical, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

type InventoryItem = {
  user_id: string;
  name: string;
  price: number;
  stock: number;
};

export default function Inventory() {
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: '', name: '', price: '', stock: '' });
  const [formErrors, setFormErrors] = useState({ id: '', name: '', price: '', stock: '' });
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID and fetch inventory when component mounts
  useEffect(() => {
    // Get the user ID from localStorage that was saved during login
    const storedUserId = localStorage.getItem('user_id');
    
    if (storedUserId) {
      setUserId(storedUserId);
      fetchInventory(storedUserId);
    } else {
      setError("User not logged in. Please log in to view your inventory.");
      setLoading(false);
    }
  }, []);

  const fetchInventory = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5050/inventory/all?user_id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventory');
      }
      
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      id: '',
      name: '',
      price: '',
      stock: ''
    };
    
    let isValid = true;
    
    if (!editingId && !form.id.trim()) {
      errors.id = 'ID is required';
      isValid = false;
    }
    
    if (!form.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    if (!form.price.trim() || isNaN(Number(form.price))) {
      errors.price = 'Valid price is required';
      isValid = false;
    }
    
    if (!form.stock.trim() || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      errors.stock = 'Valid stock quantity is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleAddOrUpdate = async () => {
    if (!validateForm()) return;
    if (!userId) {
      setError('User not logged in. Please log in to add items.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = editingId
        ? `http://localhost:5050/inventory/update/${editingId}`
        : `http://localhost:5050/inventory/add`;

      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        id: editingId || form.id, // Use existing ID when editing
        name: form.name,
        price: parseInt(form.price), // Storing price in cents
        stock: parseInt(form.stock),
        user_id: userId,
      };

      console.log(`Making ${method} request to ${url} with payload:`, payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to ${editingId ? 'update' : 'add'} item`);
      }

      setDialogOpen(false);
      setForm({ id: '', name: '', price: '', stock: '' });
      setEditingId(null);
      await fetchInventory(userId);
    } catch (err) {
      console.error('Add/Update error:', err);
      setError(err instanceof Error ? err.message : `Failed to ${editingId ? 'update' : 'add'} item`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) {
      setError('User not logged in. Please log in to delete items.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Deleting item ${id} for user ${userId}`);
      
      const response = await fetch(`http://localhost:5050/inventory/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete item');
      }
      
      await fetchInventory(userId);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id: string) => {
    const item = inventory[id];
    setEditingId(id);
    setForm({
      id,
      name: item.name,
      price: item.price.toString(),
      stock: item.stock.toString(),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ id: '', name: '', price: '', stock: '' });
    setFormErrors({ id: '', name: '', price: '', stock: '' });
  };

  if (loading && Object.keys(inventory).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary mr-2" />
        <span>Loading inventory...</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'User not logged in. Please log in to view your inventory.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Inventory Management</h2>
          <Dialog open={dialogOpen} onOpenChange={closeDialog}>
            <DialogTrigger asChild>
              <Button className="flex gap-2 items-center">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Update Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingId && (
                  <div>
                    <Label>Item ID</Label>
                    <Input
                      value={form.id}
                      onChange={(e) => setForm({ ...form, id: e.target.value })}
                      className={formErrors.id ? "border-red-500" : ""}
                      placeholder="Enter a unique ID for this item"
                    />
                    {formErrors.id && <p className="text-red-500 text-sm mt-1">{formErrors.id}</p>}
                  </div>
                )}
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={formErrors.name ? "border-red-500" : ""}
                    placeholder="Item name"
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <Label>Price (in cents)</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={formErrors.price ? "border-red-500" : ""}
                    placeholder="Price in cents (e.g. 1099 for $10.99)"
                  />
                  {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className={formErrors.stock ? "border-red-500" : ""}
                    placeholder="Number of items in stock"
                  />
                  {formErrors.stock && <p className="text-red-500 text-sm mt-1">{formErrors.stock}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleAddOrUpdate} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  {editingId ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inventory).map(([id, item]) => (
                <tr key={id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{id}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">${(item.price / 100).toFixed(2)}</td>
                  <td className="p-3">{item.stock}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => startEdit(id)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(id)} className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {Object.keys(inventory).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No items in inventory. Click "Add Item" to add your first item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}