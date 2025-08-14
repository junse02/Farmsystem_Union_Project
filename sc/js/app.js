import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jrihebqeovpcugbkljnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaWhlYnFlb3ZwY3VnYmtsam5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk1NjgsImV4cCI6MjA2OTM1NTU2OH0.NvMXkqh1tuFWF5gcFxCIaDNRLfshfbnkhokgPA0OqdQ'
);

const DEFAULT_CENTER = { lat: 37.5585, lng: 126.9997 };
const DEFAULT_ZOOM = 16;

/* ✅ 콜백을 ‘무조건’ 먼저 등록하고, 내부에서 세션 체크 */
window.initMap = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }
  const userId = session.user.id;

  // 식당 로드
  const { data: restaurants, error: restErr } = await supabase
    .from('restaurants').select('id, name, lat, lng');
  if (restErr) { alert('식당 목록 로드 실패'); return; }

  // 내 별점만
  const { data: ratings } = await supabase
    .from('ratings').select('restaurant_id, stars')
    .eq('user_id', userId)
    .not('stars', 'is', null);

  const starsMap = new Map(ratings?.map(r => [r.restaurant_id, r.stars]));
  const visitedSet = new Set(starsMap.keys());

  // 지도 생성 (mapId는 일단 제거해 깔끔하게)
  const map = new google.maps.Map(document.getElementById('map'), {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapId: "YOUR_REAL_MAP_ID" // ← 콘솔에서 받은 실제 ID
  });

  // 마커
  const markers = {};
  restaurants.forEach(r => {
    const stars = starsMap.get(r.id) ?? 0;
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: +r.lat, lng: +r.lng },
      map,
      title: r.name,
      content: createMarkerSVG(colorByStars(stars)),
    });
    markers[r.id] = marker;
    marker.addListener('click', () => handleSelect(r));
  });

  // 상태 & UI
  let current = null;
  let pendingScore = 0;

  function handleSelect(place) {
    current = place;
    pendingScore = starsMap.get(place.id) ?? 0;
    document.getElementById('selectedName').innerText = `선택된 식당: ${place.name}`;
    updateVisitBtnState(); highlightStars(pendingScore);
  }

  document.querySelectorAll('#rating span').forEach(el => {
    el.addEventListener('click', () => {
      if (!current) return;
      pendingScore = +el.dataset.score;
      highlightStars(pendingScore);
      updateVisitBtnState();
    });
  });

  document.getElementById('highlightBtn').addEventListener('click', async () => {
    if (!current) return;
    const isVisited = visitedSet.has(current.id);

    if (!isVisited) {
      if (pendingScore === 0) { alert('별점을 먼저 선택해 주세요!'); return; }
      const { error } = await supabase.from('ratings').upsert({
        user_id: userId, restaurant_id: current.id, stars: pendingScore
      });
      if (error) { alert('저장 실패: ' + error.message); return; }
      starsMap.set(current.id, pendingScore);
      visitedSet.add(current.id);
      markers[current.id].content = createMarkerSVG(colorByStars(pendingScore));
      updateVisitBtnState();
    } else {
      const { error } = await supabase.from('ratings')
        .delete().eq('user_id', userId).eq('restaurant_id', current.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      starsMap.delete(current.id);
      visitedSet.delete(current.id);
      pendingScore = 0;
      highlightStars(0);
      markers[current.id].content = createMarkerSVG(colorByStars(0));
      updateVisitBtnState();
    }
  });

  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { alert('로그인 후 이용해주세요.'); return; }
      const uid = session.user.id;
      const displayName = (session.user.email || '사용자').split('@')[0];

      let { data: existing, error: exErr } = await supabase
        .from('shares').select('token').eq('user_id', uid).limit(1).maybeSingle();
      if (exErr && exErr.code !== 'PGRST116') throw exErr;

      if (!existing) {
        const { data, error } = await supabase
          .from('shares').insert({ user_id: uid, display_name: displayName })
          .select('token').single();
        if (error) throw error;
        existing = data;
      }

      const base = `${location.origin}${location.pathname.replace(/index\\.html$/, '')}`;
      const url = `${base}share.html?token=${existing.token}`;
      try { await navigator.clipboard.writeText(url); alert(`공유 링크가 복사되었습니다:\n${url}`); }
      catch { prompt('클립보드 권한이 없어 직접 복사하세요:', url); }
    } catch (err) {
      alert('공유 링크 생성 실패: ' + (err?.message || String(err)));
    }
  });

  function updateVisitBtnState() {
    const isVisited = visitedSet.has(current?.id);
    const btn = document.getElementById('highlightBtn');
    btn.textContent = isVisited ? '방문 취소' : '방문 표시';
    btn.disabled = !isVisited && pendingScore === 0;
  }
  function highlightStars(score) {
    document.querySelectorAll('#rating span')
      .forEach(el => el.textContent = +el.dataset.score <= score ? '★' : '☆');
  }
};

// svg & 로그아웃(페이지 하단 버튼)
function createMarkerSVG(fill) {
  return new DOMParser().parseFromString(
    `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
       <path d="M15 1C9 1 4 6 4 12c0 6.5 7 14 11 17 4-3 11-10.5 11-17 0-6-5-11-11-11z"
             fill="${fill}" stroke="black" stroke-width="1"/>
       <circle cx="15" cy="12" r="4" fill="white"/>
     </svg>`,
    'image/svg+xml'
  ).documentElement;
}
function colorByStars(s) {
  if (s >= 5) return '#ef4444';
  if (s >= 4) return '#f97316';
  if (s >= 3) return '#f59e0b';
  if (s >= 2) return '#84cc16';
  if (s >= 1) return '#22c55e';
  return '#9ca3af';
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
});
