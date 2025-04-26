import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

const Checkout = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedItem = inventory.find(item => item.id === selectedItemId);

  useEffect(() => {
    const fetchInventory = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const inventoryRef = collection(db, "users", user.uid, "inventory");
      const snapshot = await getDocs(inventoryRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
    };
    fetchInventory();
  }, []);

  const handleCheckout = async () => {
    if (!selectedItem) return;
    const res = await fetch("https://neopos-1.onrender.com/payment/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: selectedItem.name,
        amount: Math.round(Number(selectedItem.price) * 100),
        quantity,
        item_id: selectedItem.id,
        user_id: auth.currentUser?.uid,
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
            </div>
          )}

          <button
            onClick={handleCheckout}
            className={`w-full py-3 text-white text-lg font-semibold rounded-xl transition ${
              selectedItem
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={!selectedItem}
          >
            Pay ₹{selectedItem ? selectedItem.price * quantity : 0}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
