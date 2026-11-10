interface Props {
  score: number | null
  size?: 'sm' | 'md'
}

/** 타베로그 점수(5점 만점)를 별로 표시. 점수가 확인되지 않은 곳은 별을 그리지 않는다. */
export function Stars({ score, size = 'md' }: Props) {
  if (score == null) {
    return <span className={`stars stars-${size} stars-none`}>타베로그 점수 미확인</span>
  }
  const pct = Math.max(0, Math.min(100, (score / 5) * 100))
  return (
    <span className={`stars stars-${size}`} aria-label={`타베로그 ${score.toFixed(2)}점 (5점 만점)`}>
      <span className="stars-track" aria-hidden="true">
        ★★★★★
        <span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      <span className="stars-num">{score.toFixed(2)}</span>
    </span>
  )
}
