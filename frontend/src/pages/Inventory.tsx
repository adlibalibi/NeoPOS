import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import InventoryTable from "@/components/inventory/InventoryTable";
import AddEditItemDialog from "@/components/inventory/AddEditItemDialog";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/inventory/all');
      const data = await response.json();
      const formattedItems = Object.entries(data).map(([id, details]: [string, any]) => ({
        id,
        ...details,
      }));
      setItems(formattedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/inventory/delete/${id}`, {
        method: 'DELETE',
      });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      fetchInventory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1A1F2C]">Inventory Management</h1>
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        <Card className="p-6">
          <InventoryTable
            items={items}
            onEdit={(item) => {
              setEditingItem(item);
              setIsDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        </Card>

        <AddEditItemDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          item={editingItem}
          onSuccess={() => {
            setIsDialogOpen(false);
            fetchInventory();
          }}
        />
      </div>
    </div>
  );
};

export default Inventory;