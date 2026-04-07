"use client";

import { useState } from "react";
import CustomerTripTracking from "@/components/liftngo/CustomerTripTracking";
import { useCustomerSocket } from "@/hooks/useCustomerSocket";
import { useSocket } from "@/hooks/useSocket";

/**
 * Demo: set customer id below. Backend: `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:3001`).
 */
export default function CustomerTripDemoPage() {
  const [inputId, setInputId] = useState("cust_demo_1");
  const userId = inputId.trim() || null;

  useSocket(userId, "CUSTOMER");
  useCustomerSocket({ enabled: Boolean(userId), authToken: null });

  return (
    <div className="min-h-dvh bg-[var(--color-gray-50)]">
      <div className="border-b border-[var(--color-gray-200)] bg-white px-4 py-3">
        <label className="block text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Customer user id (Socket auth)
        </label>
        <input
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--color-gray-200)] px-3 py-2 text-sm"
          placeholder="cust_demo_1"
        />
      </div>
      <CustomerTripTracking />
    </div>
  );
}
