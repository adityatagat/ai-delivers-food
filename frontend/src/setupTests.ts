import '@testing-library/jest-dom';
import React from 'react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Google Maps
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: jest.fn(() => 'div'),
  LoadScript: jest.fn(({ children }) => children),
  Marker: jest.fn(() => 'div'),
})); 