
import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-onyx text-gold flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-12 text-center">Terms of Service</h1>

      <div className="bg-deep-onyx rounded-lg shadow-lg p-8 max-w-4xl w-full text-gray-300 space-y-6">
        <p>
          Welcome to Nyx AI. By accessing or using our services, you agree to be bound by these Terms of Service (\"Terms\"). Please read them carefully.
        </p>
        <p>
          Nyx AI provides access to various AI compute resources and models. Your usage of these resources is metered, and credits will be deducted from your wallet based on your consumption.
        </p>
        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">1. Metered AI Compute Consumption</h2>
        <p>
          Our services operate on a pay-per-use model. You will be charged based on the amount of AI compute resources you consume, including but not limited to token usage, API calls, and processing time. Detailed metering information is available within your dashboard.
        </p>
        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">2. Runtime Credit Deductions</h2>
        <p>
          Credits are deducted from your pre-loaded wallet balance in real-time as you utilize Nyx AI\'s services. It is your responsibility to monitor your credit balance. Services may be suspended or limited if your balance falls below the required threshold for a given operation.
        </p>
        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">3. Automated Fair-Use Script Limits</h2>
        <p>
          To ensure fair access and prevent abuse of our resources, automated script limits and fair-use policies are enforced. Excessive, automated, or otherwise abusive usage patterns may result in temporary suspension or permanent termination of your account, at the sole discretion of Nyx AI, without refund.
        </p>
        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">4. Account Responsibility</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify Nyx AI immediately of any unauthorized use of your account.
        </p>
        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">5. Changes to Terms</h2>
        <p>
          Nyx AI reserves the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the service after any such changes constitutes your acceptance of the new Terms.
        </p>
        <p className="mt-8">
          Last updated: July 8, 2026
        </p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
