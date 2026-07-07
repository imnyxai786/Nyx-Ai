
import React from 'react';

const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-onyx text-gold flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-12 text-center">Refund Policy</h1>

      <div className="bg-deep-onyx rounded-lg shadow-lg p-8 max-w-4xl w-full text-gray-300 space-y-6">
        <p>
          At Nyx AI, we strive to provide transparent and fair policies regarding our services. Please read our Refund Policy carefully.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">1. Non-Refundable Sales for Subscriptions and Wallet Top-Ups</h2>
        <p>
          <strong className="text-gold">All subscription sales and wallet top-ups are strictly non-refundable once any compute prompt has been processed.</strong> This policy is in place due to the immediate and irreversible upstream API provisioning costs incurred the moment an AI compute task is initiated, regardless of the output or its perceived utility.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">2. Understanding "Compute Prompt Processed"</h2>
        <p>
          A \"compute prompt processed\" refers to any instance where your request interacts with our AI models or compute infrastructure, resulting in a deduction from your pre-loaded credit balance. This includes, but is not limited to, sending a query to an AI model, generating code, or initiating any AI-powered task.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">3. Exceptions</h2>
        <p>
          No exceptions will be made to this policy unless mandated by applicable law. In cases of verifiable technical errors directly attributable to Nyx AI that prevented any compute prompt from being processed successfully (and no credits were deducted), please contact support for review. Such cases will be handled on an individual basis.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">4. Account Termination</h2>
        <p>
          In the event of account termination, whether initiated by the user or Nyx AI, any remaining pre-loaded credits or subscription value will not be refunded.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">5. Contact Us</h2>
        <p>
          If you have any questions about this Refund Policy, please contact our support team.
        </p>

        <p className="mt-8">
          Last updated: July 8, 2026
        </p>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
