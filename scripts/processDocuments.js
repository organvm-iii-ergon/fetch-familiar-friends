#!/usr/bin/env node

/**
 * Document Processing Script
 *
 * Processes markdown documents in the ChatPRD directory:
 * - Normalizes AI handoff headers and footers
 * - Extracts metadata
 * - Generates document index
 * - Validates document structure
 *
 * Usage:
 *   node scripts/processDocuments.js              # Process all documents
 *   node scripts/processDocuments.js --validate   # Validate only
 *   node scripts/processDocuments.js --index      # Update index only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHATPRD_DIR = path.join(__dirname, '..', 'ChatPRD');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DOC_INDEX_PATH = path.join(__dirname, '..', 'DOC_INDEX.md');

// Standard AI handoff header
const AI_HEADER = `<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in \`AGENT_ORCHESTRATION.md\`.
<!-- /AI Handoff Header -->`;

// Standard AI handoff footer
const AI_FOOTER = `<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with \`ROADMAP.md\` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->`;

/**
 * Check if a file has AI handoff header
 */
function hasAIHeader(content) {
  return content.includes('<!-- AI Handoff Header -->');
}

/**
 * Check if a file has AI handoff footer
 */
function hasAIFooter(content) {
  return content.includes('<!-- AI Handoff Footer -->');
}

/**
 * Add AI handoff header to content
 */
function addAIHeader(content) {
  // Don't add if already present
  if (hasAIHeader(content)) {
    return content;
  }

  return `${AI_HEADER}\n\n${content}`;
}

/**
 * Add AI handoff footer to content
 */
function addAIFooter(content) {
  // Don't add if already present
  if (hasAIFooter(content)) {
    return content;
  }

  return `${content}\n\n${AI_FOOTER}\n`;
}

/**
 * Normalize AI handoff markers in content
 */
function normalizeAIHandoff(content) {
  let normalized = content;

  // Remove existing headers/footers (we'll re-add standardized versions)
  normalized = normalized.replace(/<!-- AI Handoff Header -->[\s\S]*?<!-- \/AI Handoff Header -->/g, '');
  normalized = normalized.replace(/<!-- AI Handoff Footer -->[\s\S]*?<!-- \/AI Handoff Footer -->/g, '');

  // Clean up extra whitespace
  normalized = normalized.trim();

  // Add standardized header and footer
  normalized = addAIHeader(normalized);
  normalized = addAIFooter(normalized);

  return normalized;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract metadata from markdown content
 */
function extractMetadata(content, filePath) {
  const stats = fs.statSync(filePath);

  return {
    title: extractTitle(content),
    wordCount: content.split(/\s+/).length,
    lastModified: stats.mtime.toISOString(),
    size: stats.size,
    hasHeader: hasAIHeader(content),
    hasFooter: hasAIFooter(content)
  };
}

/**
 * Process a single markdown file
 */
function processDocument(filePath, options = {}) {
  const { dryRun = false, normalize = true } = options;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = extractMetadata(content, filePath);

    let result = {
      path: filePath,
      filename: path.basename(filePath),
      metadata,
      changed: false,
      errors: []
    };

    // Normalize if requested
    if (normalize && (!metadata.hasHeader || !metadata.hasFooter)) {
      const normalized = normalizeAIHandoff(content);

      if (!dryRun) {
        fs.writeFileSync(filePath, normalized, 'utf8');
        result.changed = true;
      } else {
        result.wouldChange = true;
      }
    }

    return result;

  } catch (error) {
    return {
      path: filePath,
      filename: path.basename(filePath),
      errors: [error.message]
    };
  }
}

/**
 * Find all markdown files in a directory
 */
function findMarkdownFiles(dir, recursive = true) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && recursive) {
        // Skip node_modules and .git
        if (item !== 'node_modules' && item !== '.git') {
          walk(fullPath);
        }
      } else if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Generate document index
 */
function generateDocumentIndex(documents) {
  const header = `<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in \`AGENT_ORCHESTRATION.md\`.
<!-- /AI Handoff Header -->

# Repository Knowledge Key

The table below maps each knowledge artifact to its core focus and recommended usage.

| File | Title | Last Modified | Status |
| --- | --- | --- | --- |`;

  const footer = `
## Navigation Notes

- Align document updates with \`ROADMAP.md\` milestones.
- Capture questions and clarifications in \`AGENT_ORCHESTRATION.md\`.

<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with \`ROADMAP.md\` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->`;

  const rows = documents
    .filter(doc => !doc.errors || doc.errors.length === 0)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(doc => {
      const relativePath = path.relative(path.join(__dirname, '..'), doc.path);
      const title = doc.metadata.title || path.basename(doc.path, '.md');
      const lastModified = new Date(doc.metadata.lastModified).toLocaleDateString();
      const status = doc.metadata.hasHeader && doc.metadata.hasFooter ? '✓' : '⚠';

      return `| [${relativePath}](${relativePath}) | ${title} | ${lastModified} | ${status} |`;
    })
    .join('\n');

  return `${header}\n${rows}\n${footer}`;
}

/**
 * Validate documents
 */
function validateDocuments(documents) {
  const issues = [];

  for (const doc of documents) {
    if (doc.errors && doc.errors.length > 0) {
      issues.push({
        file: doc.filename,
        type: 'error',
        message: doc.errors.join(', ')
      });
      continue;
    }

    if (!doc.metadata.hasHeader) {
      issues.push({
        file: doc.filename,
        type: 'warning',
        message: 'Missing AI handoff header'
      });
    }

    if (!doc.metadata.hasFooter) {
      issues.push({
        file: doc.filename,
        type: 'warning',
        message: 'Missing AI handoff footer'
      });
    }

    if (!doc.metadata.title) {
      issues.push({
        file: doc.filename,
        type: 'warning',
        message: 'No title found (missing # heading)'
      });
    }
  }

  return issues;
}

/**
 * Display validation results
 */
function displayValidation(issues) {
  if (issues.length === 0) {
    console.log('✓ All documents valid\n');
    return true;
  }

  console.log(`Found ${issues.length} issue(s):\n`);

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(issue => {
      console.log(`  ✗ ${issue.file}: ${issue.message}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(issue => {
      console.log(`  ⚠ ${issue.file}: ${issue.message}`);
    });
    console.log('');
  }

  return errors.length === 0;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  return {
    validate: args.includes('--validate'),
    index: args.includes('--index'),
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h')
  };
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Document Processing Tool
========================

Usage:
  node scripts/processDocuments.js [options]

Options:
  --validate    Validate documents without modifying
  --index       Update document index only
  --dry-run     Show what would be changed without modifying files
  --help, -h    Show this help message

Examples:
  node scripts/processDocuments.js              # Process and normalize all
  node scripts/processDocuments.js --validate   # Validate only
  node scripts/processDocuments.js --dry-run    # Preview changes
  `);
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  console.log('Document Processing\n');
  console.log('===================\n');

  // Find all markdown files
  const chatPRDFiles = findMarkdownFiles(CHATPRD_DIR);
  const docsFiles = findMarkdownFiles(DOCS_DIR);
  const allFiles = [...chatPRDFiles, ...docsFiles];

  console.log(`Found ${allFiles.length} markdown files`);
  console.log(`  - ChatPRD: ${chatPRDFiles.length}`);
  console.log(`  - Docs: ${docsFiles.length}\n`);

  // Process documents
  const processed = allFiles.map(file =>
    processDocument(file, {
      dryRun: args.dryRun || args.validate,
      normalize: !args.validate
    })
  );

  // Validate
  const issues = validateDocuments(processed);
  const isValid = displayValidation(issues);

  if (args.validate) {
    process.exit(isValid ? 0 : 1);
    return;
  }

  // Show changes
  if (args.dryRun) {
    const wouldChange = processed.filter(p => p.wouldChange).length;
    console.log(`Would modify ${wouldChange} file(s)\n`);
  } else {
    const changed = processed.filter(p => p.changed).length;
    if (changed > 0) {
      console.log(`✓ Normalized ${changed} file(s)\n`);
    }
  }

  // Update index
  if (!args.dryRun && !args.validate) {
    const index = generateDocumentIndex(processed);
    fs.writeFileSync(DOC_INDEX_PATH, index, 'utf8');
    console.log(`✓ Updated ${DOC_INDEX_PATH}\n`);
  }

  // Summary
  const stats = {
    total: processed.length,
    withHeader: processed.filter(p => p.metadata?.hasHeader).length,
    withFooter: processed.filter(p => p.metadata?.hasFooter).length,
    withTitle: processed.filter(p => p.metadata?.title).length,
    errors: processed.filter(p => p.errors && p.errors.length > 0).length
  };

  console.log('Summary:');
  console.log(`  Total documents: ${stats.total}`);
  console.log(`  With AI header: ${stats.withHeader} (${((stats.withHeader / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  With AI footer: ${stats.withFooter} (${((stats.withFooter / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  With title: ${stats.withTitle} (${((stats.withTitle / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Errors: ${stats.errors}\n`);

  console.log('✓ Document processing complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
