'use strict'

const React = require('react')
const {
  arrayOf, bool, func, number, object, oneOf, oneOfType, shape, string
} = require('prop-types')
const { shell } = require('electron')
const { Accordion } = require('../accordion')
const { Button, ButtonGroup } = require('../button')
const { PluginInstance } = require('./instance')
const { injectIntl, intlShape } = require('react-intl')
const { uninstallPrompt } = require('./dialog')


class PluginAccordion extends Accordion {
  handleUninstall = async (event) =>  {
    event.stopPropagation()

    const { cancel } = await uninstallPrompt(this.label)
    if (cancel) return

    this.props.configs.map((config, idx) => {
      this.props.onDelete(this.props.name, idx)
    })
    this.props.onUninstall(this.props.name)
  }

  toggleEnabled = (event) => {
    let disabled = this.isDisabled
    this.props.configs.map((config, idx) => {
      let newConfig = config
      if (disabled) {
        delete newConfig.disabled
      } else {
        newConfig.disabled = true
      }
      this.props.onChange(this.props.name, idx, newConfig)
    })

    if (disabled && !this.configs.length) {
      this.props.onInsert(this.props.name, -1)
    }

    event.stopPropagation()
  }

  get configs() {
    return this.props.configs.filter(c => !c.disabled)
  }

  get isDisabled() {
    return !this.configs.length
  }

  get classes() {
    return {
      ...super.classes,
      disabled: this.isDisabled
    }
  }

  get repoLink() {
    let repo = this.props.repository
    if (typeof repo === 'object' && repo.url) return repo.url
    if (typeof repo !== 'string') return
    if (repo.startsWith('http')) return repo
    return repo
      .replace(/^github:/, 'https://github.com/')
      .replace(/^gitlab:/, 'https://gitlab.com/')
      .replace(/^bitbucket:/, 'https://bitbucket.org/')
  }

  get canUninstall() {
    return this.props.source === 'directory'
  }

  get label() {
    return this.props.label || this.props.name
  }

  renderLink(id, url, ...options) {
    const { intl } = this.props
    const title = intl.formatMessage(
      { id: `prefs.plugins.${id}` }, ...options)
    return (
      // eslint-disable-next-line react/jsx-no-bind
      <a onClick={() => shell.openExternal(url)}>{title}</a>
    )
  }

  get renderNoinfo() {
    const { intl } = this.props
    const text = intl.formatMessage({ id: 'prefs.plugins.noinfo' })
    return <p className="noinfo">{text}</p>
  }

  renderHeader() {
    const { isDisabled } = this
    return super.renderHeader(
      <div className="panel-header-container">
        <h1 className="panel-heading">
          {this.label}
          {' '}
          <small className="version">{this.props.version}</small>
        </h1>
        <p className="description">{this.props.description}</p>
        <div className="flex-row justify-content-between center">
          {this.repoLink && this.renderLink('repository', this.repoLink)}
          {!this.repoLink && this.renderNoinfo}
          <ButtonGroup>
            <Button
              isDefault
              text={'prefs.plugins.' + (isDisabled ? 'enable' : 'disable')}
              isActive={isDisabled}
              onClick={this.toggleEnabled}/>
            {this.canUninstall &&
              <Button
                isDefault
                text="prefs.plugins.uninstall"
                onClick={this.handleUninstall}/>}
          </ButtonGroup>
        </div>
      </div>
    )
  }

  renderBody() {
    return super.renderBody(
      <ul>
        {this.configs.map(
           (config, idx) =>
             <PluginInstance
               key={idx}
               index={idx}
               guiOptions={this.props.options}
               config={config}
               name={config.name}
               options={config.options}
               onChange={this.props.onChange}
               onDelete={this.props.onDelete}
               onInsert={this.props.onInsert}
               plugin={config.plugin} />
        )}
      </ul>
    )
  }

  static propTypes = {
    name: string.isRequired,
    label: string,
    version: string,
    description: string,
    source: string.isRequired,
    repository: oneOfType([string, object]),
    onChange: func.isRequired,
    onDelete: func.isRequired,
    onInsert: func.isRequired,
    onUninstall: func.isRequired,
    configs: arrayOf(object),
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      default: oneOfType([string, bool, number]),
      hint: string,
      type: oneOf(['string', 'bool', 'boolean', 'number']),
      label: string.isRequired
    })),
    hooks: object,
    intl: intlShape.isRequired
  }
  static defaultProps = {
    ...Accordion.defaultProps,
    version: '',
    options: [],
    hooks: {}
  }
}

module.exports = {
  PluginAccordion: injectIntl(PluginAccordion)
}
