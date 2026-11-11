import raw from './data/restaurants.json'
import type { Dataset } from './types'
import { LANDMARKS } from './lib/labels'

const data = raw as Dataset

interface Props {
  go: (hash: string) => void
}

interface Topic {
  id: string
  icon: string
  title: string
  lead: string
  blocks: { h: string; items: string[] }[]
  note?: string
}

const TAXI: Topic = {
  id: 'taxi',
  icon: '🚕',
  title: '택시 이용법',
  lead: '6명이면 택시 2대로 나눠 타요. 짧은 거리나 밤늦게 돌아올 때 편해요.',
  blocks: [
    {
      h: '앱으로 부르기',
      items: [
        '카카오T: ‘해외갈 때 → 해외차량호출’에서 한국어로 목적지 입력, 한국에서 등록한 카드로 결제 (일본 GO와 연동). 탈 때 앱의 확인번호를 기사에게 보여 줘요',
        'GO: 일본 다운로드 1위 택시 앱, 오사카시 전역 지원',
        'Uber: 오사카시에서 일반 택시(Uber Taxi) 호출 가능',
        'S.RIDE · DiDi도 오사카에서 쓸 수 있어요',
        '앱으로 부르면 미터 요금에 호출 요금(迎車料金)이 붙을 수 있어요',
      ],
    },
    {
      h: '길에서 잡기',
      items: [
        '역 앞 택시 승강장에서 줄 서거나, 길에서 손을 들어 세워요',
        '앞유리 표시가 「空車」(빨간 글씨)면 빈 차, 「賃走」「迎車」「回送」이면 못 타요',
        '뒷문은 기사가 자동으로 열고 닫아요 — 손대지 말고 기다리세요',
        '큰 캐리어는 기사에게 말하면 트렁크에 실어 줘요',
        '목적지는 일본어 주소나 지도 화면을 보여 주는 게 확실해요',
      ],
    },
    {
      h: '요금 (오사카 보통차 상한)',
      items: [
        '처음 1.2km 600엔, 이후 231m마다 100엔 (막혀서 느릴 땐 1분 25초마다 100엔)',
        '밤 22시~새벽 5시는 20% 할증',
        '9,000엔 넘는 장거리는 넘는 금액 10% 할인 (회사마다 달라요)',
        '고속도로를 타면 통행료는 따로 내요',
      ],
    },
    {
      h: '6명일 때 · 에티켓',
      items: [
        '보통 택시는 4명까지(앞 1 + 뒤 3) → 2대로 나눠 타기',
        '중형은 5명, 대형(점보)은 5~9명 — 미리 예약하면 1대로 갈 수 있어요',
        '뒷좌석도 안전벨트 필수',
        '팁은 없어요 — 미터 금액만 내면 돼요',
        '카드·교통카드 결제는 차마다 달라서 탈 때 확인',
        '차 안에서는 조용히, 통화는 짧게, 음식은 삼가는 게 매너',
      ],
    },
  ],
}

const SUBWAY: Topic = {
  id: 'subway',
  icon: '🚇',
  title: '지하철 이용법',
  lead: '숙소에서 가장 가까운 역은 하나조노초역(요쓰바시선, 걸어서 약 7분)이에요.',
  blocks: [
    {
      h: '숙소에서 가까운 역',
      items: [
        '하나조노초역 — 오사카 메트로 요쓰바시선 · 걸어서 약 7분 (560m)',
        '덴가차야역 — 오사카 메트로 사카이스지선 · 난카이선 · 걸어서 약 15분',
        'JR 신이마미야역 — JR 오사카 순환선 · 걸어서 약 21분 (USJ 갈 때)',
      ],
    },
    {
      h: '뭘 사야 하나요? (추천: ICOCA 또는 카드 터치)',
      items: [
        'ICOCA(교통카드): 역 분홍색 발매기에서 사고 충전해서 써요 (보증금 500엔). 아이폰은 Apple Pay에 ICOCA를 넣어 쓸 수도 있어요',
        'ICOCA는 지하철·JR·게이한·난카이·한신 다 돼요 — 후시미 이나리·USJ 갈 때도 그대로',
        '신용카드 터치 결제: Visa·Mastercard·JCB·Amex 등 컨택리스 카드를 개찰구 전용 리더에 대면 끝, 등록 필요 없음 (오사카 메트로·시티버스)',
        '종이 승차권: 발매기에서 목적지 요금을 골라 사요 — 매번 사야 해서 번거로워요',
        '1명당 카드 1장씩 — 개찰구에서 들어갈 때·나올 때 한 번씩 대요',
      ],
    },
    {
      h: '요금',
      items: [
        '오사카 메트로는 거리 요금: 3km까지 190엔 · 7km까지 240엔 · 13km까지 290엔 · 그 이상 340~390엔',
        '예: 하나조노초 → 다이코쿠초 190엔 · 하나조노초 → 혼마치·요도야바시 240엔',
      ],
    },
    {
      h: '1일권은 필요할까?',
      items: [
        '엔조이 에코 카드(메트로·시티버스 하루 무제한): 평일 820엔 · 토·일·공휴일 620엔',
        '240엔 구간을 평일 4번, 주말 3번 이상 탈 날만 이득 — 숙소가 역에서 7분이라 보통은 ICOCA가 나아요',
        'JR·게이한·난카이·한신은 메트로 1일권으로 못 타요',
        '후시미 이나리 왕복은 게이한 1일권(2,160엔)보다 ICOCA(왕복 1,440엔)가 싸요',
      ],
    },
  ],
}

const SHOPPING: Topic = {
  id: 'shopping',
  icon: '🛍️',
  title: '추천 구매 필수품',
  lead: '여행자들이 많이 추천하는 것만 골랐어요. 돈키호테·드럭스토어에서 대부분 살 수 있어요.',
  blocks: [
    {
      h: '화장품·스킨케어',
      items: [
        '비오레 UV 아쿠아리치 (선크림)',
        '아넷사 퍼펙트 UV · 스킨아쿠아 톤업 UV (선크림)',
        '케아나 나데시코 쌀 팩 · 쌀 마스크 (毛穴撫子 お米のパック/マスク)',
        '멜라노 CC 비타민 에센스 · 하다라보 고쿠준',
        '퍼펙트 휩 폼클렌징',
      ],
    },
    {
      h: '헤어·바디·휴식',
      items: ['피노 프리미엄 터치 헤어 마스크', '&honey 헤어 오일', '휴족시간 (다리 쿨링 시트)', '메구리즘 스팀 아이마스크'],
    },
    {
      h: '파스·상비약',
      items: ['사론파스 · 로이히 츠보코 동전 파스', '카베진 코와 알파 (위장약)'],
    },
    {
      h: '과자·먹거리',
      items: [
        '킷캣 일본 한정 맛 (말차 등)',
        '이치란 라멘 키트',
        'BAKE 크리미 치즈 · 알포트 초콜릿 · 코로로 젤리',
        '오사카 기념 과자: 「めっちゃ好きやねん 大阪の恋人」 · 「道頓堀の恋人」',
        '안주로 인기: 明太かに (명란 맛 꽃게 과자)',
      ],
    },
    {
      h: '사기 전에 꼭',
      items: [
        '이브(EVE)·파브론·루루 일부 감기약·진통제는 한국 반입이 제한돼요 — 성분 확인, 애매하면 사지 마세요',
        '소시지·육포 같은 육가공품은 한국에 못 가져와요',
        '의약품·건강기능식품은 각각 6병까지가 기준',
        '11월부터 면세는 ‘세금 내고 공항에서 환급’ — 여행 중 쓸 건 따로 계산, 면세품은 뜯지 마세요',
      ],
    },
  ],
}

function TopicCard({ t, children }: { t: Topic; children?: React.ReactNode }) {
  return (
    <section className="topic" id={`topic-${t.id}`} aria-labelledby={`h-${t.id}`}>
      <details>
        <summary>
          <span className="topic-icon" aria-hidden="true">{t.icon}</span>
          <span className="topic-head">
            <h2 id={`h-${t.id}`}>{t.title}</h2>
            <span className="topic-lead">{t.lead}</span>
          </span>
          <span className="topic-caret" aria-hidden="true" />
        </summary>
        <div className="topic-body">
          {t.blocks.map((b) => (
            <div key={b.h} className="topic-block">
              <h3>{b.h}</h3>
              <ul>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
          {children}
        </div>
      </details>
    </section>
  )
}

/** 메인 화면: 지도로 이동 + 택시·지하철·구매 필수품 안내 + 대표 명소 바로가기 */
export function Home({ go }: Props) {
  const { lodging } = data
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">O</span>
          <span>
            <span className="brand-name">OSAKAAA</span>
            <span className="brand-sub">오사카 6명 여행 · 11/13–11/17</span>
          </span>
        </div>
      </header>
      <main className="home">
        <div className="home-inner">
          <section className="hero">
            <p className="hero-kicker">숙소 기준 여행 가이드</p>
            <h1 className="hero-title">오사카 11/13–11/17</h1>
            <p className="hero-addr" lang="ja">숙소 {lodging.address}</p>
            <button type="button" className="btn btn-primary hero-cta" onClick={() => go('/map')}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M15 4 9 2 3 4v18l6-2 6 2 6-2V2zm-1 15.6-4-1.3V4.4l4 1.3z" /></svg>
              지도로 이동
            </button>
            <p className="hero-sub">맛집 {data.restaurants.length}곳(6명 OK) · 편의점 · 약국 · 돈키호테 · 면세점 · 볼거리</p>
            <div className="hero-quick">
              <button type="button" className="hq" onClick={() => go('/map?type=conv')}><b>24</b> 편의점</button>
              <button type="button" className="hq" onClick={() => go('/map?type=pharmacy')}><b>+</b> 약국</button>
              <button type="button" className="hq" onClick={() => go('/map?type=donki')}><b>D</b> 돈키호테</button>
              <button type="button" className="hq" onClick={() => go('/map?type=taxfree')}><b>¥</b> 면세점</button>
            </div>
          </section>

          <TopicCard t={TAXI} />
          <TopicCard t={SUBWAY} />
          <TopicCard t={SHOPPING}>
            <div className="topic-actions">
              <button type="button" className="btn" onClick={() => go('/map?type=donki')}>지도에서 돈키호테 보기</button>
              <button type="button" className="btn" onClick={() => go('/map?type=pharmacy')}>지도에서 약국 보기</button>
            </div>
          </TopicCard>

          <section className="lm-links" aria-label="대표 명소 바로가기">
            <h2>대표 명소 — 지도에서 가는 법 보기</h2>
            <div className="lm-grid">
              {LANDMARKS.map((l) => (
                <button key={l.id} type="button" className="lm-link" onClick={() => go(`/map?place=${l.id}`)}>
                  <span className="lm-link-star" aria-hidden="true">★</span>
                  <span>
                    <b>{l.name}</b>
                    <small>{l.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <p className="home-foot">지도 데이터 &copy; OpenStreetMap 기여자 · 시간·요금은 2026년 11월 확인, 바뀔 수 있어요.</p>
        </div>
      </main>
    </div>
  )
}
