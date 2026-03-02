// Test ChromaDB connection
const { ChromaClient } = require('chromadb');

async function testChromaDB() {
  try {
    console.log('🧪 Testing ChromaDB connection...');
    
    const client = new ChromaClient({
      path: "http://localhost:8000"
    });
    
    const collection = await client.getOrCreateCollection({
      name: 'test_collection'
    });
    
    console.log('✅ ChromaDB connection successful!');
    console.log('✅ Collection created/connected');
    
    // Test adding a document
    await collection.add({
      ids: ['test1'],
      documents: ['Test document for ChromaDB'],
      metadatas: [{ source: 'test' }]
    });
    
    console.log('✅ Document added successfully');
    
    // Test querying
    const results = await collection.query({
      queryTexts: ['test'],
      nResults: 1
    });
    
    console.log('✅ Query successful:', results.documents[0]?.length || 0, 'results');
    
    // Clean up
    await collection.delete({
      ids: ['test1']
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ ChromaDB test failed:', error.message);
  }
}

testChromaDB();
