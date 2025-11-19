#!/usr/bin/env node

/**
 * Repository History Parser
 * Crawls through all historical documents and extracts features, functions, and capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HistoryParser {
  constructor() {
    this.manifest = {
      metadata: {
        generatedAt: new Date().toISOString(),
        repoInception: '2025-10-25',
        version: '1.0.0',
        description: 'Complete historical manifest of all features and functions mentioned in repository history'
      },
      documentsScanned: [],
      features: [],
      functions: [],
      capabilities: [],
      technicalComponents: [],
      uiElements: [],
      integrations: [],
      unresolvedConcepts: []
    };

    this.patterns = {
      // Feature patterns
      features: [
        /(?:feature|functionality|capability):\s*([^\n]+)/gi,
        /(?:implement|add|create|build)\s+(?:a\s+)?([a-z\s]+(?:system|feature|functionality|component|module))/gi,
        /(?:supports?|enables?|provides?|allows?)\s+([^\n.]+)/gi,
        /✓\s*([^\n]+)/g,
        /[-•]\s*\*\*([^*]+)\*\*/g,
        /##+\s+([^\n]+Features?[^\n]*)/gi
      ],

      // Function/Method patterns
      functions: [
        /function\s+(\w+)\s*\(/g,
        /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
        /async\s+function\s+(\w+)/g,
        /(\w+)\s*:\s*async\s+function/g,
        /export\s+(?:async\s+)?function\s+(\w+)/g
      ],

      // UI Component patterns
      uiComponents: [
        /(?:component|modal|dialog|panel|view|page|screen):\s*([^\n]+)/gi,
        /<(\w+(?:Modal|Component|View|Panel|Page|Screen))/g,
        /import\s+(\w+)\s+from\s+['"].*(?:component|modal)/gi
      ],

      // Technical terms
      technical: [
        /(?:API|endpoint|service|database|schema|model|controller):\s*([^\n]+)/gi,
        /(?:using|with|via)\s+(React|Vue|Angular|Node|Express|MongoDB|PostgreSQL|Redis|GraphQL|REST|API)/gi
      ],

      // Integration patterns
      integrations: [
        /integrat(?:e|ion)\s+(?:with\s+)?([^\n.]+)/gi,
        /connect\s+(?:to\s+)?([^\n.]+)/gi,
        /(?:API|service):\s*([^\n]+API[^\n]*)/gi
      ]
    };

    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
      'can', 'this', 'that', 'these', 'those', 'it', 'its'
    ]);
  }

  /**
   * Recursively find all markdown files
   */
  findMarkdownFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (file !== 'node_modules' && file !== '.git') {
          this.findMarkdownFiles(filePath, fileList);
        }
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Find all JavaScript/JSX files for code analysis
   */
  findCodeFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
          this.findCodeFiles(filePath, fileList);
        }
      } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    return text
      .replace(/[*_`#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if text is meaningful (not just stop words)
   */
  isMeaningful(text) {
    const words = text.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(w => !this.stopWords.has(w) && w.length > 2);
    return meaningfulWords.length >= 2;
  }

  /**
   * Parse a markdown document for features and concepts
   */
  parseMarkdown(filePath, content) {
    const relPath = path.relative(process.cwd(), filePath);
    const doc = {
      path: relPath,
      size: content.length,
      lines: content.split('\n').length,
      features: new Set(),
      functions: new Set(),
      uiComponents: new Set(),
      technical: new Set(),
      integrations: new Set()
    };

    // Extract features
    this.patterns.features.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const text = this.cleanText(match[1] || match[0]);
        if (text.length > 5 && text.length < 200 && this.isMeaningful(text)) {
          doc.features.add(text);
        }
      }
    });

    // Extract UI components
    this.patterns.uiComponents.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const text = this.cleanText(match[1] || match[0]);
        if (text.length > 3 && text.length < 100) {
          doc.uiComponents.add(text);
        }
      }
    });

    // Extract technical terms
    this.patterns.technical.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const text = this.cleanText(match[1] || match[0]);
        if (text.length > 3 && text.length < 150) {
          doc.technical.add(text);
        }
      }
    });

    // Extract integrations
    this.patterns.integrations.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const text = this.cleanText(match[1] || match[0]);
        if (text.length > 3 && text.length < 150 && this.isMeaningful(text)) {
          doc.integrations.add(text);
        }
      }
    });

    return doc;
  }

  /**
   * Parse code file for actual implementations
   */
  parseCodeFile(filePath, content) {
    const relPath = path.relative(process.cwd(), filePath);
    const doc = {
      path: relPath,
      type: 'code',
      functions: new Set(),
      components: new Set(),
      exports: new Set()
    };

    // Extract function names
    this.patterns.functions.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          doc.functions.add(match[1]);
        }
      }
    });

    // Extract React components
    const componentPattern = /(?:function|const)\s+([A-Z]\w+)(?:\s*=|\s*\()/g;
    const componentMatches = content.matchAll(componentPattern);
    for (const match of componentMatches) {
      doc.components.add(match[1]);
    }

    // Extract exports
    const exportPattern = /export\s+(?:default\s+)?(?:function\s+)?(\w+)/g;
    const exportMatches = content.matchAll(exportPattern);
    for (const match of exportMatches) {
      doc.exports.add(match[1]);
    }

    return doc;
  }

  /**
   * Scan all documents
   */
  async scan(rootDir) {
    console.log('🔍 Scanning repository for historical documents...\n');

    // Find all markdown files
    const markdownFiles = this.findMarkdownFiles(rootDir);
    console.log(`📄 Found ${markdownFiles.length} markdown documents`);

    // Parse markdown files
    for (const filePath of markdownFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const doc = this.parseMarkdown(filePath, content);

        this.manifest.documentsScanned.push({
          path: doc.path,
          size: doc.size,
          lines: doc.lines,
          type: 'documentation',
          category: this.categorizeDocument(doc.path)
        });

        // Aggregate findings
        doc.features.forEach(f => this.manifest.features.push({ text: f, source: doc.path }));
        doc.uiComponents.forEach(c => this.manifest.uiElements.push({ name: c, source: doc.path }));
        doc.technical.forEach(t => this.manifest.technicalComponents.push({ text: t, source: doc.path }));
        doc.integrations.forEach(i => this.manifest.integrations.push({ text: i, source: doc.path }));

      } catch (err) {
        console.error(`❌ Error parsing ${filePath}: ${err.message}`);
      }
    }

    // Find and parse code files
    const codeFiles = this.findCodeFiles(path.join(rootDir, 'src'));
    console.log(`💻 Found ${codeFiles.length} code files`);

    for (const filePath of codeFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const doc = this.parseCodeFile(filePath, content);

        this.manifest.documentsScanned.push({
          path: doc.path,
          type: 'code',
          category: this.categorizeCodeFile(doc.path)
        });

        // Aggregate code findings
        doc.functions.forEach(f => this.manifest.functions.push({ name: f, source: doc.path }));
        doc.components.forEach(c => this.manifest.uiElements.push({ name: c, source: doc.path, type: 'component' }));

      } catch (err) {
        console.error(`❌ Error parsing ${filePath}: ${err.message}`);
      }
    }

    console.log('\n✅ Scanning complete!\n');
    this.deduplicateManifest();
  }

  /**
   * Categorize document by path
   */
  categorizeDocument(filePath) {
    if (filePath.includes('ChatPRD')) return 'ChatPRD';
    if (filePath.includes('docs/archive')) return 'Archive';
    if (filePath.includes('docs/roadmap')) return 'Roadmap';
    if (filePath.includes('docs/technical')) return 'Technical';
    if (filePath.includes('docs/legacy')) return 'Legacy';
    return 'Root';
  }

  /**
   * Categorize code file by path
   */
  categorizeCodeFile(filePath) {
    if (filePath.includes('/components/')) return 'Component';
    if (filePath.includes('/hooks/')) return 'Hook';
    if (filePath.includes('/utils/')) return 'Utility';
    if (filePath.includes('/services/')) return 'Service';
    if (filePath.includes('/test')) return 'Test';
    return 'Other';
  }

  /**
   * Remove duplicates and sort
   */
  deduplicateManifest() {
    // Deduplicate features
    const featuresMap = new Map();
    this.manifest.features.forEach(f => {
      const key = f.text.toLowerCase();
      if (!featuresMap.has(key)) {
        featuresMap.set(key, { ...f, sources: [f.source] });
      } else {
        if (!featuresMap.get(key).sources.includes(f.source)) {
          featuresMap.get(key).sources.push(f.source);
        }
      }
    });
    this.manifest.features = Array.from(featuresMap.values())
      .sort((a, b) => a.text.localeCompare(b.text));

    // Deduplicate functions
    const functionsMap = new Map();
    this.manifest.functions.forEach(f => {
      if (!functionsMap.has(f.name)) {
        functionsMap.set(f.name, { ...f, sources: [f.source] });
      } else {
        if (!functionsMap.get(f.name).sources.includes(f.source)) {
          functionsMap.get(f.name).sources.push(f.source);
        }
      }
    });
    this.manifest.functions = Array.from(functionsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Deduplicate UI elements
    const uiMap = new Map();
    this.manifest.uiElements.forEach(u => {
      const key = u.name.toLowerCase();
      if (!uiMap.has(key)) {
        uiMap.set(key, { ...u, sources: [u.source] });
      } else {
        if (!uiMap.get(key).sources.includes(u.source)) {
          uiMap.get(key).sources.push(u.source);
        }
      }
    });
    this.manifest.uiElements = Array.from(uiMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Deduplicate technical components
    const techMap = new Map();
    this.manifest.technicalComponents.forEach(t => {
      const key = t.text.toLowerCase();
      if (!techMap.has(key)) {
        techMap.set(key, { ...t, sources: [t.source] });
      } else {
        if (!techMap.get(key).sources.includes(t.source)) {
          techMap.get(key).sources.push(t.source);
        }
      }
    });
    this.manifest.technicalComponents = Array.from(techMap.values())
      .sort((a, b) => a.text.localeCompare(b.text));

    // Deduplicate integrations
    const intMap = new Map();
    this.manifest.integrations.forEach(i => {
      const key = i.text.toLowerCase();
      if (!intMap.has(key)) {
        intMap.set(key, { ...i, sources: [i.source] });
      } else {
        if (!intMap.get(key).sources.includes(i.source)) {
          intMap.get(key).sources.push(i.source);
        }
      }
    });
    this.manifest.integrations = Array.from(intMap.values())
      .sort((a, b) => a.text.localeCompare(b.text));
  }

  /**
   * Generate statistics
   */
  getStatistics() {
    const stats = {
      totalDocuments: this.manifest.documentsScanned.length,
      documentsByCategory: {},
      documentsByType: {},
      totalFeatures: this.manifest.features.length,
      totalFunctions: this.manifest.functions.length,
      totalUIElements: this.manifest.uiElements.length,
      totalTechnicalComponents: this.manifest.technicalComponents.length,
      totalIntegrations: this.manifest.integrations.length
    };

    this.manifest.documentsScanned.forEach(doc => {
      stats.documentsByCategory[doc.category] = (stats.documentsByCategory[doc.category] || 0) + 1;
      stats.documentsByType[doc.type] = (stats.documentsByType[doc.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Save manifest to file
   */
  save(outputPath) {
    const stats = this.getStatistics();

    const output = {
      ...this.manifest,
      statistics: stats
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`📦 Manifest saved to: ${outputPath}`);

    // Also save a human-readable markdown version
    this.saveMarkdown(outputPath.replace('.json', '.md'));
  }

  /**
   * Save human-readable markdown version
   */
  saveMarkdown(outputPath) {
    const stats = this.getStatistics();

    let md = `# Repository Historical Manifest\n\n`;
    md += `**Generated:** ${this.manifest.metadata.generatedAt}\n`;
    md += `**Repository Inception:** ${this.manifest.metadata.repoInception}\n`;
    md += `**Version:** ${this.manifest.metadata.version}\n\n`;
    md += `## 📊 Statistics\n\n`;
    md += `- **Total Documents Scanned:** ${stats.totalDocuments}\n`;
    md += `- **Total Features Mentioned:** ${stats.totalFeatures}\n`;
    md += `- **Total Functions Found:** ${stats.totalFunctions}\n`;
    md += `- **Total UI Elements:** ${stats.totalUIElements}\n`;
    md += `- **Total Technical Components:** ${stats.totalTechnicalComponents}\n`;
    md += `- **Total Integrations:** ${stats.totalIntegrations}\n\n`;

    md += `### Documents by Category\n\n`;
    Object.entries(stats.documentsByCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, count]) => {
        md += `- **${cat}:** ${count}\n`;
      });

    md += `\n### Documents by Type\n\n`;
    Object.entries(stats.documentsByType)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        md += `- **${type}:** ${count}\n`;
      });

    md += `\n## 🎯 Features Mentioned in Historical Documents\n\n`;
    md += `Total: ${this.manifest.features.length}\n\n`;

    this.manifest.features.slice(0, 100).forEach((feature, idx) => {
      md += `${idx + 1}. **${feature.text}**\n`;
      md += `   - Sources: ${feature.sources.length > 3 ? `${feature.sources.slice(0, 3).join(', ')}... (+${feature.sources.length - 3} more)` : feature.sources.join(', ')}\n\n`;
    });

    if (this.manifest.features.length > 100) {
      md += `\n_... and ${this.manifest.features.length - 100} more features (see JSON for complete list)_\n\n`;
    }

    md += `\n## 💻 Functions Implemented in Code\n\n`;
    md += `Total: ${this.manifest.functions.length}\n\n`;

    const functionsBySource = {};
    this.manifest.functions.forEach(fn => {
      fn.sources.forEach(src => {
        if (!functionsBySource[src]) functionsBySource[src] = [];
        functionsBySource[src].push(fn.name);
      });
    });

    Object.entries(functionsBySource)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 20)
      .forEach(([source, functions]) => {
        md += `### ${source}\n\n`;
        functions.slice(0, 20).forEach(fn => {
          md += `- \`${fn}\`\n`;
        });
        if (functions.length > 20) {
          md += `- _... and ${functions.length - 20} more_\n`;
        }
        md += `\n`;
      });

    md += `\n## 🎨 UI Elements & Components\n\n`;
    md += `Total: ${this.manifest.uiElements.length}\n\n`;

    const componentElements = this.manifest.uiElements.filter(e => e.type === 'component');
    const otherElements = this.manifest.uiElements.filter(e => !e.type);

    if (componentElements.length > 0) {
      md += `### React Components\n\n`;
      componentElements.slice(0, 50).forEach(elem => {
        md += `- **${elem.name}**\n`;
        if (elem.sources) {
          md += `  - Found in: ${elem.sources.length > 2 ? `${elem.sources.slice(0, 2).join(', ')}... (+${elem.sources.length - 2} more)` : elem.sources.join(', ')}\n`;
        }
      });
      md += `\n`;
    }

    if (otherElements.length > 0) {
      md += `### Other UI Elements Mentioned\n\n`;
      otherElements.slice(0, 50).forEach(elem => {
        md += `- ${elem.name}\n`;
      });
      md += `\n`;
    }

    md += `\n## 🔧 Technical Components & Stack\n\n`;
    md += `Total: ${this.manifest.technicalComponents.length}\n\n`;

    this.manifest.technicalComponents.slice(0, 50).forEach(tech => {
      md += `- **${tech.text}**\n`;
    });

    md += `\n## 🔌 Integrations & APIs\n\n`;
    md += `Total: ${this.manifest.integrations.length}\n\n`;

    this.manifest.integrations.forEach(integration => {
      md += `- **${integration.text}**\n`;
      if (integration.sources) {
        md += `  - Sources: ${integration.sources.length > 2 ? `${integration.sources.slice(0, 2).join(', ')}... (+${integration.sources.length - 2} more)` : integration.sources.join(', ')}\n`;
      }
    });

    md += `\n## 📚 Documents Scanned\n\n`;

    const docsByCategory = {};
    this.manifest.documentsScanned.forEach(doc => {
      if (!docsByCategory[doc.category]) docsByCategory[doc.category] = [];
      docsByCategory[doc.category].push(doc);
    });

    Object.entries(docsByCategory).forEach(([category, docs]) => {
      md += `\n### ${category} (${docs.length} documents)\n\n`;
      docs.forEach(doc => {
        md += `- \`${doc.path}\``;
        if (doc.lines) md += ` (${doc.lines} lines)`;
        md += `\n`;
      });
    });

    md += `\n---\n\n`;
    md += `*This manifest was automatically generated by historyParser.js*\n`;
    md += `*For complete details, see the JSON version of this manifest*\n`;

    fs.writeFileSync(outputPath, md);
    console.log(`📄 Human-readable manifest saved to: ${outputPath}`);
  }
}

// Main execution
const parser = new HistoryParser();
const rootDir = process.cwd();
const outputPath = path.join(rootDir, 'HISTORICAL_MANIFEST.json');

parser.scan(rootDir).then(() => {
  parser.save(outputPath);

  const stats = parser.getStatistics();
  console.log('\n📈 Summary:');
  console.log(`   Documents scanned: ${stats.totalDocuments}`);
  console.log(`   Features found: ${stats.totalFeatures}`);
  console.log(`   Functions found: ${stats.totalFunctions}`);
  console.log(`   UI elements: ${stats.totalUIElements}`);
  console.log(`   Technical components: ${stats.totalTechnicalComponents}`);
  console.log(`   Integrations: ${stats.totalIntegrations}`);
  console.log('\n✨ Done!');
});

export default HistoryParser;
