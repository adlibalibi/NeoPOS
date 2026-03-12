import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type CartLine = {
  itemId: string;
  name: string;
  price: number;
  maxStock: number;
  quantity: number;
};

const Checkout = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);

  const selectedItem = inventory.find(item => item.id === selectedItemId);

  useEffect(() => {
    const fetchInventory = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const inventoryRef = collection(db, "users", user.uid, "inventory");
      const snapshot = await getDocs(inventoryRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items as InventoryItem[]);
    };
    fetchInventory();
  }, []);

  const addToCart = () => {
    if (!selectedItem) return;
    const addQty = Math.max(1, quantity);
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === selectedItem.id);
      if (!existing) {
        return [
          ...prev,
          {
            itemId: selectedItem.id,
            name: selectedItem.name,
            price: Number(selectedItem.price),
            maxStock: Number(selectedItem.stock),
            quantity: Math.min(addQty, Number(selectedItem.stock)),
          },
        ];
      }
      return prev.map((l) =>
        l.itemId === selectedItem.id
          ? { ...l, quantity: Math.min(l.quantity + addQty, l.maxStock) }
          : l
      );
    });
  };

  const updateQty = (itemId: string, nextQty: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.itemId === itemId ? { ...l, quantity: Math.max(1, Math.min(nextQty, l.maxStock)) } : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (itemId: string) => {
    setCart((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const cartTotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const res = await fetch("https://neopos-1.onrender.com/payment/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: auth.currentUser?.uid,
        items: cart.map((l) => ({ item_id: l.itemId, quantity: l.quantity })),
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center mt-24 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Checkout</h2>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Choose an item --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - ₹{item.price} ({item.stock} in stock)
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedItem.stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={addToCart}
                className="mt-3 w-full py-3 bg-white border border-gray-200 text-gray-800 text-lg font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Add to Cart
              </button>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Cart</h3>
            {cart.length === 0 ? (
              <div className="text-gray-600 text-sm">No items in cart.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((l) => (
                  <div key={l.itemId} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">{l.name}</div>
                      <div className="text-sm text-gray-600">₹{l.price} · max {l.maxStock}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={l.maxStock}
                        value={l.quantity}
                        onChange={(e) => updateQty(l.itemId, Number(e.target.value))}
                        className="w-20 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        onClick={() => removeLine(l.itemId)}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-gray-700 font-medium">Total</div>
                  <div className="text-gray-900 font-bold">₹{cartTotal.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            className={`w-full py-3 text-white text-lg font-semibold rounded-xl transition ${
              cart.length > 0
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={cart.length === 0}
          >
            Pay ₹{cartTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
