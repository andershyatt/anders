import { useEffect, useState } from 'react'
import { uploadCouplePhoto } from './api'
import { PhotoTooLargeError, blobToBase64, prepareCouplePhoto } from './preparePhoto'

const REQUEST_TEXT =
  "We'd be delighted if you could share a photo of yourselves here on the app. While it's entirely optional, it adds a personal touch and helps us feel like we know you better during the planning process."

interface CouplePhotoProps {
  token: string
  savedValue: string
}

export default function CouplePhoto({ token, savedValue }: CouplePhotoProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'thankyou' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const alreadyReceived = savedValue.trim() !== ''
  const showReceived = phase === 'idle' && alreadyReceived

  const onFile = (file: File | undefined) => {
    if (!file) return
    setPhase('uploading')
    setMessage('')
    void (async () => {
      let prepared
      try {
        prepared = await prepareCouplePhoto(file)
      } catch (error) {
        setPhase('error')
        setMessage(
          error instanceof PhotoTooLargeError
            ? 'That photo is larger than 8 MB. Please choose a smaller one.'
            : "We couldn't read that photo. Please try a different one.",
        )
        return
      }

      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return prepared.previewUrl
      })

      const data = await blobToBase64(prepared.blob)
      const result = await uploadCouplePhoto(token, {
        filename: prepared.filename,
        mimeType: prepared.mimeType,
        data,
      })
      if (!result.ok) {
        setPhase('error')
        setMessage("We couldn't send that photo. Please try again.")
        return
      }
      setPhase('thankyou')
      setMessage('Photo received, thank you!')
    })()
  }

  return (
    <section className="planner-section planner-photo" aria-labelledby="couple-photo-heading">
      <h2 id="couple-photo-heading">Couple photo request</h2>
      <p className="planner-section__blurb">{REQUEST_TEXT}</p>
      {previewUrl && <img className="planner-photo__preview" src={previewUrl} alt="Your photo preview" />}
      {phase === 'uploading' && <p className="planner-photo__status">Sending your photo…</p>}
      {phase === 'thankyou' && <p className="planner-photo__status">{message}</p>}
      {showReceived && <p className="planner-photo__status">Photo received</p>}
      {phase === 'error' && (
        <p className="planner-photo__status planner-photo__status--error" role="alert">
          {message}
        </p>
      )}
      <label className={`btn planner-photo__pick${phase === 'uploading' ? ' is-disabled' : ''}`}>
        {phase === 'uploading' ? 'Sending…' : showReceived || phase === 'thankyou' ? 'Replace photo' : 'Choose a photo'}
        <input
          type="file"
          accept="image/*"
          disabled={phase === 'uploading'}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            onFile(file)
          }}
        />
      </label>
    </section>
  )
}
