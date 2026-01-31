import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { applyFileEdits } from '../lib.js';

describe('File Edit Ambiguity Detection', () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create a temporary directory for tests
    testDir = await fs.mkdtemp(join(tmpdir(), 'mcp-edit-test-'));
    testFile = join(testDir, 'test-file.txt');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect when old text appears multiple times', async () => {
    // Create a file with duplicate content
    const content = `function test() {
  console.log("hello");
}

function test() {
  console.log("hello");
}`;
    await fs.writeFile(testFile, content);

    // Try to edit with ambiguous old text
    await expect(
      applyFileEdits(testFile, [
        {
          oldText: 'console.log("hello");',
          newText: 'console.log("world");',
        },
      ])
    ).rejects.toThrow(/Ambiguous edit.*appears multiple times/);
  });

  it('should allow edit when old text appears only once', async () => {
    const content = `function test1() {
  console.log("hello");
}

function test2() {
  console.log("goodbye");
}`;
    await fs.writeFile(testFile, content);

    // Edit should succeed
    await applyFileEdits(testFile, [
      {
        oldText: 'console.log("hello");',
        newText: 'console.log("world");',
      },
    ]);

    const result = await fs.readFile(testFile, 'utf-8');
    expect(result).toContain('console.log("world");');
    expect(result).toContain('console.log("goodbye");');
  });

  it('should handle unique multi-line edits', async () => {
    const content = `First block:
line 1
line 2

Second block:
line 3
line 4`;
    await fs.writeFile(testFile, content);

    await applyFileEdits(testFile, [
      {
        oldText: 'line 1\nline 2',
        newText: 'modified 1\nmodified 2',
      },
    ]);

    const result = await fs.readFile(testFile, 'utf-8');
    expect(result).toContain('modified 1');
    expect(result).toContain('modified 2');
    expect(result).toContain('line 3');
    expect(result).toContain('line 4');
  });

  it('should detect ambiguous multi-line content', async () => {
    const content = `Block 1:
line 1
line 2

Block 2:
line 1
line 2`;
    await fs.writeFile(testFile, content);

    await expect(
      applyFileEdits(testFile, [
        {
          oldText: 'line 1\nline 2',
          newText: 'modified',
        },
      ])
    ).rejects.toThrow(/Ambiguous edit/);
  });

  it('should allow sequential non-ambiguous edits', async () => {
    const content = `function a() {
  return 1;
}
function b() {
  return 2;
}`;
    await fs.writeFile(testFile, content);

    // Multiple unique edits should work
    await applyFileEdits(testFile, [
      {
        oldText: 'return 1;',
        newText: 'return 10;',
      },
      {
        oldText: 'return 2;',
        newText: 'return 20;',
      },
    ]);

    const result = await fs.readFile(testFile, 'utf-8');
    expect(result).toContain('return 10;');
    expect(result).toContain('return 20;');
  });
});
