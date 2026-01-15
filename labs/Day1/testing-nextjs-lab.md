# Testing Next.js Applications Workshop

## Workshop Overview

In this practical workshop, you will learn essential testing techniques for Next.js applications using the Polar H10 Heart Rate Dashboard. You'll configure Jest, write component tests with React Testing Library, mock API calls, create snapshot tests, and implement end-to-end tests with Playwright.

### Learning Objectives

By the end of this workshop, you will be able to:
- Configure Jest and React Testing Library for Next.js applications
- Write unit tests for React components
- Test custom hooks with proper mocking strategies
- Mock API calls and external dependencies
- Create and maintain snapshot tests
- Set up and run end-to-end tests with Playwright
- Understand testing best practices and patterns

---

## Task 1: Jest Configuration and Testing Library Setup

### Overview
Set up Jest and React Testing Library in the Next.js application. You'll install the necessary dependencies, configure Jest for the Next.js environment, and create your first test to verify the setup works correctly.

### Step-by-Step Instructions

1. **Navigate to the frontend directory:**
   ```bash
   cd polarh10-frontend
   ```

2. **Install testing dependencies:**
   ```bash
   npm install --save-dev jest@29 jest-environment-jsdom@29 @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-node
   ```
   
   These packages provide:
   - `jest@29` - JavaScript testing framework (version 29 for Next.js compatibility)
   - `jest-environment-jsdom@29` - Browser-like environment for tests
   - `@testing-library/react` - React component testing utilities
   - `@testing-library/jest-dom` - Custom matchers for DOM assertions
   - `@testing-library/user-event` - Simulates user interactions
   - `@types/jest` - TypeScript type definitions for Jest globals
   - `ts-node` - TypeScript execution for Jest config

3. **Create Jest configuration file:**
   
   Create `polarh10-frontend/jest.config.ts`:
   
   ```typescript
   import type { Config } from 'jest';
   import nextJest from 'next/jest';
   
   const createJestConfig = nextJest({
     // Provide the path to your Next.js app to load next.config.js and .env files
     dir: './',
   });
   
   // Add any custom config to be passed to Jest
   const config: Config = {
     // Use jsdom environment for component testing
     testEnvironment: 'jsdom',
     
     // Setup files to run before each test
     setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
     
     // Module path aliases (match tsconfig paths)
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     
     // Test file patterns
     testMatch: [
       '**/__tests__/**/*.[jt]s?(x)',
       '**/?(*.)+(spec|test).[jt]s?(x)',
     ],
     
     // Coverage configuration
     collectCoverageFrom: [
       'src/**/*.{js,jsx,ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/index.ts',
     ],
     
     // Ignore patterns
     testPathIgnorePatterns: [
       '<rootDir>/node_modules/',
       '<rootDir>/.next/',
       '<rootDir>/e2e/', // E2E tests will use Playwright
     ],
   };
   
   // createJestConfig is exported this way to ensure that next/jest can load the Next.js config
   export default createJestConfig(config);
   ```

4. **Create Jest setup file:**
   
   Create `polarh10-frontend/jest.setup.ts`:
   
   ```typescript
   import '@testing-library/jest-dom';

   // Mock fetch globally (required for Next.js 16+)
   global.fetch = jest.fn().mockResolvedValue({
     ok: true,
     json: () => Promise.resolve({}),
   } as Response);
   
   // Mock Next.js router
   jest.mock('next/navigation', () => ({
     useRouter() {
       return {
         push: jest.fn(),
         replace: jest.fn(),
         prefetch: jest.fn(),
         back: jest.fn(),
       };
     },
     usePathname() {
       return '/';
     },
     useSearchParams() {
       return new URLSearchParams();
     },
   }));
   
   // Mock window.matchMedia
   Object.defineProperty(window, 'matchMedia', {
     writable: true,
     value: jest.fn().mockImplementation((query) => ({
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
   
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

5. **Update tsconfig.json to include Jest types:**
   
   Add Jest and testing-library types to `polarh10-frontend/tsconfig.json` in the `compilerOptions`:
   
   ```json
   {
     "compilerOptions": {
       // ... existing options ...
       "types": ["jest", "node", "@testing-library/jest-dom"]
     }
   }
   ```

6. **Add test scripts to package.json:**
   
   Update the `scripts` section in `polarh10-frontend/package.json`:
   
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "eslint",
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

7. **Create a test directory structure:**
   ```bash
   mkdir -p src/__tests__/components
   mkdir -p src/__tests__/hooks
   mkdir -p src/__tests__/lib
   ```

8. **Create your first test to verify setup:**
   
   Create `polarh10-frontend/src/__tests__/setup.test.ts`:
   
   ```typescript
   describe('Jest Setup', () => {
     it('should run tests correctly', () => {
       expect(true).toBe(true);
     });
   
     it('should have access to jest-dom matchers', () => {
       const element = document.createElement('div');
       element.textContent = 'Hello';
       document.body.appendChild(element);
       
       expect(element).toBeInTheDocument();
       expect(element).toHaveTextContent('Hello');
       
       document.body.removeChild(element);
     });
   
     it('should resolve path aliases', async () => {
       const module = await import('@/lib/api');
       expect(module).toBeDefined();
     });
   });
   ```

9. **Run the test to verify setup:**
   ```bash
   npm test
   ```
   
   You should see output similar to:
   ```
   PASS  src/__tests__/setup.test.ts
     Jest Setup
       ✓ should run tests correctly
       ✓ should have access to jest-dom matchers
       ✓ should resolve path aliases
   
   Test Suites: 1 passed, 1 total
   Tests:       3 passed, 3 total
   ```

### Key Concepts

- **Jest Configuration:** `next/jest` provides a pre-configured Jest setup that handles Next.js specifics (SWC transforms, CSS modules, etc.)
- **Test Environment:** `jsdom` simulates a browser environment for component testing
- **Setup Files:** `setupFilesAfterEnv` runs after Jest is installed but before tests, perfect for extending expect matchers
- **Module Aliases:** `moduleNameMapper` ensures `@/` imports work in tests just like in your app
- **Testing Library:** Provides utilities for testing React components the way users interact with them

---

## Task 2: Component Testing with React Testing Library

### Overview
Write unit tests for React components using React Testing Library. You'll test the `StatsCard` component, learning how to query elements, simulate user interactions, and write meaningful assertions.

### Step-by-Step Instructions

1. **Create tests for the StatsCard component:**
   
   Create `polarh10-frontend/src/__tests__/components/StatsCard.test.tsx`:
   
   ```tsx
   import { render, screen } from '@testing-library/react';
   import { StatsCard } from '@/components/StatsCard';
   
   // Mock icon component for testing
   function MockIcon({ className }: { className?: string }) {
     return <svg data-testid="mock-icon" className={className} />;
   }
   
   describe('StatsCard', () => {
     it('renders the title correctly', () => {
       render(
         <StatsCard
           title="Average BPM"
           value={75}
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('Average BPM')).toBeInTheDocument();
     });
   
     it('renders the value with unit', () => {
       render(
         <StatsCard
           title="Heart Rate"
           value={72}
           unit="BPM"
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('72')).toBeInTheDocument();
       expect(screen.getByText('BPM')).toBeInTheDocument();
     });
   
     it('renders dash when value is null', () => {
       render(
         <StatsCard
           title="No Data"
           value={null}
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('—')).toBeInTheDocument();
     });
   
     it('renders subtitle when provided', () => {
       render(
         <StatsCard
           title="Readings"
           value={150}
           subtitle="Last 5 min"
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('Last 5 min')).toBeInTheDocument();
     });
   
     it('renders trend indicator for up trend', () => {
       render(
         <StatsCard
           title="BPM"
           value={80}
           trend="up"
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('↑')).toBeInTheDocument();
     });
   
     it('renders trend indicator for down trend', () => {
       render(
         <StatsCard
           title="BPM"
           value={65}
           trend="down"
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByText('↓')).toBeInTheDocument();
     });
   
     it('renders icon', () => {
       render(
         <StatsCard
           title="Test"
           value={100}
           icon={<MockIcon />}
         />
       );
       
       expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
     });
   
     it('applies primary variant styles', () => {
       const { container } = render(
         <StatsCard
           title="Primary"
           value={75}
           variant="primary"
           icon={<MockIcon />}
         />
       );
       
       // Check that the icon container has the primary variant class
       const iconContainer = container.querySelector('[class*="accent-primary"]');
       expect(iconContainer).toBeInTheDocument();
     });
    });
   ```

2. **Run the component tests:**
   ```bash
   npm test -- --testPathPattern=components
   ```
   
   You should see all tests passing:
   ```
   PASS  src/__tests__/components/StatsCard.test.tsx
   
   Test Suites: 1 passed, 1 total
   Tests:       8 passed, 8 total
   ```

3. **Run tests in watch mode for development:**
   ```bash
   npm run test:watch
   ```
   
   This will re-run tests automatically when you modify files. Press `q` to quit.

### Key Concepts

- **render():** Renders a React component into a virtual DOM for testing
- **screen:** Global object to query rendered elements
- **Query Methods:**
  - `getByText` - Find by text content (throws if not found)
  - `getByTestId` - Find by `data-testid` attribute
  - `container.querySelector` - Find by CSS selector for class-based queries
- **Assertions:** `toBeInTheDocument()`, `toHaveTextContent()` from jest-dom
- **Test Structure:** Use `describe` blocks to group related tests and `it` blocks for individual test cases

---

## Task 3: API Mocking and Hook Testing

### Overview
Learn how to test React hooks that make API calls by mocking the global `fetch` function. You'll test the `useHeartRate` hook and verify it correctly fetches and returns data.

### Step-by-Step Instructions

1. **Create tests for the useHeartRate hook:**
   
   Create `polarh10-frontend/src/__tests__/hooks/useHeartRate.test.tsx`:
   
   ```tsx
   import { renderHook, waitFor } from '@testing-library/react';
   import { useHeartRate } from '@/hooks/useHeartRate';
   
   // Mock data
   const mockLatestReading = {
     id: 1,
     bpm: 72,
     rr_interval: 833,
     created_at: '2025-01-01T12:00:00Z',
   };
   
   const mockStats = {
     count: 100,
     avg_bpm: 75,
     min_bpm: 60,
     max_bpm: 95,
   };
   
   const mockReadings = {
     count: 2,
     results: [
       { id: 1, bpm: 72, created_at: '2025-01-01T12:00:00Z' },
       { id: 2, bpm: 78, created_at: '2025-01-01T11:59:00Z' },
     ],
   };
   
    // Helper to create mock fetch responses using URL-based matching
    // This handles parallel calls from Promise.all correctly
    function mockFetchResponses() {
    const mockFetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/config')) {
        return Promise.resolve({ ok: false });
        }
        if (url.includes('/api/heartrate/latest')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLatestReading),
        });
        }
        if (url.includes('/api/heartrate/stats')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
        });
        }
        if (url.includes('/api/heartrate')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockReadings),
        });
        }
        return Promise.reject(new Error('Unknown URL'));
    });
    
    global.fetch = mockFetch;
    return mockFetch;
    }
   
   describe('useHeartRate', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });
   
     it('fetches and returns heart rate data', async () => {
       mockFetchResponses();
       
       const { result } = renderHook(() => 
         useHeartRate({ enabled: true, refreshInterval: 10000 })
       );
       
       // Initially loading
       expect(result.current.isLoading).toBe(true);
       
       // Wait for data to load
       await waitFor(() => {
         expect(result.current.isLoading).toBe(false);
       });
       
       // Check the hook returns the mocked data
       expect(result.current.latestReading?.bpm).toBe(72);
       expect(result.current.stats?.avg_bpm).toBe(75);
       expect(result.current.history).toHaveLength(2);
       expect(result.current.isConnected).toBe(true);
       expect(result.current.error).toBeNull();
     });
   
     it('handles API errors gracefully', async () => {
       // Mock a failed response
       global.fetch = jest.fn()
         .mockResolvedValueOnce({ ok: false })
         .mockRejectedValueOnce(new Error('Network error'));
       
       const { result } = renderHook(() => 
         useHeartRate({ enabled: true, refreshInterval: 10000 })
       );
       
       await waitFor(() => {
         expect(result.current.isLoading).toBe(false);
       });
       
       expect(result.current.error).toBeTruthy();
     });
   
     it('does not fetch when disabled', async () => {
       const mockFetch = jest.fn();
       global.fetch = mockFetch;
       
       renderHook(() => useHeartRate({ enabled: false }));
       
       // Give it time to potentially make calls
       await new Promise(resolve => setTimeout(resolve, 100));
       
       expect(mockFetch).not.toHaveBeenCalled();
     });
   });
   ```

2. **Run the hook tests:**
   ```bash
   npm test -- --testPathPattern=useHeartRate
   ```
   
   You should see:
   ```
   PASS  src/__tests__/hooks/useHeartRate.test.tsx
   
   Test Suites: 1 passed, 1 total
   Tests:       3 passed, 3 total
   ```

### Key Concepts

- **renderHook:** Testing Library utility to render and test React hooks
- **Mocking fetch:** Replace `global.fetch` with `jest.fn()` to control API responses
- **mockResolvedValueOnce:** Chain multiple calls to mock sequential fetch requests
- **waitFor:** Wait for async operations (like API calls) to complete
- **Testing hook state:** Access `result.current` to check the hook's returned values

---

## Task 4: Snapshot Testing

### Overview
Create snapshot tests to capture the rendered output of components. Snapshots help detect unintended UI changes and serve as a form of regression testing. You'll experience the full snapshot workflow: creating snapshots, seeing them fail when code changes, and updating them.

### Step-by-Step Instructions

1. **Create initial snapshot tests for StatsCard (with only 3 variants):**
   
   Create `polarh10-frontend/src/__tests__/components/StatsCard.snapshot.test.tsx`:
   
   ```tsx
   import { render } from '@testing-library/react';
   import { StatsCard } from '@/components/StatsCard';
   
   function MockIcon() {
     return <svg data-testid="icon">Icon</svg>;
   }
   
   describe('StatsCard Snapshots', () => {
     it('matches snapshot with all props', () => {
       const { container } = render(
         <StatsCard
           title="Average BPM"
           value={75}
           unit="BPM"
           icon={<MockIcon />}
           trend="up"
           subtitle="Last 5 minutes"
           variant="primary"
         />
       );
       
       expect(container).toMatchSnapshot();
     });
   
     it('matches snapshot with null value', () => {
       const { container } = render(
         <StatsCard
           title="No Data"
           value={null}
           icon={<MockIcon />}
         />
       );
       
       expect(container).toMatchSnapshot();
     });
   
     it('matches snapshot for each variant', () => {
       // NOTE: We're starting with only 3 variants (no 'warning' yet)
       const variants = ['default', 'primary', 'success'] as const;
       
       variants.forEach((variant) => {
         const { container } = render(
           <StatsCard
             title={`${variant} variant`}
             value={50}
             icon={<MockIcon />}
             variant={variant}
           />
         );
         
         expect(container).toMatchSnapshot(`${variant} variant`);
       });
     });
   });
   ```

2. **Run tests to generate the initial snapshots:**
   ```bash
   npm test -- --testPathPattern=snapshot
   ```
   
   You should see:
   ```
   PASS  src/__tests__/components/StatsCard.snapshot.test.tsx
    › 5 snapshots written.
   ```
   
   This creates `src/__tests__/components/__snapshots__/StatsCard.snapshot.test.tsx.snap`.

3. **View the generated snapshot file:**
   
   Open the `.snap` file to see the captured HTML. Notice it contains snapshots for `default`, `primary`, and `success` variants.

4. **Now add the missing 'warning' variant:**
   
   Update the test file - change the variants array to include `'warning'`:
   
   ```tsx
     it('matches snapshot for each variant', () => {
       // Added 'warning' variant
       const variants = ['default', 'primary', 'success', 'warning'] as const;
       
       variants.forEach((variant) => {
         const { container } = render(
           <StatsCard
             title={`${variant} variant`}
             value={50}
             icon={<MockIcon />}
             variant={variant}
           />
         );
         
         expect(container).toMatchSnapshot(`${variant} variant`);
       });
     });
   ```

5. **Run the tests again and observe the failure:**
   ```bash
   npm test -- --testPathPattern=snapshot
   ```
   
   You should see a **failing test**:
   ```
   FAIL  src/__tests__/components/StatsCard.snapshot.test.tsx
    › 1 snapshot failed.
   ```
   
   Jest detected that there's a new snapshot (`warning variant`) that doesn't exist yet!

6. **Update the snapshots to include the new variant:**
   ```bash
   npm test -- --testPathPattern=snapshot --updateSnapshot
   ```
   
   Or run in watch mode (`npm run test:watch`) and press `u` when prompted.
   
   You should now see:
   ```
   PASS  src/__tests__/components/StatsCard.snapshot.test.tsx
    › 1 snapshot updated.
   ```

7. **Verify the snapshot file was updated:**
   
   Open the `.snap` file again - you should now see the `warning variant` snapshot added.

### Key Concepts

- **toMatchSnapshot():** Compares rendered output against stored snapshot
- **Snapshot Files:** Stored in `__snapshots__` directories alongside test files
- **Updating Snapshots:** Use `--updateSnapshot` flag or `u` key in watch mode
- **Inline Snapshots:** Use `toMatchInlineSnapshot()` for small snapshots stored in test file
- **Best Practices:**
  - Review snapshot changes carefully in code reviews
  - Keep snapshots focused (test specific scenarios)
  - Don't snapshot everything - use for stable, visual components

---

## Task 5: End-to-End Testing with Playwright

### Overview
Set up Playwright for end-to-end testing and write tests that simulate real user interactions with the entire application. E2E tests verify that all parts of the application work together correctly.

### Step-by-Step Instructions

1. **Install Playwright:**
   ```bash
   npm init playwright@latest
   ```
   
   When prompted:
   - Choose **e2e** for the tests directory
   - Select **Yes** to add GitHub Actions workflow (optional)
   - Select **Yes** to install Playwright browsers

2. **Update the generated Playwright config:**
   
   Update `polarh10-frontend/playwright.config.ts`:
   
   ```typescript
   import { defineConfig, devices } from '@playwright/test';
   
   export default defineConfig({
     testDir: './e2e',
     
     // Run tests in parallel
     fullyParallel: true,
     
     // Fail the build on CI if you accidentally left test.only in the source code
     forbidOnly: !!process.env.CI,
     
     // Retry on CI only
     retries: process.env.CI ? 2 : 0,
     
     // Opt out of parallel tests on CI
     workers: process.env.CI ? 1 : undefined,
     
     // Reporter to use
     reporter: 'html',
     
     // Shared settings for all the projects below
     use: {
       // Base URL to use in actions like `await page.goto('/')`
       baseURL: 'http://localhost:3000',
       
       // Collect trace when retrying the failed test
       trace: 'on-first-retry',
       
       // Take screenshot on failure
       screenshot: 'only-on-failure',
     },
   
     // Configure projects for major browsers
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
       {
         name: 'firefox',
         use: { ...devices['Desktop Firefox'] },
       },
       {
         name: 'webkit',
         use: { ...devices['Desktop Safari'] },
       },
       // Mobile viewports
       {
         name: 'Mobile Chrome',
         use: { ...devices['Pixel 5'] },
       },
     ],
   
     // Run your local dev server before starting the tests
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120 * 1000,
     },
   });
   ```

3. **Create a test for the dashboard page:**
   
   Create `polarh10-frontend/e2e/dashboard.spec.ts`:
   
   ```typescript
    import { test, expect } from '@playwright/test';

    test.describe('Dashboard', () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to the dashboard
        await page.goto('/');
      });

      test('has correct title and header', async ({ page }) => {
        // Check the page title
        await expect(page).toHaveTitle(/Polar H10/i);
        
        // Check the header is visible
        await expect(page.getByRole('heading', { name: /Polar H10/i })).toBeVisible();
        await expect(page.getByText('Heart Rate Monitor')).toBeVisible();
      });

      test('displays stats cards', async ({ page }) => {
        // Check that all stat cards are present
        await expect(page.getByText('Average BPM')).toBeVisible();
        await expect(page.getByText('Min BPM')).toBeVisible();
        await expect(page.getByText('Max BPM')).toBeVisible();
        await expect(page.getByText('Readings', { exact: true })).toBeVisible();
      });

      test('displays time range selector', async ({ page }) => {
        // Check time range buttons exist
        await expect(page.getByRole('button', { name: '1 min', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: '5 min', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: '15 min', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: '30 min', exact: true })).toBeVisible();
      });

      test('can change time range', async ({ page }) => {
        // Click on 15 min button
        await page.getByRole('button', { name: '15 min' }).click();
        
        // Verify the button is now selected (has primary color)
        const button = page.getByRole('button', { name: '15 min' });
        await expect(button).toHaveClass(/accent-primary/);
        
        // Verify the "Last X minutes" text updates
        await expect(page.getByText('Last 15 minutes')).toBeVisible();
      });

      test('can toggle polling', async ({ page }) => {
        // Find the polling toggle button
        const toggleButton = page.getByRole('button', { name: /Enabled|Disabled/i });
        
        // Should start as Enabled
        await expect(toggleButton).toContainText('Enabled');
        
        // Click to disable
        await toggleButton.click();
        
        // Should now show Disabled
        await expect(toggleButton).toContainText('Disabled');
        
        // Click to re-enable
        await toggleButton.click();
        
        // Should show Enabled again
        await expect(toggleButton).toContainText('Enabled');
      });

      test('displays connection status', async ({ page }) => {
        // Check for connection status indicator (one of these should be visible)
        const connectionStatus = page.getByText('Connected', { exact: true })
          .or(page.getByText('Disconnected', { exact: true }))
          .or(page.getByText('Connecting...', { exact: true }));
        await expect(connectionStatus.first()).toBeVisible();
      });

      test('has refresh button', async ({ page }) => {
        const refreshButton = page.getByRole('button', { name: 'Refresh' });
        await expect(refreshButton).toBeVisible();
        
        // Click refresh and verify it's working (button should be temporarily disabled)
        await refreshButton.click();
        // The button text might change to "Refreshing" briefly
      });

      test('displays heart rate history section', async ({ page }) => {
        await expect(page.getByText('Heart Rate History')).toBeVisible();
      });

      test('displays recent readings table', async ({ page }) => {
        await expect(page.getByText('Recent Readings')).toBeVisible();
      });

      test('footer shows backend URL', async ({ page }) => {
        // Check footer content
        await expect(page.getByText('Polar H10 Heart Rate Dashboard')).toBeVisible();
        await expect(page.getByText('Backend:')).toBeVisible();
      });
    });
   ```

4. **Add Playwright scripts to package.json:**
   
   Update `polarh10-frontend/package.json` scripts:
   
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "eslint",
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:headed": "playwright test --headed"
     }
   }
   ```

5. **Run E2E tests:**
   
   First, make sure the backend is running:
   ```bash
   # In a separate terminal
   cd ../polarh10-backend
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   # source venv/bin/activate
   python manage.py runserver
   ```
   
   Then run the E2E tests:
   ```bash
   cd polarh10-frontend
   npm run test:e2e
   ```
   
   Or run in headed mode to see the browser:
   ```bash
   npm run test:e2e:headed
   ```

6. **Use Playwright UI mode for debugging:**
   ```bash
   npm run test:e2e:ui
   ```
   
   This opens an interactive UI where you can:
   - Watch tests run in real-time
   - Step through tests
   - View screenshots at each step
   - Debug failing tests

7. **View the HTML report:**
   
   After running tests, open the report:
   ```bash
   npx playwright show-report
   ```

8. **Create a failing test to see how errors look:**
   
   Add this intentionally failing test to `e2e/dashboard.spec.ts`:
   
   ```typescript
   test('THIS TEST WILL FAIL - element does not exist', async ({ page }) => {
     // This looks for an element that doesn't exist on the page
     await expect(page.getByText('This Text Does Not Exist On The Page')).toBeVisible();
   });
   ```
   
   Run the tests:
   ```bash
   npm run test:e2e
   ```
   
   You should see output like:
   ```
   FAILED  e2e/dashboard.spec.ts:XX:X
     › Dashboard › THIS TEST WILL FAIL - element does not exist
   ```
   
   HTML report will automatically open (or you can use command):
   ```bash
   npx playwright show-report
   ```
   
   In the report you can see:
   - The failed test highlighted in red
   - Screenshot of the page at the moment of failure
   - Different environments used to test behaviors
   - Error message explaining what went wrong
   - Timeline of actions before the failure
   
   **After exploring the report, remove the failing test from your code.**

### Key Concepts

- **page.goto():** Navigate to a URL
- **page.getByRole():** Find elements by ARIA role (recommended)
- **page.getByText():** Find elements by text content
- **page.locator():** Create a locator for querying elements
- **expect():** Make assertions about page state
- **page.route():** Intercept and mock network requests
- **Headed vs Headless:** Headed shows browser window, headless runs invisibly
- **Test Isolation:** Each test gets a fresh browser context
- **Auto-waiting:** Playwright automatically waits for elements to be ready

---

## Best Practices

1. **Test Pyramid:** Write more unit tests, fewer integration tests, even fewer E2E tests
2. **Test Behavior, Not Implementation:** Focus on what the user sees and does
3. **Keep Tests Independent:** Each test should run in isolation
4. **Use Meaningful Assertions:** Assert on user-visible output
5. **Mock External Dependencies:** Mock APIs, not internal modules
6. **Maintain Snapshots:** Review and update snapshots carefully
7. **Run Tests in CI:** Integrate tests into your deployment pipeline
8. **Use Test Coverage:** Aim for meaningful coverage, not 100%
9. **Write Tests First:** Consider TDD for complex features
10. **Keep Tests Fast:** Slow tests get skipped or ignored

---

## Quick Reference

### Jest Commands
```bash
npm test                    # Run all unit tests
npm run test:watch          # Run in watch mode
npm run test:coverage       # Generate coverage report
npm test -- --updateSnapshot # Update snapshots
npm test -- --testPathPattern=components # Run specific tests
```

### Playwright Commands
```bash
npm run test:e2e           # Run E2E tests headless
npm run test:e2e:headed    # Run with visible browser
npm run test:e2e:ui        # Open interactive UI
npx playwright show-report # View HTML report
npx playwright codegen     # Generate tests by recording
```

---

END LAB
