// sc/js/mypage.js
import { supabase } from './supabase.js';

const $name = document.getElementById('myName');
const $email = document.getElementById('myEmail');
const $avatar = document.getElementById('myAvatar');
const $saved = document.getElementById('statSaved');
const $visited = document.getElementById('statVisited');
const $likes = document.getElementById('statLikes');
const $myPosts = document.getElementById('myPosts');

const $logout = document.getElementById('logoutBtn');
const $edit = document.getElementById('editProfileBtn');

const { data: { session } } = await supabase.auth.getSession();
if (!session) { location.href = 'login.html'; throw new Error('로그인 필요'); }

const user = session.user;
const nickname = user.user_metadata?.name || 'Guest';
$name.textContent = nickname;
$email.textContent = user.email || '';
$avatar.textContent = (nickname[0] || 'G').toUpperCase();

const [{ data: posts }, { data: ratings }] = await Promise.all([
  supabase.from('posts').select('id, title, markers, created_at, public_token').eq('user_id', user.id).order('created_at', { ascending:false }),
  supabase.from('ratings').select('restaurant_id, stars').eq('user_id', user.id)
]);

$saved.textContent = (posts?.length || 0);
$visited.textContent = (ratings?.length || 0);
$likes.textContent = 0; // likes 테이블 도입 시 갱신

// 내 게시글 렌더
if (!posts || posts.length === 0) {
  $myPosts.innerHTML = `<div class="muted">아직 공유한 지도가 없습니다.</div>`;
} else {
  $myPosts.innerHTML = posts.map(p => `
    <div class="card">
      <div class="my-row">
        <strong>${escapeHtml(p.title)}</strong>
        <span class="muted">마커 ${p.markers?.length || 0}</span>
      </div>
      <div class="btn-row" style="margin-top:10px">
        <a class="btn ghost" href="index.html?post=${encodeURIComponent(p.id)}">지도에서 보기</a>
        <button class="btn" data-copy="${encodeURIComponent(p.public_token || '')}">공유</button>
      </div>
    </div>
  `).join('');

  // 공유 링크 복사 (shared.html?token=...)
  $myPosts.querySelectorAll('button[data-copy]').forEach(btn=>{
    btn.onclick = async () => {
      const token = btn.getAttribute('data-copy');
      const link = `${location.origin}${location.pathname.replace('mypage.html','')}shared.html?token=${encodeURIComponent(token)}`;
      try { await navigator.clipboard.writeText(link); alert('공유 링크를 복사했어요!'); }
      catch { prompt('링크를 복사하세요', link); }
    };
  });
}

// 로그아웃
$logout?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
});

// 프로필 편집(닉네임)
$edit?.addEventListener('click', async () => {
  const next = prompt('닉네임을 입력하세요', $name.textContent || '');
  if (!next) return;
  const { error } = await supabase.auth.updateUser({ data: { name: next } });
  if (error) { alert('프로필 업데이트 실패: ' + error.message); return; }
  $name.textContent = next;
  $avatar.textContent = (next[0] || 'G').toUpperCase();
});

// helpers
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
