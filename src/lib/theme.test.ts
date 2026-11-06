// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initTheme, useTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
})

describe('theme', () => {
  it('is dark by default', () => {
    initTheme()
    expect(document.documentElement).not.toHaveClass('light')
    expect(renderHook(() => useTheme()).result.current.theme).toBe('dark')
  })

  it('restores a saved light theme on start', () => {
    localStorage.setItem('helphub-theme', 'light')
    initTheme()
    expect(document.documentElement).toHaveClass('light')
  })

  it('toggles, saves the choice and updates the page class', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('helphub-theme')).toBe('light')
    expect(document.documentElement).toHaveClass('light')

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).not.toHaveClass('light')
  })
})
