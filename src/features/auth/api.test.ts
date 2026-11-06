import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './api'

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'E-Mail oder Passwort ist falsch.'],
    ['email_not_confirmed', 'Bitte bestätige zuerst deine E-Mail-Adresse.'],
    ['user_already_exists', 'Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.'],
    ['email_exists', 'Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.'],
    ['weak_password', 'Das Passwort ist zu schwach. Nimm mindestens 8 Zeichen.'],
    [
      'over_request_rate_limit',
      'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.',
    ],
  ])('translates %s into German', (code, message) => {
    expect(authErrorMessage({ code })).toBe(message)
  })

  it('falls back to a generic message for unknown or missing errors', () => {
    const generic = 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.'
    expect(authErrorMessage({ code: 'something_new' })).toBe(generic)
    expect(authErrorMessage(null)).toBe(generic)
    expect(authErrorMessage(new Error('boom'))).toBe(generic)
  })
})
