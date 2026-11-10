import { useState } from 'react'

interface Props {
  src: string
  alt: string
  fallbackText: string
  className?: string
}

/** 타베로그 대표 사진을 직접 불러오고, 실패하면 자리표시자를 보여 준다. */
export function Photo({ src, alt, fallbackText, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`photo photo-fallback ${className}`} role="img" aria-label={`${alt} (사진을 불러오지 못함)`}>
        <span>{fallbackText}</span>
      </div>
    )
  }
  return (
    <img
      className={`photo ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
