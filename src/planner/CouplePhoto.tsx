import { useEffect, useRef, useState } from 'react'
import { uploadCouplePhoto } from './api'
import { PhotoTooLargeError, blobToBase64, prepareCouplePhoto } from './preparePhoto'

const REQUEST_TEXT =
  "We'd be delighted if you could share a photo of yourselves here on the app. While it's entirely optional, it adds a personal touch and helps us feel like we know you better during the planning process."

interface CouplePhotoProps {
  token: string
  savedValue: string
  savedDataUrl: string | null
}

export default function CouplePhoto({ token, savedValue, savedDataUrl }: CouplePhotoProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null)
  const [acceptedRemote, setAcceptedRemote] = useState<string | null>(null)
  const [rejectedRemote, setRejectedRemote] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'thankyou' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const blobUrl = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
    }
  }, [])

  const remote = uploadedDataUrl || savedDataUrl || null
  const remoteOk = remote && remote !== rejectedRemote ? remote : null

  useEffect(() => {
    if (!remoteOk) return
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) setAcceptedRemote(remoteOk)
    }
    image.onerror = () => {
      if (!cancelled) setRejectedRemote(remoteOk)
    }
    image.src = remoteOk
    return () => {
      cancelled = true
    }
  }, [remoteOk])

  const replacePreview = (next: string | null) => {
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
    blobUrl.current = next
    setLocalPreview(next)
  }

  const remoteReady = Boolean(remoteOk && acceptedRemote === remoteOk)
  const freshRemoteReady = Boolean(uploadedDataUrl && acceptedRemote === uploadedDataUrl)
  const shown = freshRemoteReady ? uploadedDataUrl : localPreview || (remoteReady ? remoteOk : null)
  const alreadyReceived = savedValue.trim() !== ''
  const showReceived = !shown && phase !== 'uploading' && phase !== 'error' && (alreadyReceived || phase === 'thankyou')
  const hasPhoto = Boolean(shown) || showReceived || phase === 'thankyou'

  const onFile = (file: File | undefined) => {
    if (!file) return
    setPhase('uploading')
    setMessage('')
    setUploadedDataUrl(null)
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

      replacePreview(prepared.previewUrl)

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
      if (result.photo.dataUrl) setUploadedDataUrl(result.photo.dataUrl)
      setPhase('thankyou')
      setMessage('Photo received, thank you!')
    })()
  }

  return (
    <section className="planner-section planner-photo" aria-labelledby="couple-photo-heading">
      <h2 id="couple-photo-heading">Couple photo request</h2>
      <p className="planner-section__blurb">{REQUEST_TEXT}</p>
      {shown && (
        <div className="planner-photo__frame">
          <img
            className="planner-photo__preview"
            src={shown}
            alt="Photo of the couple"
            onError={() => {
              if (shown === localPreview) replacePreview(null)
              else setRejectedRemote(shown)
            }}
          />
        </div>
      )}
      {phase === 'uploading' && <p className="planner-photo__status">Sending your photo…</p>}
      {phase === 'thankyou' && shown && <p className="planner-photo__status">{message}</p>}
      {showReceived && <p className="planner-photo__status">Photo received</p>}
      {phase === 'error' && (
        <p className="planner-photo__status planner-photo__status--error" role="alert">
          {message}
        </p>
      )}
      <label className={`btn planner-photo__pick${phase === 'uploading' ? ' is-disabled' : ''}`}>
        {phase === 'uploading' ? 'Sending…' : hasPhoto ? 'Replace photo' : 'Choose a photo'}
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
