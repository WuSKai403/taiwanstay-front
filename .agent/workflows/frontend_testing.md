---
description: Standard workflow for adding and running frontend unit tests
---

# Frontend Testing Workflow

Follow this workflow to efficiently add and run tests while minimizing token consumption.

## 1. Preparation
Before asking the AI to write tests, ensure you have:
- The target component file (e.g., `components/ui/Button.tsx`)
- The intended test file path (e.g., `components/ui/__tests__/Button.test.tsx`)

## 2. Token Saving Context
When prompting the AI, **ONLY** provide:
1.  The code of the component you want to test.
2.  (Optional) One "Golden Sample" test file (e.g., `components/ui/__tests__/FormField.test.tsx`) if you want it to follow a specific style.
3.  **DO NOT** provide `package.json`, `jest.config.js`, or unrelated files unless specifically debugging configuration.

## 3. Creating the Test
Use the following template structure (based on our Golden Samples):

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    // Assertions
  });
});
```

## 4. Running Tests efficiently
**DO NOT** run `npm test` (which runs everything).
**ALWAYS** run only the specific test file you are working on:

```bash
npm test components/path/to/YourTest.test.tsx
```

## 5. Verification
- If the test fails, read the error message carefully.
- Only if the error mentions "configuration" or "module not found" should you check `jest.config.js`.
