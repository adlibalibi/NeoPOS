import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionItem = {
  itemId?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

type Transaction = {
  id: string;
  provider?: string;
  paymentStatus?: string;
  currency?: string;
  amountTotal?: number; // minor units (paise)
  createdAt?: { toDate?: () => Date };
  items?: TransactionItem[];
};

const formatINR = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Transactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const txRef = collection(db, "users", user.uid, "transactions");
        const q = query(txRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }));
        setTransactions(rows);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const orders = transactions.length;
    const revenue = transactions.reduce((sum, t) => sum + Number(t.amountTotal ?? 0), 0) / 100;
    return { orders, revenue };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
            <p className="text-gray-600 mt-1">Your sales history and receipts.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">{summary.orders} orders</div>
            <div className="text-xl font-semibold text-gray-800">{formatINR(summary.revenue)}</div>
          </div>
        </div>

        {loading ? (
          <Card className="bg-white">
            <CardContent className="py-10 text-center text-gray-600">Loading transactions…</CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-10 text-center text-gray-600">
              No transactions yet. Complete a checkout to see receipts here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((t) => {
              const created = t.createdAt?.toDate?.();
              const total = Number(t.amountTotal ?? 0) / 100;
              return (
                <Card key={t.id} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
                      <span className="text-gray-800">
                        {created ? created.toLocaleString() : "Pending timestamp"}
                      </span>
                      <span className="font-semibold text-gray-900">{formatINR(total)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1 mb-3">
                      <span>Provider: {t.provider ?? "—"}</span>
                      <span>Status: {t.paymentStatus ?? "—"}</span>
                      <span>Currency: {(t.currency ?? "INR").toUpperCase()}</span>
                      <span>ID: {t.id}</span>
                    </div>

                    {t.items && t.items.length > 0 ? (
                      <div className="divide-y rounded-lg border border-gray-100">
                        {t.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 truncate">
                                {it.name ?? it.itemId ?? "Item"}
                              </div>
                              <div className="text-sm text-gray-600">
                                Qty {it.quantity ?? 0} · Unit ₹{Number(it.unitPrice ?? 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="font-semibold text-gray-900">
                              {formatINR(Number(it.lineTotal ?? 0))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">No line items recorded.</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;

