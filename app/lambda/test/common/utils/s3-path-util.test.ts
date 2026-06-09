import { isFilePath, getFileName, joinPaths, getRelativePath } from '@common/utils/s3-path-util';
import { describe, expect, test } from 'vitest';

describe('S3 Path Utilities', () => {
  describe('isFilePath', () => {
    test('should return true for file paths', () => {
      expect(isFilePath('path/to/file.txt')).toBe(true);
      expect(isFilePath('file.txt')).toBe(true);
      expect(isFilePath('path/to/file')).toBe(true);
    });

    test('should return false for directory paths', () => {
      expect(isFilePath('path/to/directory/')).toBe(false);
      expect(isFilePath('directory/')).toBe(false);
      expect(isFilePath('/')).toBe(false);
    });
  });

  describe('getFileName', () => {
    test('should extract filename from path', () => {
      expect(getFileName('path/to/file.txt')).toBe('file.txt');
      expect(getFileName('file.txt')).toBe('file.txt');
      expect(getFileName('path/to/file')).toBe('file');
    });

    test('should handle paths with multiple extensions', () => {
      expect(getFileName('path/to/file.min.js')).toBe('file.min.js');
      expect(getFileName('path/to/file.test.txt')).toBe('file.test.txt');
    });

    test('should handle empty paths', () => {
      expect(getFileName('')).toBe('');
    });
  });

  describe('joinPaths', () => {
    test('should join paths correctly', () => {
      expect(joinPaths('path', 'to', 'file.txt')).toBe('path/to/file.txt');
      expect(joinPaths('path/', 'to/', 'file.txt')).toBe('path/to/file.txt');
      expect(joinPaths('path', 'to', 'file.txt/')).toBe('path/to/file.txt/');
    });

    test('should handle empty paths', () => {
      expect(joinPaths('', 'path', 'to', 'file.txt')).toBe('path/to/file.txt');
      expect(joinPaths('path', '', 'to', 'file.txt')).toBe('path/to/file.txt');
      expect(joinPaths('path', 'to', 'file.txt', '')).toBe('path/to/file.txt');
    });

    test('should preserve trailing slash in last path', () => {
      expect(joinPaths('path', 'to', 'directory/')).toBe('path/to/directory/');
      expect(joinPaths('path/', 'to/', 'directory/')).toBe('path/to/directory/');
    });

    test('should handle single path', () => {
      expect(joinPaths('path')).toBe('path');
      expect(joinPaths('path/')).toBe('path/');
    });
  });

  describe('getRelativePath', () => {
    test('should get relative path from base to file', () => {
      expect(getRelativePath('source/folder', 'source/folder/file.txt')).toBe('file.txt');
      expect(getRelativePath('source/folder/', 'source/folder/subfolder/file.txt')).toBe(
        'subfolder/file.txt',
      );
    });

    test('should handle same path', () => {
      expect(getRelativePath('source/folder', 'source/folder')).toBe('');
      expect(getRelativePath('source/folder/', 'source/folder/')).toBe('');
    });

    test('should return full path if not under base', () => {
      expect(getRelativePath('source/folder', 'other/folder/file.txt')).toBe(
        'other/folder/file.txt',
      );
      expect(getRelativePath('source/folder/', 'source/other/file.txt')).toBe(
        'source/other/file.txt',
      );
    });

    test('should handle empty paths', () => {
      expect(getRelativePath('', 'file.txt')).toBe('file.txt');
      expect(getRelativePath('source/folder', '')).toBe('');
    });
  });
});
