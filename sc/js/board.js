// /sc/js/share.js
import { supabase } from './supabase.js';

const DEFAULT_CENTER = { lat: 37.5585, lng: 126.9997 };
const DEFAULT_ZOOM   = 14;

/** 벡터지도 Map ID (있으면 넣고, 없으면 null) */
const MAP_ID = YOUR_REAL_MAP_ID; // 예: 'YOUR_MAP_ID'  ← 있으면 AdvancedMarker 사용

// ─── URL token ─────────────────────────────────
const params = new URLSearchParams(location.search);
const token = params.get('token');
if (!token) showError('유효하지 않은 링크입니다. (token 누락)');

// ─── 데이터 로드 ────────────────────────────────
async function fetchShareInfo() {
  const { data, error } = await supabase
    .from('shares')
    .select('user_id, display_name')
    .eq('token', token)
    .single();
  if (error || !data) throw new Error('공유 토큰이 유효하지 않습니다.');
  return data;
}

async function fetchUserRatingsAndRestaurants(userId) {
  const [{ data: ratings, error: rErr }, { data: restaurants, error: sErr }] =
    await Promise.all([
      supabase.from('ratings')
        .select('restaurant_id, stars')
        .eq('user_id', userId)
        .not('stars', 'is', null),
      supabase.from('restaurants')
        .select('id, name, lat, lng'),
    ]);
  if (rErr || sErr) throw new Error('데이터 로드 중 오류가 발생했습니다.');
  return { ratings: ratings || [], restaurants: restaurants || [] };
}

// ─── 구글맵 콜백(전역) ─────────────────────────
window.initMap = async () => {
  try {
    const share = await fetchShareInfo();
    document.getElementById('title').textContent =
      `${share.display_name || '사용자'}의 맛집 지도`;

    const mapOptions = { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
    if (MAP_ID) mapOptions.mapId = MAP_ID;

    const map = new google.maps.Map(document.getElementById('map'), mapOptions);

    const { ratings, restaurants } = await fetchUserRatingsAndRestaurants(share.user_id);
    const starMap = new Map(ratings.map(r => [r.restaurant_id, r.stars]));
    const targets = restaurants.filter(r => starMap.has(r.id));

    if (targets.length === 0) showError('공유된 맛집이 아직 없어요.');

    const bounds = new google.maps.LatLngBounds();

    for (const r of targets) {
      const stars = starMap.get(r.id) || 0;

      // AdvancedMarker vs 기본 Marker 자동 선택
      let marker;
      if (MAP_ID && google.maps.marker?.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: +r.lat, lng: +r.lng },
          map,
          title: `${r.name} – ${'★'.repeat(stars)}`,
          content: createMarkerSVG(colorByStars(stars)),
        });
        bounds.extend(marker.position);
      } else {
        marker = new google.maps.Marker({
          position: { lat: +r.lat, lng: +r.lng },
          map,
          title: `${r.name} – ${'★'.repeat(stars)}`,
          icon: makeIcon(colorByStars(stars)),
        });
        bounds.extend(marker.getPosition());
      }

      // 인포윈도우
      const info = new google.maps.InfoWindow({
        content: `<div style="min-width:160px"><b>${escapeHtml(r.name)}</b><br/>별점: ${'★'.repeat(stars)}</div>`
      });
      marker.addListener('click', () => info.open({ map, anchor: marker }));
    }

    if (!bounds.isEmpty()) map.fitBounds(bounds);
  } catch (e) {
    showError(e.message || '오류가 발생했습니다.');
  }
};

// ─── 유틸 ──────────────────────────────────────
function createMarkerSVG(fill) {
  return new DOMParser().parseFromString(
    `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
       <path d="M15 1C9 1 4 6 4 12c0 6.5 7 14 11 17 4-3 11-10.5 11-17 0-6-5-11-11-11z"
             fill="${fill}" stroke="black" stroke-width="1"/>
       <circle cx="15" cy="12" r="4" fill="white"/>
     </svg>`, 'image/svg+xml'
  ).documentElement;
}

function makeIcon(fill) {
  const svg = `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 1C9 1 4 6 4 12c0 6.5 7 14 11 17 4-3 11-10.5 11-17 0-6-5-11-11-11z"
            fill="${fill}" stroke="black" stroke-width="1"/>
      <circle cx="15" cy="12" r="4" fill="white"/>
    </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(30, 30),
    anchor: new google.maps.Point(15, 30),
  };
}

function colorByStars(s) {
  if (s>=5) return '#ef4444';
  if (s>=4) return '#f97316';
  if (s>=3) return '#f59e0b';
  if (s>=2) return '#84cc16';
  if (s>=1) return '#22c55e';
  return '#9ca3af';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function showError(msg){
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}
