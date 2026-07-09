
import React from 'react';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-onyx text-gold flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-12 text-center">Nyx AI Pricing Plans</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Starter Dev Plan */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-3xl font-semibold mb-4 text-center">Starter Dev</h2>
          <p className="text-5xl font-bold text-center mb-6">$15<span className="text-xl font-normal">/mo</span></p>
          <ul className="text-lg mb-8 space-y-3">
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> $10.00 pre-loaded credit</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> Access to Gemini</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> Access to GLM-5</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> Access to DeepSeek R1</li>
          </ul>
          <button className="w-full bg-gold text-onyx font-bold py-3 px-6 rounded-lg text-xl hover:bg-amber-600 transition-colors duration-300">
            Get Started
          </button>
        </div>

        {/* Pro Coder Plan */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8 transform hover:scale-105 transition-transform duration-300 border-2 border-gold relative">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold text-onyx text-sm font-bold px-4 py-1 rounded-full shadow-md">Most Popular</span>
          <h2 className="text-3xl font-semibold mb-4 text-center">Pro Coder</h2>
          <p className="text-5xl font-bold text-center mb-6">$29<span className="text-xl font-normal">/mo</span></p>
          <ul className="text-lg mb-8 space-y-3">
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> $22.00 pre-loaded credit</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> All models including Claude 3.5 Sonnet</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> Priority Support</li>
          </ul>
          <button className="w-full bg-gold text-onyx font-bold py-3 px-6 rounded-lg text-xl hover:bg-amber-600 transition-colors duration-300">
            Choose Plan
          </button>
        </div>

        {/* Agency Studio Plan */}
        <div className="bg-deep-onyx rounded-lg shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-3xl font-semibold mb-4 text-center">Agency Studio</h2>
          <p className="text-5xl font-bold text-center mb-6">$79<span className="text-xl font-normal">/mo</span></p>
          <ul className="text-lg mb-8 space-y-3">
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> $65.00 pre-loaded credit</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> All models + priority routing</li>
            <li className="flex items-center"><span className="text-gold mr-3">✓</span> Dedicated Account Manager</li>
          </ul>
          <button className="w-full bg-gold text-onyx font-bold py-3 px-6 rounded-lg text-xl hover:bg-amber-600 transition-colors duration-300">
            Go Agency
          </button>
        </div>
      </div>

      <p className="text-center text-md mt-12 max-w-2xl text-gray-400">
        All transactions securely processed and taxed globally via our compliance partner, Creem.io. No hidden token fees. Complete overage protection.
      </p>
    </div>
  );
};

export default PricingPage;
