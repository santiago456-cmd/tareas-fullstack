import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// jsdom no implementa los diálogos nativos; el comportamiento real se prueba con Chromium.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
  this.querySelector('input, button')?.focus()
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
