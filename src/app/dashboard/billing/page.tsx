
import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface Transaction {
  id: string;
  date: string;
  model_used: string;
  tokens_burned: number;
  credit_deducted: number;
}

const BillingDashboardPage: React.FC = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  // In a real application, you would fetch the user's wallet balance and transactions from Supabase.
  // For this exercise, we'll use mock data.

  const mockWalletBalance = 1.50;
  const mockTransactions: Transaction[] = [
    { id: '1', date: '2026-07-01', model_used: 'Gemini', tokens_burned: 120, credit_deducted: 0.12 },
    { id: '2', date: '2026-07-01', model_used: 'GLM-5', tokens_burned: 80, credit_deducted: 0.08 },
    { id: '3', date: '2026-07-02', model_used: 'DeepSeek R1', tokens_burned: 200, credit_deducted: 0.20 },
    { id: '4', date: '2026-07-03', model_used: 'Gemini', tokens_burned: 150, credit_deducted: 0.15 },
    { id: '5', date: '2026-07-04', model_used: 'Claude 3.5 Sonnet', tokens_burned: 300, credit_deducted: 0.30 },
  ];

  return (
    <div className="min-h-screen bg-onyx text-gold p-8">
      <h1 className="text-5xl font-bold mb-12 text-center">Billing Dashboard</h1>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Wallet Balance */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-semibold mb-4">Current Wallet Balance</h2>
          <p className="text-6xl font-bold text-gold">${mockWalletBalance.toFixed(2)} <span className="text-xl">remaining</span></p>
        </div>

        {/* Transaction Ledger */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-semibold mb-6">Transaction Ledger</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-onyx-light rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-gray text-gray-300 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Date</th>
                  <th className="py-3 px-6 text-left">Model Used</th>
                  <th className="py-3 px-6 text-left">Tokens Burned</th>
                  <th className="py-3 px-6 text-left">Credit Deducted</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 text-sm font-light">
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{transaction.date}</td>
                    <td className="py-3 px-6 text-left">{transaction.model_used}</td>
                    <td className="py-3 px-6 text-left">{transaction.tokens_burned}</td>
                    <td className="py-3 px-6 text-left">${transaction.credit_deducted.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Up Balance (Disabled) */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8 text-center opacity-50 cursor-not-allowed">
          <h2 className="text-3xl font-semibold mb-4">Top Up Balance</h2>
          <p className="text-xl text-gray-400 mb-6">Payment channels will activate immediately post-onboarding.</p>
          <button 
            className="w-full bg-gray-700 text-gray-500 font-bold py-3 px-6 rounded-lg text-xl cursor-not-allowed"
            disabled
          >
            Top Up Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboardPage;
