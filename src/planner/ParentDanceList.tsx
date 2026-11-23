import SongField from './SongField'
import { blankParentDance, parseExtraParentDances, serializeExtraParentDances, type ExtraParentDance } from './parentDances'

export default function ParentDanceList({
  value,
  formats,
  onChange,
}: {
  value: string
  formats: readonly string[]
  onChange: (value: string) => void
}) {
  const dances = parseExtraParentDances(value)

  function write(next: ExtraParentDance[]) {
    onChange(serializeExtraParentDances(next))
  }

  function update(id: string, patch: Partial<ExtraParentDance>) {
    write(dances.map((dance) => (dance.id === id ? { ...dance, ...patch } : dance)))
  }

  return (
    <div className="planner-extra-dances">
      {dances.map((dance, index) => (
        <div className="planner-extra-dance" key={dance.id}>
          <div className="planner-subhead-row">
            <h3 className="planner-subhead">{dance.title.trim() || `Parent dance ${index + 1}`}</h3>
            <div className="planner-section__tools">
              <button type="button" onClick={() => write(dances.filter((item) => item.id !== dance.id))}>
                Remove
              </button>
            </div>
          </div>
          <label className="planner-field">
            <span>Who is dancing?</span>
            <input
              type="text"
              value={dance.title}
              placeholder="Names and relationship"
              onChange={(event) => update(dance.id, { title: event.target.value })}
            />
          </label>
          <SongField
            id={`extra-dance-song-${dance.id}`}
            label="Song"
            value={dance.song}
            multiline={false}
            placeholder="Search or type a song"
            onChange={(song) => update(dance.id, { song })}
          />
          <fieldset className="planner-choices planner-choices--stack">
            <legend>How would you like this dance to be performed?</legend>
            <div className="planner-choices__row">
              {formats.map((option) => (
                <label key={option} className={dance.format === option ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name={`extra-dance-format-${dance.id}`}
                    checked={dance.format === option}
                    onChange={() => update(dance.id, { format: option })}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="planner-choices planner-choices--inline">
            <legend>Is this dance choreographed?</legend>
            <div className="planner-choices__row">
              {['Yes', 'No'].map((option) => (
                <label key={option} className={dance.choreographed === option ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name={`extra-dance-choreo-${dance.id}`}
                    checked={dance.choreographed === option}
                    onChange={() => update(dance.id, { choreographed: option })}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {dance.choreographed === 'Yes' && (
            <>
              <label className="planner-field">
                <span>Cue for when to start the song</span>
                <input type="text" value={dance.startCue} onChange={(event) => update(dance.id, { startCue: event.target.value })} />
              </label>
              <label className="planner-field">
                <span>Cue for when to stop the song</span>
                <input type="text" value={dance.stopCue} onChange={(event) => update(dance.id, { stopCue: event.target.value })} />
              </label>
            </>
          )}
          <label className="planner-field">
            <span>Fade note</span>
            <textarea
              rows={2}
              value={dance.fade}
              placeholder="Anything to add?"
              onChange={(event) => update(dance.id, { fade: event.target.value })}
            />
          </label>
        </div>
      ))}
      <p>
        <button type="button" className="planner-section__toggle" onClick={() => write([...dances, blankParentDance()])}>
          Add a parent dance
        </button>
      </p>
    </div>
  )
}
