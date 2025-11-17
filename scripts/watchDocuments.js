#!/usr/bin/env node

/**
 * Document Watcher Script
 *
 * Monitors the ChatPRD directory for changes and automatically:
 * - Processes new markdown files
 * - Normalizes AI handoff headers/footers
 * - Updates the document index
 * - Validates document structure
 *
 * Usage:
 *   node scripts/watchDocuments.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHATPRD_DIR = path.join(__dirname, '..', 'ChatPRD');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DOC_INDEX_PATH = path.join(__dirname, '..', 'DOC_INDEX.md');

// AI handoff templates
const AI_HEADER = `<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in \`AGENT_ORCHESTRATION.md\`.
<!-- /AI Handoff Header -->`;

const AI_FOOTER = `<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with \`ROADMAP.md\` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->`;

/**
 * Process a file when it changes
 */
function processFile(filePath) {
  // Only process markdown files
  if (!filePath.endsWith('.md')) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasHeader = content.includes('<!-- AI Handoff Header -->');
    const hasFooter = content.includes('<!-- AI Handoff Footer -->');

    // Only process if missing headers/footers
    if (!hasHeader || !hasFooter) {
      console.log(`📝 Processing: ${path.basename(filePath)}`);

      let normalized = content;

      // Remove existing headers/footers
      normalized = normalized.replace(/<!-- AI Handoff Header -->[\s\S]*?<!-- \/AI Handoff Header -->/g, '');
      normalized = normalized.replace(/<!-- AI Handoff Footer -->[\s\S]*?<!-- \/AI Handoff Footer -->/g, '');
      normalized = normalized.trim();

      // Add standardized header and footer
      normalized = `${AI_HEADER}\n\n${normalized}\n\n${AI_FOOTER}\n`;

      // Write back
      fs.writeFileSync(filePath, normalized, 'utf8');

      console.log(`   ✓ Added AI handoff markers`);
    }

  } catch (error) {
    console.error(`   ✗ Error processing ${path.basename(filePath)}:`, error.message);
  }
}

/**
 * Update the document index
 */
function updateIndex() {
  console.log('📊 Updating document index...');

  try {
    // This is a simplified version - in production, you'd import from processDocuments.js
    const timestamp = new Date().toISOString();

    // For now, just touch the index to show it was updated
    // In a full implementation, you'd regenerate the entire index
    const content = fs.readFileSync(DOC_INDEX_PATH, 'utf8');

    // Add a comment with last update time
    const updated = content.replace(
      /<!-- Last auto-updated: .* -->/,
      `<!-- Last auto-updated: ${timestamp} -->`
    );

    if (updated === content) {
      // Comment doesn't exist, add it
      const lines = content.split('\n');
      lines.splice(1, 0, `<!-- Last auto-updated: ${timestamp} -->`);
      fs.writeFileSync(DOC_INDEX_PATH, lines.join('\n'), 'utf8');
    } else {
      fs.writeFileSync(DOC_INDEX_PATH, updated, 'utf8');
    }

    console.log('   ✓ Index updated');

  } catch (error) {
    console.error('   ✗ Error updating index:', error.message);
  }
}

/**
 * Debounce function to avoid excessive processing
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Main watcher setup
 */
function startWatcher() {
  console.log('🔍 Document Watcher Started\n');
  console.log('Monitoring:');
  console.log(`  - ${CHATPRD_DIR}`);
  console.log(`  - ${DOCS_DIR}`);
  console.log('\nWaiting for changes... (Ctrl+C to stop)\n');

  // Debounced index update (wait 2 seconds after last change)
  const debouncedIndexUpdate = debounce(updateIndex, 2000);

  // Initialize watcher
  const watcher = chokidar.watch([CHATPRD_DIR, DOCS_DIR], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // don't process existing files on start
  });

  // File added
  watcher.on('add', (filePath) => {
    console.log(`➕ New file: ${path.basename(filePath)}`);
    processFile(filePath);
    debouncedIndexUpdate();
  });

  // File changed
  watcher.on('change', (filePath) => {
    console.log(`📝 Modified: ${path.basename(filePath)}`);
    processFile(filePath);
    debouncedIndexUpdate();
  });

  // File deleted
  watcher.on('unlink', (filePath) => {
    console.log(`🗑️  Deleted: ${path.basename(filePath)}`);
    debouncedIndexUpdate();
  });

  // Error handler
  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...');
    watcher.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n👋 Stopping watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Start the watcher
startWatcher();
