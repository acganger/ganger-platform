export default function TestCSS() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">CSS Test Page</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Tailwind CSS Test</h2>
        <p className="text-gray-600">If you can see styled text and a white card with shadow, Tailwind is working.</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-500 text-white p-4 rounded">Red Box</div>
        <div className="bg-green-500 text-white p-4 rounded">Green Box</div>
        <div className="bg-blue-500 text-white p-4 rounded">Blue Box</div>
      </div>
      
      <div className="mt-8">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          Styled Button
        </button>
      </div>
      
      {/* Raw CSS test */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', border: '2px solid #333' }}>
        <p style={{ color: '#333', fontSize: '18px' }}>This uses inline styles - should always work</p>
      </div>
    </div>
  );
}