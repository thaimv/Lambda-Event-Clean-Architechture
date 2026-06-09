import path from 'path';

/**
 * Check if a path represents a file (doesn't end with /)
 * @param {string} filePath - The path to check
 * @returns {boolean} - Whether the path represents a file
 */
export function isFilePath(filePath: string): boolean {
  return !filePath.endsWith('/');
}

/**
 * Extract filename from a path
 * @param {string} filePath - The path to extract the filename from
 * @returns {string} - The filename
 */
export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Join paths handling trailing slashes properly
 * @param {...string} paths - The paths to join
 * @returns {string} - The joined path
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .map((p, i) => {
      // Remove trailing slash except for the last path if it originally had one
      if (i < paths.length - 1) {
        return p.replace(/\/$/, '');
      }
      return p;
    })
    .filter((p) => p)
    .join('/');
}

/**
 * Get relative path from source base to source file
 * @param {string} basePath - The base path
 * @param {string} fullPath - The full path
 * @returns {string} - The relative path
 */
export function getRelativePath(basePath: string, fullPath: string): string {
  // Remove trailing slash from base path
  const base = basePath.replace(/\/$/, '');

  // If full path starts with base path, remove it
  if (fullPath === base) {
    return '';
  }

  if (fullPath.startsWith(base + '/')) {
    // Remove base path and the following slash
    return fullPath.substring(base.length + 1);
  }

  return fullPath;
}
