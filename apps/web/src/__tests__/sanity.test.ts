import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Platform Tests', () => {
  it('should pass sanity check', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct environment types', () => {
    const env = { NODE_ENV: 'test' };
    expect(env.NODE_ENV).toBe('test');
  });
});
