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


const MAPS_KIX = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent('関西国際空港') + '&destination=' + encodeURIComponent('大阪市西成区旭2-2-18') + '&travelmode=transit'
const MAPS_ITM = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent('大阪国際空港') + '&destination=' + encodeURIComponent('大阪市西成区旭2-2-18') + '&travelmode=transit'

const AIRPORT: Topic = {
  id: 'airport',
  icon: '✈️',
  title: '공항에서 숙소로',
  lead: '11/13 도착 기준. 기본은 간사이 공항(KIX). 6명·짐 기준으로 싼 길·편한 길을 골랐어요.',
  blocks: [
    {
      h: '6명에게 추천',
      items: [
        '가장 싸게: 난카이 공항급행 → 덴가차야역, 환승 없이. 1인 970엔 · 6명 5,820엔, 차는 약 40분 + 역에서 걸어 약 15분',
        '짐이 크거나 지쳤을 때: MK 점보 택시(9인승) 1대로 숙소 앞까지. 서성구 정액 1대 21,800엔, 통행료와 공항 주차 1,000엔은 별도',
        '앉아서 가고 싶을 때: 난카이 특급 라피트(지정석, 덴가차야 정차). ‘간사이공항 할인 라피트권(関空トク割)’ 레귤러 1인 1,560엔 · 6명 9,360엔',
      ],
    },
    {
      h: '난카이 공항급행 (특급권 없이, 가장 저렴)',
      items: [
        '간사이 공항역에서 난바행 공항급행을 타고 덴가차야에서 내리세요. 환승 없어요',
        '낮 시간 예: 14:09발 → 14:49착(차 40분). 낮에는 대략 15분 간격',
        '운임 1인 970엔(ICOCA·종이표 같음) · 6명 5,820엔',
        '표: 난카이(빨간 안내) 개찰에서 ICOCA·Suica 등을 찍거나, 발매기에서 덴가차야까지 보통 승차권을 사요. 특급권은 필요 없어요',
        '제1터미널 2층이 역과 바로 이어져요. 제2터미널은 무료 연결버스 약 7–9분',
        'JR(파란 안내) 개찰로 들어가지 마세요 — 난카이와 역은 같어도 회사가 달라요',
      ],
    },
    {
      h: '난카이 특급 라피트 (지정석)',
      items: [
        '라피트 α·β 모두 덴가차야에 서요. 시각표상 차는 약 34–35분',
        '운임 970엔 + 특급권: 레귤러 지정석 700엔(합계 1,670엔) · 슈퍼시트 910엔(합계 1,880엔)',
        '더 싼 표: 역 분홍 발매기·창구의 ‘간사이공항 할인 라피트권(関空トク割)’ 레귤러 1,560엔(6명 9,360엔), 슈퍼시트 1,740엔. 덴가차야·신이마미야·난바 모두 포함',
        '앱 ‘난카이 특급 티켓리스’로 사면 특급권이 150엔 싸요(레귤러 합계 1,520엔). 차 안에서 특급권을 사면 300엔이 붙어요',
        '지정석이라 6명이 자리를 맡기 좋고, 짐 두는 곳·선반이 있어요',
        '평일 기준 첫차 6:53(β) · 막차 23:00(α, 덴가차야 23:29착). 미리 사 두는 게 안전해요',
      ],
    },
    {
      h: '덴가차야에서 숙소까지 (걸어 약 15분)',
      items: [
        '난카이 덴가차야역에서 숙소(西成区旭2-2-18)까지 길을 따라 약 1.2km, 걸어서 약 15분',
        '짐이 많으면 역 앞에서 택시를 타도 돼요. 보통 택시는 4명까지라 6명은 2대',
        '하나조노초역(요쓰바시선)이 숙소에서 더 가깝지만(약 560m·7분), 덴가차야에서 바꿔 타면 짐 들고 환승이 생겨요. 걸어가는 편이 단순해요',
        'JR·난카이 신이마미야는 걸어 약 21분(약 1.7km)이라 덴가차야보다 멀어요',
      ],
    },
    {
      h: 'JR 관공쾌속 · 공항 리무진 버스',
      items: [
        'JR 관공쾌속 → 신이마미야: 1인 1,060엔 · 6명 6,360엔, 낮 예 14:17발 → 15:13착(약 56분) 뒤 걸어 약 21분. 난카이보다 요금이 높고 걸어도 더 멀어요. 특급권은 없어요',
        'JR 특급 하루카는 신이마미야에 서지 않고 텐노지에 서요. 이 숙소에는 난카이보다 돌아가요',
        '리무진 버스는 난바 OCAT까지. 1인 1,400엔 · 6명 8,400엔, 제1터미널에서 약 50분. 내려서 숙소까지 전철이나 택시가 한 번 더 필요해요',
        '리무진 막차는 전철보다 빨라요(제1터미널 21:25발 → OCAT 22:15). 낮에 앉아 가고 싶을 때만',
      ],
    },
    {
      h: '택시 (문 앞까지) · 막차 이후',
      items: [
        'MK 공항 정액(예약): 서성구 일반 13,800엔(4명까지) · 점보(하이에이스·9인승) 21,800엔. 6명은 점보 1대 또는 일반 2대(27,600엔). 통행료 별도(오사카–간사이 대략 2,000엔 안내), 공항에서 탈 때 주차 1,000엔 별도',
        '밤 22시–새벽 5시는 정액도 20% 할증. 시간 지정 예약은 일반차에 500엔이 붙을 수 있어요',
        '공항 택시 승강장 미터 요금은 숙소 전용 정액이 없어요. 앱(GO·Uber·DiDi)은 제1터미널 1층 2번 승강장. 카카오T도 일본 GO와 연동되지만, 앱 예상 요금은 그때그때 달라요',
        '평일 11/13 기준 난카이 공항급행 막차: 간사이 공항역 23:55발 → 덴가차야 00:34착. 그 이후는 택시뿐(심야 할증). 시각은 당일 안내를 한 번 더 보세요',
      ],
    },
    {
      h: '이타미 공항(ITM)으로 도착할 때',
      items: [
        '리무진 버스 → 난바 역전(또는 JR 난바 OCAT): 1인 730엔 · 6명 4,380엔, 약 25–30분. 내려서 숙소까지 전철·택시가 필요해요. 막차는 21:20발 → 난바 21:50착',
        '전철: 오사카 모노레일·한큐·지하철을 갈아타 덴가차야까지, 1인 730–910엔 · 약 1시간 6분, 환승 2–3회. 짐 있으면 버스나 택시가 덜 힘들어요',
        'MK 정액 서성구: 일반 7,600엔 · 점보 15,600엔(통행료 별도, 오사카–이타미 대략 610엔 안내, 주차 300엔 별도)',
      ],
    },
  ],
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

function TopicCard({ t, children, open }: { t: Topic; children?: React.ReactNode; open?: boolean }) {
  return (
    <section className="topic" id={`topic-${t.id}`} aria-labelledby={`h-${t.id}`}>
      <details open={open}>
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

/** 메인 화면: 지도로 이동 + 공항·택시·지하철·구매 필수품 안내 + 대표 명소 바로가기 */
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

          <TopicCard t={AIRPORT} open>
            <div className="topic-actions">
              <a className="btn btn-primary" href={MAPS_KIX} target="_blank" rel="noopener noreferrer">간사이 공항에서 숙소로 길찾기</a>
              <a className="btn" href={MAPS_ITM} target="_blank" rel="noopener noreferrer">이타미 공항에서 숙소로 길찾기</a>
            </div>
          </TopicCard>
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
