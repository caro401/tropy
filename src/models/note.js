'use strict'

const { json, stringify } = require('../common/util')

const mod = {
  note: {
    async create(db, { state, text, id: parent }) {
      const { id } = await db.run(`
        INSERT INTO notes (id, state, text) VALUES (?,?,?)`,
        parent, stringify(state), text
      )

      return (await mod.note.load(db, [id]))[id]
    },

    async load(db, ids) {
      const notes = {}

      if (ids.length) {
        await db.each(`
          SELECT
              note_id AS note,
              photos.id AS photo,
              selections.id AS selection,
              state,
              text,
              language,
              datetime(modified, "localtime") AS modified
            FROM notes
              LEFT OUTER JOIN photos USING (id)
              LEFT OUTER JOIN selections USING (id)
            WHERE note_id IN (${ids.join(',')})
              AND deleted IS NULL
            ORDER BY created ASC`,

          ({ note: id, modified, state, ...data }) => {
            notes[id] = {
              ...data,
              id,
              modified: new Date(modified),
              state: json(state),
              deleted: false
            }
          }
        )
      }

      return notes
    },

    async save(db, { id, state, text }, timestamp = Date.now()) {
      return db.run(`
        UPDATE notes
          SET state = ?, text = ?, modified = datetime(?)
          WHERE note_id = ?`,
          stringify(state), text, new Date(timestamp).toISOString(), id
      )
    },

    async delete(db, ids) {
      return db.run(`
        UPDATE notes
          SET deleted = datetime("now")
          WHERE note_id IN (${ids.join(',')})`
      )
    },

    async restore(db, ids) {
      return db.run(`
        UPDATE notes
          SET deleted = NULL
          WHERE note_id IN (${ids.join(',')})`
      )
    },

    async prune(db) {
      return db.run(`
        DELETE FROM notes WHERE deleted IS NOT NULL`
      )
    }
  }
}

module.exports = mod.note
