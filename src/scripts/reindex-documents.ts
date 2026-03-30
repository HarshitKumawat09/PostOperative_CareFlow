// Script to re-index all medical documents from persistent storage into ChromaDB
// Run with: npx ts-node src/scripts/reindex-documents.ts

import { medicalVectorDB } from '../ai/medical-vector-db';
import { persistentStorage } from '../ai/persistent-storage';

async function reindexDocuments() {
  console.log('🔄 Starting document re-indexing...\n');

  try {
    // Get all documents from persistent storage
    const docs = await persistentStorage.getAllDocuments();
    console.log(`📄 Found ${docs.length} documents in persistent storage`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of docs) {
      try {
        const surgeryType = doc.metadata?.surgeryType as string;
        
        // Check if document has valid content and surgery type
        if (!surgeryType || surgeryType === 'General') {
          console.log(`⚠️  Skipping ${doc.id}: Invalid surgery type "${surgeryType}"`);
          continue;
        }

        if (!doc.content || doc.content.length < 100) {
          console.log(`⚠️  Skipping ${doc.id}: Content too short or empty`);
          continue;
        }

        // Add to ChromaDB
        await medicalVectorDB.addDocument(doc.content, {
          ...doc.metadata,
          lastUpdated: new Date().toISOString()
        });

        console.log(`✅ Re-indexed: ${doc.metadata.title} (${surgeryType})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to re-index ${doc.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Re-indexing complete:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${docs.length - successCount - errorCount}`);

  } catch (error) {
    console.error('❌ Fatal error during re-indexing:', error);
    process.exit(1);
  }

  process.exit(0);
}

reindexDocuments();
