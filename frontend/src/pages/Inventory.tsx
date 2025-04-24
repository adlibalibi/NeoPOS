import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc
} from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { Plus, Trash2, Pencil, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Importing Navbar from components
import Navbar from "@/components/Navbar"; 

const Inventory = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", stock: "" });
  const [editItem, setEditItem] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchInventory(currentUser.uid);
      } else {
        setItems([]);
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const showStatus = (message, isError = false) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const fetchInventory = async (userId) => {
    try {
      const inventoryRef = collection(db, "users", userId, "inventory");
      
      // Create a real-time listener for inventory changes
      const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
        const inventoryItems = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setItems(inventoryItems);
      }, (error) => {
        console.error("Error fetching inventory:", error);
        showStatus("Failed to fetch inventory items.", true);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up inventory listener:", error);
      showStatus("Failed to connect to database.", true);
    }
  };

  const handleAddItem = async () => {
    if (!user) {
      showStatus("You must be logged in to add items.", true);
      return;
    }
    
    if (!newItem.name || !newItem.price || !newItem.stock) {
      showStatus("Please fill in all fields.", true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Ensure user document exists first
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { email: user.email }, { merge: true });
      
      // Add the inventory item
      const inventoryRef = collection(db, "users", user.uid, "inventory");
      await addDoc(inventoryRef, {
        name: newItem.name,
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      showStatus("Item added successfully!");
      setNewItem({ name: "", price: "", stock: "" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding item:", error);
      showStatus("Failed to add item. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!user || !editItem) return;
    
    setIsLoading(true);
    try {
      const itemRef = doc(db, "users", user.uid, "inventory", editItem.id);
      await updateDoc(itemRef, {
        name: editItem.name,
        price: parseFloat(editItem.price),
        stock: parseInt(editItem.stock),
        updatedAt: new Date()
      });
      
      showStatus("Item updated successfully!");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating item:", error);
      showStatus("Failed to update item. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "inventory", id));
      showStatus("Item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      showStatus("Failed to delete item. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Using the Navbar component here */}
      <Navbar />
      
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Item Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Stock Quantity"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                />
                <Button 
                  onClick={handleAddItem} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status message display */}
        {statusMessage && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
            {statusMessage}
          </div>
        )}

        {/* Edit item dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Item Name"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Stock Quantity"
                  value={editItem.stock}
                  onChange={(e) => setEditItem({ ...editItem, stock: e.target.value })}
                />
                <Button 
                  onClick={handleUpdateItem} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {user ? (
          items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(item)}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <p>No items found in your inventory.</p>
            </div>
          )
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <p>Please log in to manage your inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
