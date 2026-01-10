/**
 * HTML Validation Script for Build Process
 * 
 * Validates HTML files for:
 * - Syntax errors
 * - Accessibility issues (WCAG 2.1 AA compliance)
 * - SEO requirements
 * - Performance best practices
 * 
 * Fails build on validation errors to ensure quality standards.
 * 
 * @generated-from: task-id:TASK-006 sprint:current
 * @modifies: build process
 * @dependencies: ["html-validate"]
 */

import { HtmlValidate } from 'html-validate';
import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';
import { glob } from 'glob';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {number} errorCount - Total number of errors
 * @property {number} warningCount - Total number of warnings
 * @property {Array<FileResult>} files - Results per file
 */

/**
 * File validation result
 * @typedef {Object} FileResult
 * @property {string} filePath - Path to validated file
 * @property {boolean} valid - Whether file is valid
 * @property {Array<ValidationMessage>} messages - Validation messages
 */

/**
 * Validation message
 * @typedef {Object} ValidationMessage
 * @property {string} severity - 'error' or 'warning'
 * @property {string} message - Human-readable message
 * @property {string} ruleId - Rule identifier
 * @property {number} line - Line number
 * @property {number} column - Column number
 */

/**
 * HTML Validator with comprehensive rules
 */
class HTMLValidator {
  constructor() {
    this.htmlValidate = new HtmlValidate({
      extends: ['html-validate:recommended'],
      rules: {
        // Accessibility rules (WCAG 2.1 AA)
        'wcag/h37': 'error', // Images must have alt text
        'wcag/h67': 'error', // Alt text must not be redundant
        'no-missing-references': 'error', // All IDs referenced must exist
        'aria-label-misuse': 'error', // Proper ARIA label usage
        'aria-hidden-focus': 'error', // Focusable elements not aria-hidden
        'input-missing-label': 'error', // Form inputs must have labels
        'require-sri': 'off', // SRI not required for static sites
        
        // SEO rules
        'require-csp': 'off', // CSP not required for static sites
        'meta-refresh': 'error', // No meta refresh redirects
        'no-inline-style': 'warn', // Prefer external stylesheets
        'heading-level': 'error', // Proper heading hierarchy
        'no-dup-id': 'error', // Unique IDs
        'no-dup-attr': 'error', // No duplicate attributes
        
        // HTML5 semantic rules
        'element-permitted-content': 'error', // Valid element nesting
        'element-required-attributes': 'error', // Required attributes present
        'element-required-content': 'error', // Required content present
        'no-deprecated-attr': 'error', // No deprecated attributes
        'no-unknown-elements': 'error', // Only valid HTML elements
        
        // Performance rules
        'no-implicit-close': 'error', // Explicit closing tags
        'void-style': ['error', { style: 'selfclose' }], // Self-closing void elements
        'attr-quotes': ['error', { style: 'double' }], // Double quotes for attributes
        
        // Best practices
        'doctype-html': 'error', // HTML5 doctype required
        'no-trailing-whitespace': 'warn', // Clean code
        'attr-case': ['error', { style: 'lowercase' }], // Lowercase attributes
        'element-case': ['error', { style: 'lowercase' }], // Lowercase elements
      },
    });

    this.startTime = Date.now();
    this.processedFiles = 0;
  }

  /**
   * Validate all HTML files in the project
   * @param {string} pattern - Glob pattern for HTML files
   * @returns {Promise<ValidationResult>}
   */
  async validateAll(pattern = '**/*.html') {
    const startTime = Date.now();
    console.log('🔍 Starting HTML validation...\n');

    try {
      // Find all HTML files
      const files = await this.findHTMLFiles(pattern);
      
      if (files.length === 0) {
        console.warn('⚠️  No HTML files found matching pattern:', pattern);
        return {
          valid: true,
          errorCount: 0,
          warningCount: 0,
          files: [],
        };
      }

      console.log(`📄 Found ${files.length} HTML file(s) to validate\n`);

      // Validate each file
      const results = await Promise.all(
        files.map(file => this.validateFile(file))
      );

      // Aggregate results
      const aggregated = this.aggregateResults(results);
      
      // Print summary
      this.printSummary(aggregated, Date.now() - startTime);

      return aggregated;
    } catch (error) {
      console.error('❌ Validation failed with error:', error.message);
      throw new Error(`HTML validation failed: ${error.message}`, { cause: error });
    }
  }

  /**
   * Find HTML files matching pattern
   * @param {string} pattern - Glob pattern
   * @returns {Promise<Array<string>>}
   */
  async findHTMLFiles(pattern) {
    const excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
    ];

    try {
      const files = await glob(pattern, {
        ignore: excludePatterns,
        absolute: false,
        nodir: true,
      });

      return files.map(file => resolve(process.cwd(), file));
    } catch (error) {
      throw new Error(`Failed to find HTML files: ${error.message}`, { cause: error });
    }
  }

  /**
   * Validate a single HTML file
   * @param {string} filePath - Path to HTML file
   * @returns {Promise<FileResult>}
   */
  async validateFile(filePath) {
    const relativePath = relative(process.cwd(), filePath);
    
    try {
      // Check file exists
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const content = readFileSync(filePath, 'utf-8');
      
      // Validate HTML
      const report = await this.htmlValidate.validateString(content, filePath);
      
      // Process results
      const messages = this.processMessages(report.results[0]?.messages || []);
      const valid = report.valid;

      this.processedFiles++;

      // Log file result
      if (valid) {
        console.log(`✅ ${relativePath}`);
      } else {
        console.log(`❌ ${relativePath}`);
        this.printFileMessages(messages);
      }

      return {
        filePath: relativePath,
        valid,
        messages,
      };
    } catch (error) {
      console.error(`❌ ${relativePath} - Failed to validate:`, error.message);
      
      return {
        filePath: relativePath,
        valid: false,
        messages: [{
          severity: 'error',
          message: `Validation failed: ${error.message}`,
          ruleId: 'validation-error',
          line: 0,
          column: 0,
        }],
      };
    }
  }

  /**
   * Process validation messages
   * @param {Array} messages - Raw messages from html-validate
   * @returns {Array<ValidationMessage>}
   */
  processMessages(messages) {
    return messages.map(msg => ({
      severity: msg.severity === 2 ? 'error' : 'warning',
      message: msg.message,
      ruleId: msg.ruleId || 'unknown',
      line: msg.line || 0,
      column: msg.column || 0,
    }));
  }

  /**
   * Print messages for a file
   * @param {Array<ValidationMessage>} messages - Validation messages
   */
  printFileMessages(messages) {
    messages.forEach(msg => {
      const icon = msg.severity === 'error' ? '  ❌' : '  ⚠️ ';
      const location = msg.line > 0 ? `${msg.line}:${msg.column}` : 'N/A';
      console.log(`${icon} [${msg.ruleId}] ${msg.message} (${location})`);
    });
    console.log('');
  }

  /**
   * Aggregate results from all files
   * @param {Array<FileResult>} results - Results from all files
   * @returns {ValidationResult}
   */
  aggregateResults(results) {
    let errorCount = 0;
    let warningCount = 0;

    results.forEach(result => {
      result.messages.forEach(msg => {
        if (msg.severity === 'error') {
          errorCount++;
        } else {
          warningCount++;
        }
      });
    });

    const valid = errorCount === 0;

    return {
      valid,
      errorCount,
      warningCount,
      files: results,
    };
  }

  /**
   * Print validation summary
   * @param {ValidationResult} result - Aggregated results
   * @param {number} duration - Validation duration in ms
   */
  printSummary(result, duration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 HTML Validation Summary');
    console.log('='.repeat(60));
    console.log(`Files validated: ${result.files.length}`);
    console.log(`Errors: ${result.errorCount}`);
    console.log(`Warnings: ${result.warningCount}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60));

    if (result.valid) {
      console.log('✅ All HTML files are valid!\n');
    } else {
      console.log('❌ HTML validation failed!\n');
      console.log('Failed files:');
      result.files
        .filter(f => !f.valid)
        .forEach(f => {
          const errorCount = f.messages.filter(m => m.severity === 'error').length;
          console.log(`  - ${f.filePath} (${errorCount} error(s))`);
        });
      console.log('');
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const validator = new HTMLValidator();
  
  try {
    // Get file pattern from command line args or use default
    const pattern = process.argv[2] || '**/*.html';
    
    // Run validation
    const result = await validator.validateAll(pattern);
    
    // Exit with appropriate code
    if (!result.valid) {
      console.error('💥 Build failed due to HTML validation errors');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error during HTML validation:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { HTMLValidator, main };