
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-onyx text-gold flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-12 text-center">Privacy Policy</h1>

      <div className="bg-deep-onyx rounded-lg shadow-lg p-8 max-w-4xl w-full text-gray-300 space-y-6">
        <p>
          Nyx AI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">1. Data Collection and Usage</h2>
        <p>
          We collect minimal personal data required for account creation and service provision. This may include your email address and basic usage metrics. We do not collect or store any sensitive personal information beyond what is necessary to operate our services.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">2. Code and Content Anonymity</h2>
        <p>
          We want to be unequivocally clear: <strong className="text-gold">code submitted to Nyx AI for processing (e.g., through our AI models) is NEVER used for training any of our AI models, third-party models, or for any other purpose beyond fulfilling your explicit request.</strong> Your intellectual property remains yours, and its privacy is paramount.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">3. Billing Data Management</h2>
        <p>
          All billing and payment-related data, including credit card information, transaction history, and subscription details, are managed <strong className="text-gold">entirely by our compliance partner, Creem.io</strong>. Nyx AI does not store, process, or have direct access to your raw financial information. Creem.io is responsible for securely handling all payment transactions and ensuring global tax compliance.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">4. Data Security</h2>
        <p>
          We implement robust security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. This includes encryption, access controls, and regular security audits. While we strive to protect your personal information, no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">5. Third-Party Services</h2>
        <p>
          Nyx AI may use third-party services (e.g., AI model providers) to deliver its features. While we vet our partners for their security and privacy practices, we encourage you to review their respective privacy policies.
        </p>

        <h2 className="text-3xl font-semibold mt-8 mb-4 text-gold">6. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <p className="mt-8">
          Last updated: July 8, 2026
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
