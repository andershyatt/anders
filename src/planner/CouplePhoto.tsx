import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { uploadCouplePhoto } from './api'
import { PhotoTooLargeError, blobToBase64, prepareCouplePhoto } from './preparePhoto'

const REQUEST_TEXT =
  "We'd be delighted if you could share a photo of yourselves here on the app. While it's entirely optional, it adds a personal touch and helps us feel like we know you better during the planning process."

const KICKER = 'Your wedding with Anders Hyatt Music'
const LEAD = "Let's dive into the music. Start with what you know, and we'll fill in the rest along the way."

interface CouplePhotoProps {
  token: string
  savedValue: string
  savedDataUrl: string | null
  title: string
  meta: string
}

function PhotoPicker({
  label,
  className,
  disabled,
  onFile,
}: {
  label: string
  className: string
  disabled: boolean
  onFile: (file: File | undefined) => void
}) {
  return (
    <label className={className}>
      {label}
      <input
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          onFile(file)
        }}
      />
    </label>
  )
}

export default function CouplePhoto({ token, savedValue, savedDataUrl, title, meta }: CouplePhotoProps) {
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

  const picker = (label: string, className: string) => (
    <PhotoPicker label={label} className={className} disabled={phase === 'uploading'} onFile={onFile} />
  )

  if (shown) {
    return (
      <div className="planner-hero-wrap">
        <section className="planner-hero" aria-label="Couple photo">
          <img
            className="planner-hero__image"
            src={shown}
            alt="Photo of the couple"
            onError={() => {
              if (shown === localPreview) replacePreview(null)
              else setRejectedRemote(shown)
            }}
          />
          <div className="planner-hero__shade">
            <div className="planner-hero__copy">
              <p className="planner-kicker">{KICKER}</p>
              <h1>{title}</h1>
              {meta && <p className="planner-meta">{meta}</p>}
            </div>
            {picker(
              phase === 'uploading' ? 'Sending…' : 'Change photo',
              `planner-hero__change${phase === 'uploading' ? ' is-disabled' : ''}`,
            )}
          </div>
        </section>
        {phase === 'error' && (
          <p className="planner-photo__status planner-photo__status--error" role="alert">
            {message}
          </p>
        )}
        <p className="planner-lead">{LEAD}</p>
      </div>
    )
  }

  return (
    <>
      <header className="planner-welcome">
        <p className="planner-kicker">{KICKER}</p>
        <h1>{title}</h1>
        {meta && <p className="planner-meta">{meta}</p>}
        <p className="planner-lead">{LEAD}</p>
      </header>
      <section className="planner-section planner-photo" aria-labelledby="couple-photo-heading">
        <h2 id="couple-photo-heading">Couple photo request</h2>
        <p className="planner-section__blurb">{REQUEST_TEXT}</p>
        {phase === 'uploading' && <p className="planner-photo__status">Sending your photo…</p>}
        {phase === 'thankyou' && <p className="planner-photo__status">Photo received, thank you!</p>}
        {showReceived && phase !== 'thankyou' && <p className="planner-photo__status">Photo received</p>}
        {phase === 'error' && (
          <p className="planner-photo__status planner-photo__status--error" role="alert">
            {message}
          </p>
        )}
        {picker(
          phase === 'uploading' ? 'Sending…' : hasPhoto ? 'Replace photo' : 'Choose a photo',
          `btn planner-photo__pick${phase === 'uploading' ? ' is-disabled' : ''}`,
        )}
      </section>
    </>
  )
}
