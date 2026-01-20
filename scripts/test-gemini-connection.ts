

async function testGemini() {
    console.log('🧪 Testing Gemini API connection via /api/ingest...');

    const payload = {
        manualContent: "Texas battery storage capacity increased by 300% in 2025, helping stabilize the ERCOT grid during summer peaks. This proves the value of short-duration storage for ancillary services.",
        category: "Test-Run"
    };

    try {
        const res = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ Gemini API is WORKING!');
            console.log('   Response Summary:', data.analysis.summary);
            console.log('   Relevance Reason:', data.analysis.relevanceReasoning);
        } else {
            console.error('❌ Gemini API Verification Failed');
            console.error('   Status:', res.status);
            console.error('   Error:', data);
        }

    } catch (err) {
        console.error('❌ Network Error (Is localhost:3000 running?)', err);
    }
}

testGemini();
