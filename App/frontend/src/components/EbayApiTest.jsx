// eBay API Test Component - Add this temporarily to diagnose the issue
import React, { useState } from "react";

export default function EbayApiTest() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testEbayConnection() {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Test 1: Check if test endpoint works
      console.log("Testing eBay API connection...");
      const testRes = await fetch("/api/ebay/test");
      const testData = await testRes.json();
      
      console.log("Test endpoint result:", testData);
      
      // Test 2: Try a simple search
      console.log("Testing eBay search...");
      const searchRes = await fetch("/api/ebay/catalog?q=wrench");
      const searchData = await searchRes.json();
      
      console.log("Search result:", searchData);
      
      setTestResult({
        connectionTest: testData,
        searchTest: {
          status: searchRes.ok ? "success" : "failed",
          itemCount: Array.isArray(searchData) ? searchData.length : 0,
          data: searchData
        }
      });
      
    } catch (err) {
      console.error("Test failed:", err);
      setTestResult({
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", margin: "20px" }}>
      <h2>eBay API Diagnostics</h2>
      
      <button 
        onClick={testEbayConnection}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px"
        }}
      >
        {loading ? "Testing..." : "Test eBay Connection"}
      </button>

      {testResult && (
        <div style={{ background: "white", padding: "15px", borderRadius: "8px" }}>
          <h3>Test Results:</h3>
          <pre style={{ 
            background: "#f5f5f5", 
            padding: "10px", 
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "12px"
          }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
          
          {testResult.searchTest && testResult.searchTest.itemCount > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4>Sample Results:</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {testResult.searchTest.data.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
                    <img 
                      src={item.image?.imageUrl} 
                      alt={item.title}
                      style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <p style={{ fontSize: "12px", margin: "8px 0" }}>{item.title}</p>
                    <p style={{ fontWeight: "bold", color: "#1976d2" }}>
                      ${item.price?.value} {item.price?.currency}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "20px", background: "white", padding: "15px", borderRadius: "8px" }}>
        <h3>Troubleshooting Steps:</h3>
        <ol style={{ lineHeight: "1.8" }}>
          <li>
            <strong>Check Environment Variables:</strong> Make sure your <code>.env</code> file contains:
            <pre style={{ background: "#f5f5f5", padding: "10px", margin: "10px 0" }}>
EBAY_CLIENT_ID=your_client_id_here
EBAY_CLIENT_SECRET=your_client_secret_here
            </pre>
          </li>
          <li>
            <strong>Verify eBay Developer Account:</strong> 
            <ul>
              <li>Go to <a href="https://developer.ebay.com/" target="_blank">developer.ebay.com</a></li>
              <li>Create an app in the Developer Dashboard</li>
              <li>Get your Production Application Keys (Client ID & Secret)</li>
              <li>Make sure your app has "Browse API" access</li>
            </ul>
          </li>
          <li>
            <strong>Restart Backend:</strong> After updating .env, restart your backend server
          </li>
          <li>
            <strong>Check Console:</strong> Open browser DevTools Console and Network tab for errors
          </li>
          <li>
            <strong>Server Logs:</strong> Check your backend terminal for any error messages
          </li>
        </ol>
      </div>
    </div>
  );
}

// To use this component, temporarily add it to your SponsorView:
// import EbayApiTest from './EbayApiTest';
// Then add <EbayApiTest /> in the catalog management view