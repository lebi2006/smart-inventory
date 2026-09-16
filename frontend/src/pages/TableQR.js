import { useState } from 'react';

const BASE_URL = 'http://localhost:3000'; // Change to your deployed domain later

export default function TableQR() {
  const [tableCount, setTableCount] = useState(5);
  const [prefix, setPrefix] = useState('Table');
  const [generated, setGenerated] = useState(false);

  const tables = Array.from({ length: tableCount }, (_, i) => {
    const label = `${prefix} ${i + 1}`;
    const url = `${BASE_URL}/menu?table=${encodeURIComponent(label)}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return { label, url, qr };
  });

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Table QR Codes</h2>
        <p className="text-sm text-gray-500">Generate printable QR codes for customer self-ordering</p>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Number of Tables</label>
          <input
            type="number"
            min="1"
            max="50"
            value={tableCount}
            onChange={(e) => { setTableCount(parseInt(e.target.value) || 1); setGenerated(false); }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => { setPrefix(e.target.value); setGenerated(false); }}
            placeholder="e.g. Table, Counter, Seat"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setGenerated(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
        >
          Generate QR Codes
        </button>
        {generated && (
          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            Print All
          </button>
        )}
      </div>

      {/* QR Grid */}
      {generated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center print:shadow-none print:border print:rounded-none"
            >
              <p className="font-bold text-gray-900 mb-3">{table.label}</p>
              <img
                src={table.qr}
                alt={`QR for ${table.label}`}
                className="w-32 h-32 mx-auto mb-3"
              />
              <p className="text-xs text-gray-400 break-all">{table.url}</p>
              <p className="text-xs text-indigo-600 font-medium mt-2">Scan to Order</p>
            </div>
          ))}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .grid, .grid * { visibility: visible; }
          .grid { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}