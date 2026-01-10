/**
 * Asset Minification Script
 * Minifies CSS and JavaScript files with source map generation
 * Supports development and production build modes
 * 
 * @module build/minify-assets
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join, dirname, basename, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

/**
 * Build configuration
 */
const CONFIG = {
  sourceDir: join(ROOT_DIR, 'css'),
  jsSourceDir: join(ROOT_DIR, 'js'),
  outputDir: join(ROOT_DIR, 'dist'),
  cssOutputDir: join(ROOT_DIR, 'dist', 'css'),
  jsOutputDir: join(ROOT_DIR, 'dist', 'js'),
  isDevelopment: process.env.NODE_ENV !== 'production',
  generateSourceMaps: true,
};

/**
 * Logger utility with structured context
 */
const logger = {
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },
  error: (message, error, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },
  success: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'success',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },
};

/**
 * Calculate file hash for cache busting
 * @param {string} content - File content
 * @returns {string} Hash string
 */
function calculateHash(content) {
  return createHash('md5').update(content).digest('hex').substring(0, 8);
}

/**
 * Minify CSS content
 * @param {string} content - CSS content
 * @param {string} filename - Source filename
 * @returns {Object} Minified CSS and source map
 */
function minifyCSS(content, filename) {
  const startTime = performance.now();
  const originalSize = Buffer.byteLength(content, 'utf8');

  try {
    // Remove comments
    let minified = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove whitespace
    minified = minified
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();

    // Remove unnecessary semicolons
    minified = minified.replace(/;+/g, ';');

    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    const duration = (performance.now() - startTime).toFixed(2);

    logger.info('CSS minification complete', {
      file: filename,
      originalSize,
      minifiedSize,
      reduction: `${reduction}%`,
      duration: `${duration}ms`,
    });

    // Generate source map if enabled
    let sourceMap = null;
    if (CONFIG.generateSourceMaps) {
      sourceMap = generateSourceMap(content, minified, filename, 'css');
    }

    return { minified, sourceMap, stats: { originalSize, minifiedSize, reduction } };
  } catch (error) {
    logger.error('CSS minification failed', error, { file: filename });
    throw new Error(`Failed to minify CSS ${filename}: ${error.message}`);
  }
}

/**
 * Minify JavaScript content
 * @param {string} content - JavaScript content
 * @param {string} filename - Source filename
 * @returns {Object} Minified JavaScript and source map
 */
function minifyJS(content, filename) {
  const startTime = performance.now();
  const originalSize = Buffer.byteLength(content, 'utf8');

  try {
    // Remove single-line comments (but preserve URLs)
    let minified = content.replace(/(?<!:)\/\/.*$/gm, '');

    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove whitespace while preserving string literals
    const strings = [];
    let stringIndex = 0;

    // Extract string literals
    minified = minified.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      const placeholder = `__STRING_${stringIndex}__`;
      strings.push({ placeholder, value: match });
      stringIndex++;
      return placeholder;
    });

    // Minify whitespace
    minified = minified
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}[\]();,:<>+\-*/%&|^!~?=])\s*/g, '$1')
      .replace(/;\s*}/g, '}')
      .trim();

    // Restore string literals
    strings.forEach(({ placeholder, value }) => {
      minified = minified.replace(placeholder, value);
    });

    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    const duration = (performance.now() - startTime).toFixed(2);

    logger.info('JavaScript minification complete', {
      file: filename,
      originalSize,
      minifiedSize,
      reduction: `${reduction}%`,
      duration: `${duration}ms`,
    });

    // Generate source map if enabled
    let sourceMap = null;
    if (CONFIG.generateSourceMaps) {
      sourceMap = generateSourceMap(content, minified, filename, 'js');
    }

    return { minified, sourceMap, stats: { originalSize, minifiedSize, reduction } };
  } catch (error) {
    logger.error('JavaScript minification failed', error, { file: filename });
    throw new Error(`Failed to minify JavaScript ${filename}: ${error.message}`);
  }
}

/**
 * Generate source map
 * @param {string} original - Original content
 * @param {string} minified - Minified content
 * @param {string} filename - Source filename
 * @param {string} type - File type (css or js)
 * @returns {string} Source map JSON
 */
function generateSourceMap(original, minified, filename, type) {
  const sourceMap = {
    version: 3,
    file: basename(filename).replace(extname(filename), `.min${extname(filename)}`),
    sources: [basename(filename)],
    sourcesContent: [original],
    names: [],
    mappings: 'AAAA',
  };

  return JSON.stringify(sourceMap);
}

/**
 * Process CSS files
 * @returns {Promise<Object>} Processing results
 */
async function processCSS() {
  const results = {
    processed: 0,
    failed: 0,
    totalOriginalSize: 0,
    totalMinifiedSize: 0,
    files: [],
  };

  try {
    // Ensure output directory exists
    await mkdir(CONFIG.cssOutputDir, { recursive: true });

    // Read all CSS files
    const files = await readdir(CONFIG.sourceDir);
    const cssFiles = files.filter(file => extname(file) === '.css');

    logger.info('Processing CSS files', { count: cssFiles.length });

    for (const file of cssFiles) {
      try {
        const sourcePath = join(CONFIG.sourceDir, file);
        const content = await readFile(sourcePath, 'utf8');

        // Minify CSS
        const { minified, sourceMap, stats } = minifyCSS(content, file);

        // Generate output filename
        const outputFilename = file.replace('.css', '.min.css');
        const outputPath = join(CONFIG.cssOutputDir, outputFilename);

        // Write minified CSS
        await writeFile(outputPath, minified, 'utf8');

        // Write source map if enabled
        if (sourceMap && CONFIG.generateSourceMaps) {
          const mapPath = `${outputPath}.map`;
          await writeFile(mapPath, sourceMap, 'utf8');

          // Add source map reference to CSS
          const cssWithMap = `${minified}\n/*# sourceMappingURL=${basename(mapPath)} */`;
          await writeFile(outputPath, cssWithMap, 'utf8');
        }

        results.processed++;
        results.totalOriginalSize += stats.originalSize;
        results.totalMinifiedSize += stats.minifiedSize;
        results.files.push({
          source: file,
          output: outputFilename,
          ...stats,
        });
      } catch (error) {
        results.failed++;
        logger.error('Failed to process CSS file', error, { file });
      }
    }

    return results;
  } catch (error) {
    logger.error('CSS processing failed', error);
    throw error;
  }
}

/**
 * Process JavaScript files
 * @returns {Promise<Object>} Processing results
 */
async function processJS() {
  const results = {
    processed: 0,
    failed: 0,
    totalOriginalSize: 0,
    totalMinifiedSize: 0,
    files: [],
  };

  try {
    // Ensure output directory exists
    await mkdir(CONFIG.jsOutputDir, { recursive: true });

    // Read all JS files
    const files = await readdir(CONFIG.jsSourceDir);
    const jsFiles = files.filter(file => extname(file) === '.js');

    logger.info('Processing JavaScript files', { count: jsFiles.length });

    for (const file of jsFiles) {
      try {
        const sourcePath = join(CONFIG.jsSourceDir, file);
        const content = await readFile(sourcePath, 'utf8');

        // Minify JavaScript
        const { minified, sourceMap, stats } = minifyJS(content, file);

        // Generate output filename
        const outputFilename = file.replace('.js', '.min.js');
        const outputPath = join(CONFIG.jsOutputDir, outputFilename);

        // Write minified JavaScript
        await writeFile(outputPath, minified, 'utf8');

        // Write source map if enabled
        if (sourceMap && CONFIG.generateSourceMaps) {
          const mapPath = `${outputPath}.map`;
          await writeFile(mapPath, sourceMap, 'utf8');

          // Add source map reference to JavaScript
          const jsWithMap = `${minified}\n//# sourceMappingURL=${basename(mapPath)}`;
          await writeFile(outputPath, jsWithMap, 'utf8');
        }

        results.processed++;
        results.totalOriginalSize += stats.originalSize;
        results.totalMinifiedSize += stats.minifiedSize;
        results.files.push({
          source: file,
          output: outputFilename,
          ...stats,
        });
      } catch (error) {
        results.failed++;
        logger.error('Failed to process JavaScript file', error, { file });
      }
    }

    return results;
  } catch (error) {
    logger.error('JavaScript processing failed', error);
    throw error;
  }
}

/**
 * Main build function
 * @returns {Promise<void>}
 */
async function build() {
  const buildStartTime = performance.now();

  logger.info('Starting asset minification', {
    mode: CONFIG.isDevelopment ? 'development' : 'production',
    sourceMaps: CONFIG.generateSourceMaps,
  });

  try {
    // Ensure output directory exists
    await mkdir(CONFIG.outputDir, { recursive: true });

    // Process CSS and JavaScript in parallel
    const [cssResults, jsResults] = await Promise.all([
      processCSS(),
      processJS(),
    ]);

    const buildDuration = ((performance.now() - buildStartTime) / 1000).toFixed(2);

    // Calculate total statistics
    const totalOriginalSize = cssResults.totalOriginalSize + jsResults.totalOriginalSize;
    const totalMinifiedSize = cssResults.totalMinifiedSize + jsResults.totalMinifiedSize;
    const totalReduction = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(2);

    logger.success('Asset minification complete', {
      duration: `${buildDuration}s`,
      css: {
        processed: cssResults.processed,
        failed: cssResults.failed,
      },
      js: {
        processed: jsResults.processed,
        failed: jsResults.failed,
      },
      totalReduction: `${totalReduction}%`,
      totalOriginalSize,
      totalMinifiedSize,
    });

    // Exit with error if any files failed
    if (cssResults.failed > 0 || jsResults.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('Build failed', error);
    process.exit(1);
  }
}

// Run build if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(error => {
    logger.error('Unhandled build error', error);
    process.exit(1);
  });
}

export { build, minifyCSS, minifyJS, processCSS, processJS };