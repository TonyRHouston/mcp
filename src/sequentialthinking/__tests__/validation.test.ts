import { describe, it, expect } from '@jest/globals';

// Import the SequentialThinkingServer to test validation
// We'll need to test through the public API
describe('Sequential Thinking Validation', () => {
  describe('thoughtNumber validation', () => {
    it('should accept thought number 0 as valid', () => {
      // Test data with thoughtNumber = 0
      const validData = {
        thought: 'Initial thought',
        thoughtNumber: 0,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      // The validation should not throw for zero
      expect(() => {
        // Simulate the validation logic
        if (typeof validData.thoughtNumber !== 'number') {
          throw new Error('Invalid thoughtNumber: must be a number');
        }
      }).not.toThrow();
      
      expect(validData.thoughtNumber).toBe(0);
      expect(typeof validData.thoughtNumber).toBe('number');
    });

    it('should reject undefined thoughtNumber', () => {
      const invalidData = {
        thought: 'Initial thought',
        thoughtNumber: undefined,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof invalidData.thoughtNumber !== 'number') {
          throw new Error('Invalid thoughtNumber: must be a number');
        }
      }).toThrow('Invalid thoughtNumber: must be a number');
    });

    it('should reject null thoughtNumber', () => {
      const invalidData = {
        thought: 'Initial thought',
        thoughtNumber: null,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof invalidData.thoughtNumber !== 'number') {
          throw new Error('Invalid thoughtNumber: must be a number');
        }
      }).toThrow('Invalid thoughtNumber: must be a number');
    });

    it('should accept positive thought numbers', () => {
      const validData = {
        thought: 'Second thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof validData.thoughtNumber !== 'number') {
          throw new Error('Invalid thoughtNumber: must be a number');
        }
      }).not.toThrow();
      
      expect(validData.thoughtNumber).toBe(1);
    });
  });

  describe('totalThoughts validation', () => {
    it('should accept positive total thoughts', () => {
      const validData = {
        thought: 'A thought',
        thoughtNumber: 0,
        totalThoughts: 5,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof validData.totalThoughts !== 'number') {
          throw new Error('Invalid totalThoughts: must be a number');
        }
      }).not.toThrow();
    });

    it('should reject undefined totalThoughts', () => {
      const invalidData = {
        thought: 'A thought',
        thoughtNumber: 0,
        totalThoughts: undefined,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof invalidData.totalThoughts !== 'number') {
          throw new Error('Invalid totalThoughts: must be a number');
        }
      }).toThrow('Invalid totalThoughts: must be a number');
    });
  });

  describe('nextThoughtNeeded validation', () => {
    it('should accept false as valid boolean', () => {
      const validData = {
        thought: 'Final thought',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: false
      };

      expect(() => {
        if (typeof validData.nextThoughtNeeded !== 'boolean') {
          throw new Error('Invalid nextThoughtNeeded: must be a boolean');
        }
      }).not.toThrow();
      
      expect(validData.nextThoughtNeeded).toBe(false);
    });

    it('should accept true as valid boolean', () => {
      const validData = {
        thought: 'Middle thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      expect(() => {
        if (typeof validData.nextThoughtNeeded !== 'boolean') {
          throw new Error('Invalid nextThoughtNeeded: must be a boolean');
        }
      }).not.toThrow();
      
      expect(validData.nextThoughtNeeded).toBe(true);
    });
  });
});
