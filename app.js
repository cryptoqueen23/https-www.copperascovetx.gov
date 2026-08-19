const records = window.COVE_RECORDS || [];
const grid = document.querySelector('#recordGrid');
const search = document.querySelector('#search');
const chips = document.querySelector('#chips');
const count = document.querySelector('#resultCount');
const active = document.querySelector('#activeFilter');
let filter = 'All';
const cats = ['All', ...new Set(records.map(r=>r.category))];
function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function renderChips(){chips.innerHTML=cats.map(c=>`<button class="chip ${c===filter?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');}
function render(){const q=search.value.trim().toLowerCase();const rows=records.filter(r=>(filter==='All'||r.category.toLowerCase()===filter.toLowerCase())&&(!q||Object.values(r).join(' ').toLowerCase().includes(q)));grid.innerHTML=rows.length?rows.map(r=>`<article class="record"><span class="tag">${esc(r.category)} · ${esc(r.year)}</span><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><footer><span>${esc(r.status)}</span><a href="${esc(r.source)}" target="_blank" rel="noopener">Source ↗</a></footer></article>`).join(''):`<p>No matching records yet. Try another keyword or category.</p>`;count.textContent=`${rows.length} record${rows.length===1?'':'s'}`;active.textContent=filter==='All'?'All categories':filter;renderChips();}
chips.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;filter=b.dataset.cat;render();});
search.addEventListener('input',render);document.querySelector('#clearSearch').addEventListener('click',()=>{search.value='';filter='All';render();});
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{const wanted=btn.dataset.filter.toLowerCase();const found=cats.find(c=>c.toLowerCase()===wanted)||cats.find(c=>c.toLowerCase().includes(wanted));filter=found||'All';search.value='';render();document.querySelector('#explorer').scrollIntoView({behavior:'smooth'});}));
const tl=document.querySelector('#timelineList');tl.innerHTML=(window.COVE_TIMELINE||[]).map(x=>`<article class="timeline-item"><time>${esc(x.year)}</time><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('');
const menu=document.querySelector('.menu-btn'), nav=document.querySelector('#nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});nav.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')});
render();
