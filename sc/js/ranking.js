// /sc/js/ranking.js
import { supabase } from './supabase.js';

const $list  = document.getElementById('rankList');
const $empty = document.getElementById('empty');
const $err   = document.getElementById('error');

// (선택) 로그인 요구 시
const { data: { session } } = await supabase.auth.getSession();
if (!session) { location.href = 'login.html'; throw new Error('로그인 필요'); }

// 1) View에서 랭킹 읽기
const { data, error } = await supabase
  .from('restaurant_rankings')     // ← 뷰 이름
  .select('*')
  .order('avg_stars', { ascending: false })
  .order('ratings_count', { ascending: false });

if (error) {
  console.error('[ranking view error]', error);
  $err.style.display = 'block';
  $err.textContent = '데이터를 불러오는 중 오류가 발생했습니다.';
} else if (!data || data.length === 0) {
  $empty.style.display = 'block';
  $list.innerHTML = '';
} else {
  renderRanking(data); // ← 뷰 결과 바로 렌더
}

/* ---------- render ---------- */
function renderRanking(rows) {
  $empty.style.display = 'none';
  $list.innerHTML = rows.map((r, i) => `
    <div class="card">
      <div class="row">
        <span class="rank">#${i + 1}</span>
        <strong class="name">${escapeHtml(r.restaurant_name)}</strong>
      </div>
      <div class="meta">
        ★ ${Number(r.avg_stars).toFixed(2)} <span class="light">(${r.ratings_count}명)</span>
      </div>
      <div class="row">
        <a class="btn" href="index.html?restaurant=${encodeURIComponent(r.restaurant_id)}">지도에서 보기</a>
      </div>
    </div>
  `).join('');
}

/* ---------- helpers ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
