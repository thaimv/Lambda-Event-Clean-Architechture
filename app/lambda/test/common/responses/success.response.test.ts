/* eslint-disable max-lines-per-function */
import { SuccessResponse } from '@common/responses/success.response';
import { describe, test, expect } from 'vitest';

describe('SuccessResponse', () => {
  describe('constructor and render method', () => {
    test('should create response with default code and message', () => {
      const data = { message: 'test data' };
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: {
          code: 'SC-001',
          message: 'Success',
        },
        data,
      });
    });

    test('should create response with custom code and default message', () => {
      const data = { items: [1, 2, 3] };
      const successResponse = new SuccessResponse(data, 'SC-002');
      const result = successResponse.render();

      expect(result).toEqual({
        result: {
          code: 'SC-002',
          message: 'Success',
        },
        data,
      });
    });

    test('should create response with custom code and custom message', () => {
      const data = { status: 'created' };
      const successResponse = new SuccessResponse(data, 'SC-003', 'Resource created successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: {
          code: 'SC-003',
          message: 'Resource created successfully',
        },
        data,
      });
    });

    test('should create response with only custom message (default code)', () => {
      const data = { user: 'john' };
      const successResponse = new SuccessResponse(data, 'SC-001', 'User retrieved successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: {
          code: 'SC-001',
          message: 'User retrieved successfully',
        },
        data,
      });
    });
  });

  describe('data types handling', () => {
    test('should handle string data', () => {
      const data = 'test string';
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: 'test string',
      });
    });

    test('should handle number data', () => {
      const data = 42;
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: 42,
      });
    });

    test('should handle boolean data', () => {
      const data = true;
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: true,
      });

      const falseData = false;
      const falseResponse = new SuccessResponse(falseData);
      const falseResult = falseResponse.render();

      expect(falseResult).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: false,
      });
    });

    test('should handle null data', () => {
      const data = null;
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: null,
      });
    });

    test('should handle undefined data', () => {
      const data = undefined;
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: undefined,
      });
    });

    test('should handle array data', () => {
      const data = [1, 2, 3, 'test', { nested: true }];
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: [1, 2, 3, 'test', { nested: true }],
      });
    });

    test('should handle empty array data', () => {
      const data: unknown[] = [];
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: [],
      });
    });

    test('should handle object data', () => {
      const data = {
        id: 1,
        name: 'John Doe',
        active: true,
        metadata: {
          created: '2023-01-01',
          updated: null,
        },
        tags: ['user', 'admin'],
      };
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data,
      });
    });

    test('should handle empty object data', () => {
      const data = {};
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: {},
      });
    });

    test('should handle nested complex data', () => {
      const data = {
        users: [
          { id: 1, name: 'John', roles: ['admin', 'user'] },
          { id: 2, name: 'Jane', roles: ['user'] },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          hasNext: false,
        },
        metadata: {
          timestamp: '2023-01-01T00:00:00Z',
          version: '1.0.0',
        },
      };
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data,
      });
    });
  });

  describe('edge cases', () => {
    test('should handle empty string data', () => {
      const data = '';
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: '',
      });
    });

    test('should handle zero as data', () => {
      const data = 0;
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: 'Success' },
        data: 0,
      });
    });

    test('should handle empty string code', () => {
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, '');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: '', message: 'Success' },
        data,
      });
    });

    test('should handle empty string message', () => {
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, 'SC-001', '');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: '' },
        data,
      });
    });

    test('should handle empty strings for both code and message', () => {
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, '', '');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: '', message: '' },
        data,
      });
    });

    test('should handle very long code', () => {
      const longCode = 'SC-' + 'A'.repeat(100);
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, longCode);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: longCode, message: 'Success' },
        data,
      });
    });

    test('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, 'SC-001', longMessage);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: longMessage },
        data,
      });
    });

    test('should handle special characters in code', () => {
      const specialCode = 'SC-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, specialCode);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: specialCode, message: 'Success' },
        data,
      });
    });

    test('should handle special characters in message', () => {
      const specialMessage = 'Success with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data, 'SC-001', specialMessage);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: specialMessage },
        data,
      });
    });

    test('should handle unicode characters', () => {
      const unicodeMessage = 'Success: completed 🎉 ✅';
      const unicodeData = { message: 'hello', emoji: '😀' };
      const successResponse = new SuccessResponse(unicodeData, 'SC-001', unicodeMessage);
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-001', message: unicodeMessage },
        data: unicodeData,
      });
    });
  });

  describe('common use cases', () => {
    test('should handle paginated list response', () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      };
      const successResponse = new SuccessResponse(data, 'SC-200', 'Items retrieved successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-200', message: 'Items retrieved successfully' },
        data,
      });
    });

    test('should handle creation response', () => {
      const data = {
        id: 123,
        name: 'New Resource',
        createdAt: '2023-01-01T00:00:00Z',
      };
      const successResponse = new SuccessResponse(data, 'SC-201', 'Resource created successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-201', message: 'Resource created successfully' },
        data,
      });
    });

    test('should handle update response', () => {
      const data = {
        id: 123,
        name: 'Updated Resource',
        updatedAt: '2023-01-01T12:00:00Z',
      };
      const successResponse = new SuccessResponse(data, 'SC-200', 'Resource updated successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-200', message: 'Resource updated successfully' },
        data,
      });
    });

    test('should handle deletion response', () => {
      const data = { deleted: true, id: 123 };
      const successResponse = new SuccessResponse(data, 'SC-200', 'Resource deleted successfully');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-200', message: 'Resource deleted successfully' },
        data,
      });
    });

    test('should handle no content response', () => {
      const successResponse = new SuccessResponse(null, 'SC-204', 'No content');
      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-204', message: 'No content' },
        data: null,
      });
    });
  });

  describe('type safety', () => {
    test('should maintain proper typing for generic data type', () => {
      interface UserData {
        id: number;
        name: string;
        active: boolean;
      }

      const userData: UserData = { id: 1, name: 'John', active: true };
      const successResponse = new SuccessResponse<UserData>(userData);
      const result = successResponse.render();

      expect(result.data).toEqual(userData);
      expect(typeof result.data.id).toBe('number');
      expect(typeof result.data.name).toBe('string');
      expect(typeof result.data.active).toBe('boolean');
    });

    test('should handle array data type', () => {
      interface Item {
        id: number;
        name: string;
      }

      const items: Item[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const successResponse = new SuccessResponse<Item[]>(items);
      const result = successResponse.render();

      expect(result.data).toEqual(items);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
    });

    test('should maintain type safety for result structure', () => {
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data);
      const result = successResponse.render();

      expect(typeof result.result.code).toBe('string');
      expect(typeof result.result.message).toBe('string');
      expect(result.data).toBeDefined();
    });
  });

  describe('property access', () => {
    test('should allow access to public properties', () => {
      const data = { test: 'data' };
      const code = 'SC-123';
      const message = 'Custom message';
      const successResponse = new SuccessResponse(data, code, message);

      expect(successResponse.data).toEqual(data);
      expect(successResponse.code).toBe(code);
      expect(successResponse.message).toBe(message);
    });

    test('should allow modification of public properties', () => {
      const data = { test: 'data' };
      const successResponse = new SuccessResponse(data);

      successResponse.code = 'SC-999';
      successResponse.message = 'Modified message';
      successResponse.data = { modified: true };

      const result = successResponse.render();

      expect(result).toEqual({
        result: { code: 'SC-999', message: 'Modified message' },
        data: { modified: true },
      });
    });
  });
});
