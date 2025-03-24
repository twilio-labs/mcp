import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetAllMocks();
});

vi.mock('@app/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    child: () => ({
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));
