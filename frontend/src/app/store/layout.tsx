export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sri Lakshmi Jewellers</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/store" className="text-gray-900 hover:text-gold-600">Catalog</a>
              <a href="/store/cart" className="text-gray-900 hover:text-gold-600">Cart</a>
              <a href="/store/track" className="text-gray-900 hover:text-gold-600">Track Order</a>
              <a href="/store/account" className="text-gray-900 hover:text-gold-600">Account</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Store Content */}
      <main>{children}</main>
    </div>
  );
}