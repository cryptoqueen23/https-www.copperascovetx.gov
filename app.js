const records = window.COVE_RECORDS || [];
const sources = window.COVE_SOURCES || [];
const grid = document.querySelector('#recordGrid');
const search = document.querySelector('#search');
const chips = document.querySelector('#chips');
const count = document.querySelector('#resultCount');
const active = document.querySelector('#activeFilter');
let filter = 'All';
let yearFilter = 'All';
const YEARS = Array.from({length:20},(_,i)=>String(2007+i));
const yearGrid = document.querySelector('#yearGrid');
const clearYear = document.querySelector('#clearYear');
const cats = ['All', ...new Set(records.map(r=>r.category))];
const wayback = url => `https://web.archive.org/web/*/${url}`;
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function recordMatchesYear(r,y){ if(y==='All') return true; const nums=String(r.year||'').match(/20\d{2}/g)||[]; if(nums.includes(y)) return true; if(nums.length>=2){const a=+nums[0],b=+nums[1]; return +y>=a && +y<=b;} return false;}
function renderYears(){yearGrid.innerHTML=YEARS.map(y=>{const n=records.filter(r=>recordMatchesYear(r,y)).length;return `<button type="button" class="year-btn ${y===yearFilter?'active':''}" data-year="${y}" aria-pressed="${y===yearFilter}"><strong>${y}</strong><span>${n} doc${n===1?'':'s'}</span></button>`}).join('');clearYear.hidden=yearFilter==='All';}
function renderChips(){chips.innerHTML=cats.map(c=>`<button type="button" class="chip ${c===filter?'active':''}" data-cat="${esc(c)}" aria-pressed="${c===filter}">${esc(c)}</button>`).join('');}
function recordCard(r){return `<article class="record"><span class="tag">${esc(r.category)} · ${esc(r.year)}</span><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><footer><span>${esc(r.status)}</span><div class="record-links"><a href="${esc(r.source)}" target="_blank" rel="noopener">City/source <span class="sr-only">for ${esc(r.title)}</span> ↗</a><a href="${esc(wayback(r.source))}" target="_blank" rel="noopener">Wayback history <span class="sr-only">for ${esc(r.title)}</span> ↗</a></div></footer></article>`}
function render(){const q=search.value.trim().toLowerCase();const rows=records.filter(r=>recordMatchesYear(r,yearFilter)&&(filter==='All'||r.category.toLowerCase()===filter.toLowerCase())&&(!q||Object.values(r).join(' ').toLowerCase().includes(q)));grid.innerHTML=rows.length?rows.map(recordCard).join(''):`<p class="empty-state">No matching records. Try another keyword or choose All.</p>`;count.textContent=`${rows.length} record${rows.length===1?'':'s'}`;active.textContent=(yearFilter==='All'?'All years':yearFilter)+' · '+(filter==='All'?'All categories':filter);renderChips();renderYears();}
yearGrid.addEventListener('click',e=>{const b=e.target.closest('[data-year]');if(!b)return;yearFilter=b.dataset.year;render();document.querySelector('#recordGrid').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
clearYear.addEventListener('click',()=>{yearFilter='All';render();});
chips.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;filter=b.dataset.cat;render();});
search.addEventListener('input',render);document.querySelector('#clearSearch').addEventListener('click',()=>{search.value='';filter='All';yearFilter='All';render();search.focus();});
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{const wanted=btn.dataset.filter.toLowerCase();const found=cats.find(c=>c.toLowerCase()===wanted)||cats.find(c=>c.toLowerCase().includes(wanted));filter=found||'All';search.value='';render();document.querySelector('#explorer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
const tl=document.querySelector('#timelineList');tl.innerHTML=(window.COVE_TIMELINE||[]).map(x=>`<article class="timeline-item"><time>${esc(x.year)}</time><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>${x.source?`<div class="record-links"><a href="${esc(x.source)}" target="_blank" rel="noopener">Source ↗</a><a href="${esc(wayback(x.source))}" target="_blank" rel="noopener">Wayback history ↗</a></div>`:''}</article>`).join('');
const menu=document.querySelector('.menu-btn'), nav=document.querySelector('#nav');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');});
nav.addEventListener('click',e=>{if(e.target.matches('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation menu');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus();}});
const sourceSearch=document.querySelector('#sourceSearch'), sourceList=document.querySelector('#sourceList'), sourceCount=document.querySelector('#sourceCount');
function renderSources(){const q=(sourceSearch?.value||'').trim().toLowerCase();const rows=sources.filter(s=>!q||Object.values(s).join(' ').toLowerCase().includes(q));sourceCount.textContent=`${rows.length} source${rows.length===1?'':'s'} indexed`;sourceList.innerHTML=rows.map(s=>`<article class="source-row"><div><span class="tag">${esc(s.category)} · ${esc(s.year)}</span><h3>${esc(s.title)}</h3><small>${esc(s.type)}</small></div><div class="source-actions"><a class="btn mini" href="${esc(s.url)}" target="_blank" rel="noopener">Open source ↗</a><a class="btn mini ghost-dark" href="${esc(s.wayback||wayback(s.url))}" target="_blank" rel="noopener">Wayback captures ↗</a></div></article>`).join('') || '<p class="empty-state">No matching sources.</p>';}
sourceSearch?.addEventListener('input',renderSources);
render();renderSources();
