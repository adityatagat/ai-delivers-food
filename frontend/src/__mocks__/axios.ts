const mockAxios: any = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => mockAxios),
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default mockAxios; 