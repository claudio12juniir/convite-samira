const weddingDate = new Date('2026-11-07T19:00:00-03:00');
const pad = (n, size = 2) => String(Math.max(0, n)).padStart(size, '0');

const gate = document.getElementById('invitation-gate');
const seal = document.getElementById('wax-seal');
document.body.classList.add('gate-locked');
let dragStart = 0;
let dragOffset = 0;
let dragging = false;

function openInvitation() {
  if (gate.classList.contains('opening')) return;
  gate.classList.add('opening');
  seal.style.transform = '';
  document.body.classList.remove('gate-locked');
  setTimeout(() => gate.classList.add('is-open'), 950);
}
seal.addEventListener('pointerdown', event => {
  dragging = true; dragStart = event.clientY; dragOffset = 0;
  seal.setPointerCapture(event.pointerId);
  seal.style.animation = 'none';
});
seal.addEventListener('pointermove', event => {
  if (!dragging) return;
  dragOffset = Math.min(0, event.clientY - dragStart);
  seal.style.transform = `translateY(${dragOffset}px) rotate(${dragOffset / 10}deg)`;
  gate.style.setProperty('--pull', Math.min(1, Math.abs(dragOffset) / 120));
});
seal.addEventListener('pointerup', event => {
  if (!dragging) return;
  dragging = false; seal.releasePointerCapture(event.pointerId);
  if (dragOffset < -85) openInvitation();
  else { seal.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)'; seal.style.transform = ''; setTimeout(() => { seal.style.transition=''; seal.style.animation=''; }, 420); }
});
seal.addEventListener('pointercancel', () => { dragging=false; seal.style.transform=''; });
seal.addEventListener('click', event => { if (Math.abs(dragOffset) < 8 && event.detail !== 0) openInvitation(); });
seal.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openInvitation(); } });

function updateCountdown() {
  const distance = weddingDate - new Date();
  if (distance <= 0) {
    document.querySelector('.count-label').textContent = 'Chegou o grande dia!';
    ['days','hours','minutes','seconds'].forEach(id => document.getElementById(id).textContent = id === 'days' ? '000' : '00');
    return;
  }
  document.getElementById('days').textContent = pad(Math.floor(distance / 86400000), 3);
  document.getElementById('hours').textContent = pad(Math.floor(distance / 3600000) % 24);
  document.getElementById('minutes').textContent = pad(Math.floor(distance / 60000) % 60);
  document.getElementById('seconds').textContent = pad(Math.floor(distance / 1000) % 60);
}
updateCountdown(); setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.page-progress').style.width = `${max ? scrollY / max * 100 : 0}%`;
}, { passive: true });

document.getElementById('save-date').addEventListener('click', () => {
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Diogo e Samira//Casamento//PT-BR','BEGIN:VEVENT','UID:diogo-samira-07112026@convite','DTSTAMP:20260901T120000Z','DTSTART:20261107T220000Z','DTEND:20261108T030000Z','SUMMARY:Casamento de Diogo e Samira','DESCRIPTION:Esperamos você para celebrar conosco!','LOCATION:Estrada do Marco 167, Granja Votorantim, Ibiúna - SP','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar;charset=utf-8'}));
  link.download = 'casamento-diogo-e-samira.ics'; link.click(); URL.revokeObjectURL(link.href);
});

const pixKey = '11999590976';
const pixEmvKey = '+5511999590976';
document.getElementById('copy-pix').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(pixKey); } catch { const t=document.createElement('textarea');t.value=pixKey;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove(); }
  const toast = document.getElementById('toast'); toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200);
});

function crc16(payload) {
  let crc = 0xFFFF;
  for (let i=0;i<payload.length;i++) { crc ^= payload.charCodeAt(i)<<8; for(let j=0;j<8;j++) crc = (crc & 0x8000) ? (crc<<1)^0x1021 : crc<<1; crc &= 0xFFFF; }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}
const field = (id, value) => id + String(value.length).padStart(2,'0') + value;
function pixPayload() {
  const gui = field('00','BR.GOV.BCB.PIX');
  const key = field('01', pixEmvKey);
  const merchant = field('26', gui + key);
  let payload = field('00','01') + merchant + field('52','0000') + field('53','986') + field('58','BR') + field('59','DIOGO E SAMIRA') + field('60','SAO PAULO') + field('62',field('05','CASAMENTO')) + '6304';
  return payload + crc16(payload);
}
const qrTarget = document.getElementById('qrcode');
if (window.QRCode) { qrTarget.innerHTML=''; new QRCode(qrTarget,{text:pixPayload(),width:168,height:168,colorDark:'#14243b',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M}); }
else { qrTarget.innerHTML='<span>Use a chave Pix<br>logo abaixo</span>'; }
