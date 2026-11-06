import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Component tests render into a shared (jsdom) document – remove everything after each test so
// tests cannot influence each other. In plain "node" tests there is nothing to clean up.
afterEach(() => {
  cleanup()
})
