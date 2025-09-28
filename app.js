/***********************
AURO Simple client-side app.js
 Put editable data near the top (monthly, initialContent, targets, styleGuides)
*************************/

const CLUBS = [
  { id: "BSI", name: "CBA", color: "#4f46e5" },
  { id: "cea", name: "CEA", color: "#16a34a" },
  { id: "ccis", name: "CCIS", color: "#f59e0b" },
  { id: "chs", name: "CHS", color: "#db2777" },
];

const AUDIENCES = ["SHS Students","College Freshmen","Alumni","Parents","Faculty/Staff"];

const monthly = [
  { m: "Jan", followers: 220, reach: 8000, engagement: 4.2},
  { m: "Feb", followers: 260, reach: 9200, engagement: 4.6},
  { m: "Mar", followers: 310, reach: 12400, engagement: 5.1},
  { m: "Apr", followers: 340, reach: 15800, engagement: 5.4},
  { m: "May", followers: 380, reach: 20100, engagement: 5.0},
  { m: "Jun", followers: 420, reach: 23000, engagement: 5.3},
  { m: "Jul", followers: 470, reach: 24800, engagement: 5.6},
  { m: "Aug", followers: 510, reach: 26200, engagement: 5.2},
];

const initialContent = [
  { id: "p1", title: "Welcome Week Teaser", club: "cba", audience: "SHS Students", status: "Backlog", platform: "Facebook", due: "2025-08-20" },
  { id: "p2", title: "Alumni Spotlight", club: "cea", audience: "Alumni", status: "In Progress", platform: "Instagram", due: "2025-08-22" },
  { id: "p3", title: "Parents FAQ", club: "ccis", audience: "Parents", status: "Review", platform: "Facebook", due: "2025-08-25" },
  { id: "p4", title: "UGC Contest: Campus Life", club: "chs", audience: "College Freshmen", status: "Published", platform: "TikTok", due: "2025-08-15" },
];

const styleGuides = [
  { club: "CBA", palette: ["#4f46e5","#a5b4fc"], voice: "Confident" },
  { club: "CEA", palette: ["#16a34a","#86efac"], voice: "Innovative" },
  { club: "CCIS", palette: ["#f59e0b","#fde68a"], voice: "Tech-savvy" },
  { club: "CHS", palette: ["#db2777","#f9a8d4"], voice: "Caring" },
];

const targets = { followers: 500, engagement: 5.0, reach: 25000, visits: 250 };

/* --- runtime state --- */
let content = [...initialContent];
let tags = ["#Vibes","#WelcomeWeek","#CampusLife"];
let ugc = [
  { name:"A. Cruz", club:"cba", link:"https://facebook.com/post/1", notes:"High reach" }
];

/* --- helpers --- */
function $(s){ return document.querySelector(s) }
function $all(s){ return Array.from(document.querySelectorAll(s)) }
function createEl(tag, attrs={}, children=[]){
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') el.className=v; else el.setAttribute(k,v) });
  children.forEach(c => el.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return el;
}

/* --- render KPI values --- */
function renderKPIs(){
  const last = monthly[monthly.length-1];
  $('#followersVal').textContent = last.followers.toLocaleString();
  $('#engagementVal').textContent = last.engagement.toFixed(1) + '%';
  $('#reachVal').textContent = last.reach.toLocaleString();
  $('#visitsVal').textContent = (last.visits || 0).toLocaleString();

  $('#followersTarget').textContent = targets.followers.toLocaleString();
  $('#engagementTarget').textContent = targets.engagement.toFixed(1);
  $('#reachTarget').textContent = targets.reach.toLocaleString();
  $('#visitsTarget').textContent = targets.visits.toLocaleString();
}

/* --- charts (Chart.js) --- */
let reachChart, audienceChart;
function initCharts(){
  const labels = monthly.map(m=>m.m);
  const reachData = monthly.map(m=>m.reach);
  const engagementData = monthly.map(m=>m.engagement);

  const ctx = $('#reachChart').getContext('2d');
  reachChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Reach', data: reachData, borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,0.12)', fill:true, tension:0.35 },
        { label:'Engagement %', data: engagementData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', yAxisID:'eng', fill:false, tension:0.35 }
      ]
    },
    options: {
      interaction:{mode:'index', intersect:false},
      scales: {
        y: { beginAtZero:true, ticks:{ callback: v => v >= 1000 ? (v/1000)+'k' : v } },
        eng: { position:'right', beginAtZero:true, ticks:{ callback: v => v + '%' } }
      },
      plugins:{legend:{position:'top'}}
    }
  });

  // audience pie
  const audience = buildAudienceMix(content);
  const pctx = $('#audiencePie').getContext('2d');
  audienceChart = new Chart(pctx, {
    type:'doughnut',
    data:{
      labels: audience.labels,
      datasets: [{ data: audience.values, backgroundColor: ['#4f46e5','#16a34a','#f59e0b','#db2777'] }]
    },
    options:{plugins:{legend:{position:'right'}}}
  });
}

/* --- calendar rendering (Aug static) --- */
function renderCalendar(targetSelector){
  const container = $(targetSelector);
  container.innerHTML = '';
  // build days 1..31
  for(let d=1; d<=31; d++){
    const dayEl = createEl('div',{class:'day'});
    dayEl.appendChild(createEl('div',{class:'date'},[String(d)]));
    // show content whose due day === d
    content.filter(it=>{
      try{ return Number(it.due.split('-')[2]) === d }catch(e){return false}
    }).forEach(it=>{
      const item = createEl('div',{class:'calendar-item'},[it.title]);
      dayEl.appendChild(item);
    });
    container.appendChild(dayEl);
  }
  function renderCalendar(targetSelector){
  const container = $(targetSelector);
  container.innerHTML = '';

  for(let d=1; d<=31; d++){
    const dayEl = createEl('div',{class:'day', 'data-day':d});
    dayEl.appendChild(createEl('div',{class:'date'},[String(d)]));

    // enable drop zone
    dayEl.ondragover = (e) => e.preventDefault();
    dayEl.ondrop = (e) => {
      const id = e.dataTransfer.getData("id");
      content = content.map(it => it.id===id ? {...it, due:`2025-08-${String(d).padStart(2,'0')}`} : it);
      renderCalendar(targetSelector);
    };

    // add events for this day
    content.filter(it=>{
      try{ return Number(it.due.split('-')[2]) === d }catch(e){return false}
    }).forEach(it=>{
      const item = createEl('div',{class:'calendar-item', draggable:true},[it.title]);
      item.ondragstart = (e) => e.dataTransfer.setData("id", it.id);
      item.onclick = () => openEventModal(it.id);
      dayEl.appendChild(item);
    });

    container.appendChild(dayEl);
  }
}

// Add event form handler
$('#addEventBtn').addEventListener('click', ()=>{
  const title = $('#eventTitle').value.trim();
  const date = $('#eventDate').value;
  const audience = $('#eventAudience').value;
  if(!title || !date) return alert("Please enter title and date");
  const id = "ev" + Date.now();
  content.push({ id, title, audience, platform:"Facebook", status:"Backlog", due:date });
  $('#eventTitle').value=''; $('#eventDate').value='';
  renderCalendar('#calendarGridLarge');
});

// Event modal
let editingId = null;
function openEventModal(id){
  const ev = content.find(e=>e.id===id);
  if(!ev) return;
  editingId = id;
  $('#modalTitle').value = ev.title;
  $('#modalAudience').innerHTML = AUDIENCES.map(a=>`<option ${a===ev.audience?'selected':''}>${a}</option>`).join('');
  $('#eventModal').style.display = 'block';
}
function closeModal(){ $('#eventModal').style.display = 'none'; editingId=null; }

$('#saveEventBtn').addEventListener('click', ()=>{
  if(!editingId) return;
  content = content.map(it=> it.id===editingId ? {...it, title:$('#modalTitle').value, audience:$('#modalAudience').value} : it);
  renderCalendar('#calendarGridLarge');
  closeModal();
});
$('#deleteEventBtn').addEventListener('click', ()=>{
  if(!editingId) return;
  content = content.filter(it=> it.id!==editingId);
  renderCalendar('#calendarGridLarge');
  closeModal();
});

}

/* --- kanban --- */
const kanbanCols = ["Backlog","In Progress","Review","Published"];
function renderKanban(){
  const root = $('#kanban');
  root.innerHTML = '';
  kanbanCols.forEach(col=>{
    const colEl = createEl('div',{class:'kanban-column'});
    colEl.appendChild(createEl('div',{class:'card-title'},[col]));
    content.filter(i=>i.status===col).forEach(it=>{
      const card = createEl('div',{class:'kanban-card'},[]);
      card.appendChild(createEl('div',{},[it.title]));
      const meta = createEl('div',{style:'font-size:12px;color:#6b7280;margin-top:6px'},[`${it.platform || ''} • ${it.audience || ''}`]);
      card.appendChild(meta);
      const controls = createEl('div',{style:'margin-top:8px;display:flex;gap:6px'},[]);
      const btnLeft = createEl('button',{class:'btn small editable'},['←']);
      const btnRight = createEl('button',{class:'btn small editable'},['→']);
      btnLeft.onclick = () => moveItem(it.id, -1);
      btnRight.onclick = () => moveItem(it.id, +1);
      controls.appendChild(btnLeft); controls.appendChild(btnRight);
      card.appendChild(controls);
      colEl.appendChild(card);
    });
    root.appendChild(colEl);
  });
}
function moveItem(id, dir){
  const cols = kanbanCols;
  content = content.map(it=>{
    if(it.id !== id) return it;
    const idx = Math.max(0, Math.min(cols.length-1, cols.indexOf(it.status) + dir));
    return {...it, status: cols[idx]};
  });
  renderKanban(); updateEditableState();
}

/* --- hashtags --- */
function renderTags(){
  const list = $('#tagsList');
  list.innerHTML = '';
  tags.forEach(t => {
    const el = createEl('div',{class:'tag'},[t]);
    const btn = createEl('button',{style:'margin-left:8px;background:none;border:0;cursor:pointer'},['✕']);
    btn.onclick = () => { tags = tags.filter(x=>x!==t); renderTags(); };
    el.appendChild(btn);
    list.appendChild(el);
  });
}

/* --- UGC tracker --- */
function renderUGCTable(){
  const tbody = $('#ugcTable tbody');
  tbody.innerHTML = '';
  ugc.forEach(u=>{
    const tr = createEl('tr',{},[
      createEl('td',{},[u.name]),
      createEl('td',{},[CLUBS.find(c=>c.id===u.club)?.name || u.club]),
      createEl('td',{},[createEl('a',{href:u.link,target:'_blank'},[u.link])]),
      createEl('td',{},[u.notes||'']),
      createEl('td',{},['Received'])
    ]);
    tbody.appendChild(tr);
  });
}

/* --- templates area --- */
function renderTemplates(){
  const area = $('#templatesArea');
  area.innerHTML = '';
  styleGuides.forEach(g=>{
    const card = createEl('div',{class:'card', style:'margin-bottom:8px;padding:12px'});
    const title = createEl('div',{style:'font-weight:600'},[g.club||'Club']);
    const palette = createEl('div',{style:'display:flex;gap:8px;margin-top:8px'},[]);
    (g.palette||[]).forEach(p=>palette.appendChild(createEl('div',{style:`width:28px;height:18px;border-radius:6px;background:${p};border:1px solid #e6edf3`},[])));
    const voice = createEl('div',{style:'font-size:13px;color:#6b7280;margin-top:8px'},['Voice: ' + (g.voice||'')]);
    card.appendChild(title); card.appendChild(palette); card.appendChild(voice);
    area.appendChild(card);
  });
}

/* --- build audience mix from content --- */
function buildAudienceMix(items){
  const map = {};
  items.forEach(i => { map[i.audience] = (map[i.audience]||0) + 1 });
  const labels = Object.keys(map); const values = Object.values(map);
  return { labels, values };
}

/* --- nav / visibility --- */
function setActiveSection(id){
  $all('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === id));
  $all('.section').forEach(s => s.classList.toggle('active', s.id === id));
}

/* --- CSV export (example: monthly) --- */
function exportCSV(rows, filename='export.csv'){
  const keys = Object.keys(rows[0]||{});
  const lines = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k]||'').replace(/"/g,'""')}"`).join(',')));
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

/* --- role & editable state --- */
function updateEditableState(){
  const role = $('#roleSelect').value;
  const canEdit = role === 'Admin' || role === 'Contributor';
  // Show/hide elements with class 'editable'
  $all('.editable').forEach(el => {
    el.style.display = canEdit ? '' : 'none';
  });
}

/* --- initialization --- */
function init(){
  
  // fill club select in UGC form
  const clubSelect = $('#ugcClub');
  CLUBS.forEach(c => clubSelect.appendChild(createEl('option',{value:c.id},[c.name])));
  // nav handlers
  $all('.nav-item').forEach(btn => btn.addEventListener('click', ()=> setActiveSection(btn.dataset.section)));
  // role change handler
  $('#roleSelect').addEventListener('change', updateEditableState);
  updateEditableState();

  // Add tag button
  $('#addTagBtn').addEventListener('click', ()=>{
    const v = $('#tagInput').value.trim();
    if(!v) return;
    tags = Array.from(new Set([v, ...tags]));
    $('#tagInput').value = '';
    renderTags();
  });

  // UGC submit
  $('#submitUGC').addEventListener('click', ()=>{
    const name = $('#ugcName').value.trim();
    const club = $('#ugcClub').value;
    const link = $('#ugcLink').value.trim();
    const notes = $('#ugcNotes').value.trim();
    if(!name || !link) return alert('Please fill name and link');
    ugc.unshift({ name, club, link, notes });
    $('#ugcName').value=''; $('#ugcLink').value=''; $('#ugcNotes').value='';
    renderUGCTable();
  });

  // export csv
  $('#exportCsvBtn').addEventListener('click', ()=> exportCSV(monthly, 'monthly.csv'));

  // first render
  renderKPIs();
  initCharts();
  renderCalendar('#calendarGrid');
  renderCalendar('#calendarGridLarge');
  renderKanban();
  renderTags();
  renderUGCTable();
  renderTemplates();
}
window.addEventListener('DOMContentLoaded', init);

 // Fake users for demo
    const USERS = [
      { username: "admin", password: "admin123", role: "Admin" },
      { username: "officer", password: "officer123", role: "Officer" }
    ];

    function login(){
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      const user = USERS.find(x => x.username === u && x.password === p);

      if(!user){
        document.getElementById("errorMsg").textContent = "Invalid login. Try again.";
        return;
      }

      // Save role and show app
      localStorage.setItem("userRole", user.role);
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("appScreen").style.display = "block";

      // Set role automatically
      document.getElementById("roleSelect").value = user.role;
      updateEditableState();
    }

    // Auto-login if role saved
    window.addEventListener("DOMContentLoaded", () => {
      const role = localStorage.getItem("userRole");
      if(role){
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("appScreen").style.display = "block";
        document.getElementById("roleSelect").value = role;
        updateEditableState();
      }
    });

    function logout(){
  localStorage.removeItem("userRole");
  document.getElementById("appScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("errorMsg").textContent = "";
}

window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  if(role){
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "block";
    document.getElementById("roleSelect").value = role;
    updateEditableState();
  }
  // Attach logout handler
  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// Example dataset for clubs
const clubData = {
  vibes: { followers: 1200, engagement: "15%", reach: 8000, visits: 120 },
  sites: { followers: 950, engagement: "12%", reach: 6000, visits: 90 },
  arts: { followers: 1500, engagement: "18%", reach: 10000, visits: 200 },
};

function switchClub(club) {
  const data = clubData[club];
  document.getElementById("followersVal").textContent = data.followers;
  document.getElementById("engagementVal").textContent = data.engagement;
  document.getElementById("reachVal").textContent = data.reach;
  document.getElementById("visitsVal").textContent = data.visits;
  
  // Update charts too (if you want dynamic charts)
  // Example: reachChart.data.datasets[0].data = [ ...new data... ]; reachChart.update();
}

    