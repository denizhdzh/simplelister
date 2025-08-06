import React from 'react';
import Header from '../components/Header'; // Import Header
import Footer from '../components/Footer'; // Import Footer

function PrivacyPage() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: 03.11.2024</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>Simple Lister (“we”, “our”, “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not use the application.</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">a. Personal Information</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Account Information:</strong> When you register for an account, we may collect personal information such as your name, email address, and any other information you choose to provide.</li>
              <li><strong>Payment Information:</strong> For premium launches or sponsorships, we collect payment details securely through Stripe, our third-party payment processor. We do not store your full payment card information; Stripe handles the processing and storage.</li>
              <li><strong>Communication:</strong> Any communication between you and Simple Lister may be collected, including support requests and other inquiries.</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">b. Non-Personal Information</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Usage Data:</strong> We collect non-personal information about how you interact with our service, including your IP address, browser type, and access times.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
            <p>We may use the information we collect from you for various purposes, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>Providing, operating, and maintaining our services, including features like premium launches, free launches, and sponsorships.</li>
              <li>Improving and personalizing your experience on the application.</li>
              <li>Communicating with you, including for customer service, updates, and promotional messages.</li>
              <li>Analyzing usage and trends to improve our services and understand user interaction with premium and free launch options.</li>
              <li>Preventing fraudulent activity and ensuring the security of our application.</li>
              <li>Enabling community features, such as discussions and karma points, and awarding badges for top products.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. How We Share Your Information</h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li><strong>Service Providers:</strong> We may share information with third-party vendors who provide services on our behalf, such as payment processing, analytics, and hosting services. For payment processing, we use Stripe, which securely handles and processes your payment information.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information where we are legally required to do so, such as in response to a court order or other legal process.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that business deal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Security of Your Information</h2>
            <p>We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or method of electronic storage is entirely secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Your Privacy Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, such as:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>Access to the information we hold about you.</li>
              <li>Requesting the deletion or correction of your personal data.</li>
              <li>Objecting to the processing of your personal information.</li>
            </ul>
            <p className="mt-2">To exercise these rights, please contact us at <a href="mailto:hello@simplelister.com" className="text-blue-600 hover:underline">hello@simplelister.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Third-Party Links</h2>
            <p>Our application may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to read the privacy policies of any third-party websites you visit.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of Simple Lister following the posting of changes constitutes your acceptance of such changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">8. Community Features and Karma Points</h2>
            <p>Our community features, including discussions, allow you to participate and earn karma points. Only users with 20 or more karma can open new discussions. When you receive a reply to your post or comment, you earn an additional karma point. Please be aware that community interactions are public, and we cannot control how other users may use the information you share.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">9. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:hello@simplelister.com" className="text-blue-600 hover:underline">hello@simplelister.com</a></p>
          </section>

          <p className="mt-8">By using Simple Lister, you acknowledge that you have read and understood this Privacy Policy and agree to its terms and conditions.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PrivacyPage;