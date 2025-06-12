export default function BatchCloseoutAPI() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
          Batch Closeout & Label Generator API
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
          Backend API service for processing ModMed batch reports and generating envelope labels.
        </p>
        
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '2rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Available API Endpoints:</h2>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                POST /api/batch-reports/upload
              </code> - Upload PDF batch reports
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                POST /api/batch-reports/[id]/verify
              </code> - Verify extracted amounts
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                POST /api/batch-reports/[id]/generate-label
              </code> - Generate envelope labels
            </li>
          </ul>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>
              <strong>Note:</strong> All endpoints require authentication via Bearer token or session cookie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}