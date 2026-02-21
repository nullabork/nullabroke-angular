import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@spartan-ng/helm/select': resolve(__dirname, 'libs/ui/select/src/index.ts'),
      '@spartan-ng/helm/utils': resolve(__dirname, 'libs/ui/utils/src/index.ts'),
      '@spartan-ng/helm/icon': resolve(__dirname, 'libs/ui/icon/src/index.ts'),
      '@spartan-ng/helm/input': resolve(__dirname, 'libs/ui/input/src/index.ts'),
      '@spartan-ng/helm/button': resolve(__dirname, 'libs/ui/button/src/index.ts'),
      '@spartan-ng/helm/dropdown-menu': resolve(__dirname, 'libs/ui/dropdown-menu/src/index.ts'),
      '@spartan-ng/helm/table': resolve(__dirname, 'libs/ui/table/src/index.ts'),
      '@spartan-ng/helm/sidebar': resolve(__dirname, 'libs/ui/sidebar/src/index.ts'),
      '@spartan-ng/helm/separator': resolve(__dirname, 'libs/ui/separator/src/index.ts'),
      '@spartan-ng/helm/sheet': resolve(__dirname, 'libs/ui/sheet/src/index.ts'),
      '@spartan-ng/helm/skeleton': resolve(__dirname, 'libs/ui/skeleton/src/index.ts'),
      '@spartan-ng/helm/tooltip': resolve(__dirname, 'libs/ui/tooltip/src/index.ts'),
      '@spartan-ng/helm/collapsible': resolve(__dirname, 'libs/ui/collapsible/src/index.ts'),
      '@spartan-ng/helm/context-menu': resolve(__dirname, 'libs/ui/context-menu/src/index.ts'),
      '@spartan-ng/helm/dialog': resolve(__dirname, 'libs/ui/dialog/src/index.ts'),
      '@spartan-ng/helm/input-group': resolve(__dirname, 'libs/ui/input-group/src/index.ts'),
      '@spartan-ng/helm/textarea': resolve(__dirname, 'libs/ui/textarea/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.model.ts',
        'src/test-setup.ts',
      ],
    },
  },
});

