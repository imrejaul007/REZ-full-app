export default function NexabizzHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Nexabizz</h1>
          <p className="text-gray-600">B2B Procurement Platform</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Inventory Signals</h2>
            <p className="text-gray-600">Track supplier inventory in real-time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">RFQ System</h2>
            <p className="text-gray-600">Request quotes from multiple suppliers</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">BNPL Credit</h2>
            <p className="text-gray-600">Buy now, pay later with credit line</p>
          </div>
        </div>
      </main>
    </div>
  );
}
