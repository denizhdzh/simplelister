import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function TermsPage() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: 03.11.2024</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
            <p>Welcome to Simple Lister! By accessing or using our services, you agree to comply with and be bound by these Terms of Service (“Terms”). If you do not agree to these Terms, you must not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Description of Service</h2>
            <p>Simple Lister is a web application that allows users to list and discover products in a streamlined manner. We provide a platform for users to share information about new products and engage with a community of like-minded individuals.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>You must create an account to access certain features of Simple Lister. When creating an account, you agree to provide accurate and complete information.</li>
              <li>You are responsible for maintaining the confidentiality of your account details and are liable for any activities conducted under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. User Conduct</h2>
             <ul className="list-disc list-inside space-y-1 pl-4">
              <li>You agree not to use Simple Lister for any unlawful or prohibited activities.</li>
              <li>Users must respect the rights and dignity of others, refraining from posting offensive, harmful, or misleading content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Content Ownership</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Users retain ownership of the content they submit. By posting content on Simple Lister, you grant us a non-exclusive, royalty-free, perpetual license to use, reproduce, modify, and display such content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Prohibited Activities</h2>
             <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Engaging in any activity that disrupts or interferes with the operation of Simple Lister or the servers and networks connected to our service.</li>
              <li>Attempting to gain unauthorized access to other users' accounts or Simple Lister systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Termination</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>We reserve the right to suspend or terminate your access to Simple Lister at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or to the business interests of Simple Lister.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">8. Disclaimer of Warranties</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Simple Lister is provided on an "as is" and "as available" basis without any warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">9. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>To the fullest extent permitted by law, Simple Lister shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">10. Changes to the Terms</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting the revised Terms. Your continued use of Simple Lister following any changes constitutes acceptance of the new Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">11. Governing Law</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>These Terms shall be governed by and construed in accordance with the laws of the Netherlands, without regard to its conflict of law principles.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">12. Sponsorship and Payments</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Users can opt for a premium launch for $29, which guarantees a three-day feature on the homepage, a dofollow backlink, and the option to choose a launch day.</li>
              <li>Normal launch users can list for free, appearing on the homepage for one day with a nofollow link and assigned a random launch day.</li>
              <li>Sponsorship opportunities are available through a monthly recurring payment model.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">13. Community Engagement</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Users with a karma score of 20 can start discussions within the community.</li>
              <li>Users earn +1 karma for replies to their posts or comments.</li>
              <li>The top three products of the day receive badges.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">14. Contact Information</h2>
            <p>For any questions about these Terms, please contact us at <a href="mailto:hello@simplelister.com" className="text-blue-600 hover:underline">hello@simplelister.com</a></p>
          </section>
          
          <p className="mt-8">By using Simple Lister, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default TermsPage; 