import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetAllMocks();
});

vi.mock('@app/utils', async () => {
  const actual = await vi.importActual('@app/utils');
  return {
    ...actual,
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
      child: () => ({
        debug: vi.fn(),
        error: vi.fn(),
      }),
    },
  };
});
