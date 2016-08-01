'use strict'

const { all } = require('bluebird')
const { remote, ipcRenderer: ipc } = require('electron')
const { basename, resolve } = require('path')
const { existsSync: exists } = require('fs')
const { EL_CAPITAN } = require('./common/os')
const {
  $$, append, create, on, once, toggle, stylesheet, remove
} = require('./dom')

const Window = {

  get current() {
    return remote.getCurrentWindow()
  },

  get type() {
    return basename(window.location.pathname, '.html')
  },

  styles(theme = ARGS.theme) {
    return [
      `../lib/stylesheets/${process.platform}/${Window.type}-${theme}.css`,
      `${ARGS.home}/style.css`,
      `${ARGS.home}/style-${theme}.css`
    ]
  },

  style(theme = ARGS.theme, prune = false) {
    var css

    if (prune) {
      for (css of $$('head > link[rel="stylesheet"]')) remove(css)
    }

    for (css of Window.styles(theme)) {
      if (exists(resolve(__dirname, css))) {
        append(stylesheet(css), document.head)
      }
    }
  },

  toggle(state) {
    switch (state) {
      case 'focus':
        toggle(document.body, 'is-blurred', false)
        break
      case 'blur':
        toggle(document.body, 'is-blurred', true)
        break
      case 'maximize':
        toggle(document.body, 'is-maximized', true)
        break
      case 'unmaximize':
        toggle(document.body, 'is-maximized', false)
        break
    }
  },

  setup() {
    if (!Window.setup.called) {
      Window.setup.called = true
      Window.style()

      ipc
        .on('win', (_, state) => this.toggle(state))
        .on('theme', (_, theme) => this.style(theme, true))


      Window.closeable = false

      once(window, 'beforeunload', event => {
        event.returnValue = false
        toggle(document.body, 'closing', true)

        all(Window.unloaders, unload => unload())
          .then(() => Window.closeable = true)
          .then(() => Window.current.close())
      })

      on(window, 'beforeunload', event => {
        if (!Window.closeable) event.returnValue = false
      })


      if (ARGS.frameless) {
        toggle(document.body, 'frameless', true)

        if (EL_CAPITAN) {
          toggle(document.body, 'el-capitan', true)

        } else {
          Window.controls = {
            close: create('button', { tabindex: '-1', class: 'close' }),
            min: create('button', { tabindex: '-1', class: 'minimize' }),
            max: create('button', { tabindex: '-1', class: 'maximize' })
          }

          on(Window.controls.close, 'click', () =>
              Window.current.close())

          if (Window.current.isMinimizable()) {
            on(Window.controls.min, 'click', () =>
                Window.current.minimize())

          } else {
            toggle(document.body, 'not-minimizable', true)
          }

          if (Window.current.isMaximizable()) {
            on(Window.controls.max, 'click', () =>
                Window.current.isMaximized() ?
                  Window.current.unmaximize() : Window.current.maximize())

          } else {
            toggle(document.body, 'not-maximizable', true)
          }

          const div = create('div', { class: 'window-controls' })

          append(Window.controls.close, div)
          append(Window.controls.min, div)
          append(Window.controls.max, div)

          append(div, document.body)
        }
      }
    }
  }
}

Window.unloaders = []

module.exports = Window
