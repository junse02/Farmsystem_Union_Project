import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://jrihebqeovpcugbkljnb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaWhlYnFlb3ZwY3VnYmtsam5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk1NjgsImV4cCI6MjA2OTM1NTU2OH0.NvMXkqh1tuFWF5gcFxCIaDNRLfshfbnkhokgPA0OqdQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const $ = (sel) => document.querySelector(sel);
$('#signIn').onclick = async () => handle('signIn');
$('#signUp').onclick = async () => handle('signUp');

async function handle(mode){
  const email = $('#email').value.trim();
  const password = $('#pw').value.trim();
  if(!email||!password){show('이메일과 비밀번호를 입력하세요');return;}
  let resp;
  if(mode==='signIn'){
    resp = await supabase.auth.signInWithPassword({email,password});
  }else{
    resp = await supabase.auth.signUp({email,password});
  }
  if(resp.error){show(resp.error.message);}else{
    if(mode==='signUp'){
      show('가입 성공! 이메일 확인 후 로그인하세요.', false);
    }else{
      location.href = 'index.html';
    }
  }
}

function show(msg, isErr = true) {
  const el = $('#msg');
  el.style.color = isErr ? '#e11d48' : '#059669';
  el.textContent = msg;
}

supabase.auth.getSession().then(({data})=>{
  if(data.session) location.href='index.html';
});