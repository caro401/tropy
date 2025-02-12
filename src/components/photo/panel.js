import React from 'react'
import { connect } from 'react-redux'
import { PhotoGrid } from './grid'
import { PhotoList } from './list'
import { SASS } from '../../constants'
import * as act from '../../actions'
import { number } from 'prop-types'
import { getExpandedPhotos } from '../../selectors'


class PhotoPanel extends React.PureComponent {
  render() {
    let { zoom, ...props } = this.props
    let PhotoIterator = (zoom > 0) ? PhotoGrid : PhotoList

    return (
      <PhotoIterator {...props} size={SASS.PHOTO.ZOOM[zoom]}/>
    )
  }

  static propTypes = {
    zoom: number
  }
}

const PhotoPanelContainer = connect(
    state => ({
      current: state.nav.photo,
      edit: state.edit,
      data: state.metadata,
      expandedPhotos: getExpandedPhotos(state),
      keymap: state.keymap,
      selection: state.nav.selection,
      selections: state.selections
    }),

    dispatch => ({
      onContract(...args) {
        dispatch(act.photo.contract(...args))
      },

      onDelete(payload) {
        if (payload.selections == null) {
          dispatch(act.photo.delete(payload))
        } else {
          dispatch(act.selection.delete(payload))
        }
      },

      onExpand(...args) {
        dispatch(act.photo.expand(...args))
      },

      onItemPreview(...args) {
        dispatch(act.item.preview(...args))
      },

      onPhotoRotate(...args) {
        dispatch(act.photo.rotate(...args))
      },

      onSelectionSort(...args) {
        dispatch(act.selection.order(...args))
      },

      onSort(...args) {
        dispatch(act.photo.order(...args))
      }
    })
  )(PhotoPanel)

export {
  PhotoPanelContainer as PhotoPanel
}
