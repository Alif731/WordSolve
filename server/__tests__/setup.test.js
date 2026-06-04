import { describe, it, expect, vi } from 'vitest';
const generateToken = require('../utils/generateToken');

describe('Generate Token Utility', () => {
  it('should call res.cookie with the correct parameters', () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    
    // Set environment variables required by the utility
    process.env.JWT_SECRET = 'supersecretkey12345678901234567890';
    process.env.NODE_ENV = 'development';
    
    generateToken(mockRes, '12345');
    
    expect(mockRes.cookie).toHaveBeenCalled();
    const args = mockRes.cookie.mock.calls[0];
    
    // First arg is cookie name 'jwt'
    expect(args[0]).toBe('jwt');
    // Second arg is the token itself (string)
    expect(typeof args[1]).toBe('string');
    // Third arg is the cookie options
    expect(args[2]).toHaveProperty('httpOnly', true);
    expect(args[2]).toHaveProperty('sameSite', 'strict');
  });

  it('should clear token correctly', () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    
    generateToken.clearTokenCookie(mockRes);
    
    expect(mockRes.cookie).toHaveBeenCalled();
    const args = mockRes.cookie.mock.calls[0];
    
    expect(args[0]).toBe('jwt');
    expect(args[1]).toBe('');
    expect(args[2].maxAge).toBe(0);
  });
});
