function init(){
  const list = document.getElementById('list');
  const preview = document.getElementById('preview');
  const previewBackdrop = document.getElementById('preview-backdrop');
  const previewImg = document.getElementById('preview-img');
  const previewCap = document.getElementById('preview-cap');
  const countEl = document.getElementById('count');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');

  const isAdmin = window.location.hash === '#admin';

  const STORAGE_KEY = 'milksky.files.v1';
  let FILES = []; // { name, sizeStr, kind, dateStr, icon, isImage, url }
  let selectedIdx = -1;
  let searchQuery = '';
  let sortKey = 'name'; // 'name' | 'date' | 'size' | 'kind'
  let sortDir = 1;       // 1 = asc, -1 = desc

  // Load persisted files
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) FILES = JSON.parse(raw) || [];
  } catch(_) { FILES = []; }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(FILES)); } catch(_) {}
  }

  function readAsDataURL(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function fmtSize(bytes){
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    if(bytes < 1024*1024*1024) return (bytes/1024/1024).toFixed(1) + ' MB';
    return (bytes/1024/1024/1024).toFixed(2) + ' GB';
  }

  const FIRST_NAMES = ["alex","mira","jules","kenji","sasha","theo","luca","nora","ines","miles","yuki","omar","ivy","ren","cleo","arlo","june","kira","leo","wren","mae","otis","ada","finn","poppy","sage","rumi","blaise","nico","zola"];
  const LAST_NAMES  = ["hart","vega","monroe","ito","kimura","brooks","nilsson","okafor","park","santos","wallace","greene","koenig","romano","ashby","carter","delgado","fontaine","huang","ivers","jovic","langley","mccoy","nakamura","ortega","pham","quinn","rourke","stein","tasse"];
  function randDateStr(){
    const start = new Date(2007, 0, 1).getTime();
    const end = Date.now();
    const d = new Date(start + Math.random() * (end - start));
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return String(d.getDate()).padStart(2,'0') + '-' + m[d.getMonth()].toLowerCase() + '-' + d.getFullYear();
  }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randomName(originalName){
    const ext = (originalName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const start = new Date(2000, 0, 1).getTime();
    const end = Date.now();
    const d = new Date(start + Math.random() * (end - start));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const variants = [
      yyyy + '-' + mm + '-' + dd,
      yyyy + mm + dd + '_' + hh + mi,
      dd + '.' + mm + '.' + yyyy,
      yyyy + '_' + mm + '_' + dd + '_' + hh + mi + ss,
      'IMG_' + yyyy + mm + dd + '_' + hh + mi,
    ];
    const base = variants[Math.floor(Math.random() * variants.length)];
    return ext ? base + '.' + ext : base;
  }
  function fmtDate(d){
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return String(d.getDate()).padStart(2,'0') + ' ' + m[d.getMonth()] + ' ' + d.getFullYear() +
           ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  function kindFor(file){
    const t = file.type || '';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if(t.startsWith('image/')) return t.replace('image/','').toUpperCase() + ' image';
    if(t.startsWith('video/')) return t.replace('video/','').toUpperCase() + ' video';
    if(t.startsWith('audio/')) return t.replace('audio/','').toUpperCase() + ' audio';
    if(t === 'application/pdf') return 'PDF document';
    if(ext === 'zip') return 'ZIP archive';
    if(ext === 'txt' || ext === 'md') return 'Plain text';
    if(ext === 'html') return 'HTML document';
    if(ext === 'js' || ext === 'ts' || ext === 'css') return 'Source file';
    return ext ? ext.toUpperCase() + ' file' : 'File';
  }
  function iconFor(file){
    const t = file.type || '';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if(t.startsWith('image/')) return 'img';
    if(t === 'application/pdf') return 'pdf';
    if(ext === 'zip') return 'zip';
    if(t.startsWith('audio/') || t.startsWith('video/')) return 'app';
    return 'doc';
  }

  function sortValue(f, key){
    if(key === 'name') return f.name.toLowerCase();
    if(key === 'date') return f.dateStr;
    if(key === 'size') return f.sizeBytes || 0;
    if(key === 'kind') return f.kind.toLowerCase();
    return '';
  }

  let viewMode = 'grid'; // 'list' | 'grid'
  const colsEl = document.querySelector('.cols');

  function showPreview(f, idx){
    selectedIdx = idx;
    previewImg.className = 'img';
    previewImg.innerHTML = '';
    if(f.isImage){
      const im = document.createElement('img');
      im.src = f.url;
      im.addEventListener('load', () => {
        if(im.naturalHeight > im.naturalWidth) im.classList.add('portrait');
      });
      previewImg.appendChild(im);
    } else {
      const ph = document.createElement('div');
      ph.className = 'ph ' + (f.icon === 'pdf' ? 'pdf' : f.icon === 'zip' ? 'zip' : 'notes');
      previewImg.appendChild(ph);
    }
    previewCap.textContent = '/ ' + f.name;
    preview.classList.add('show');
    previewBackdrop.classList.add('show');
    render();
  }

  function render(){
    list.innerHTML = '';

    const q = searchQuery.trim().toLowerCase();
    const visible = FILES
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = sortValue(a.f, sortKey), vb = sortValue(b.f, sortKey);
        return va < vb ? -sortDir : va > vb ? sortDir : 0;
      });

    if(viewMode === 'grid'){
      colsEl.style.display = 'none';
      list.classList.add('grid-view');
      visible.forEach(({ f, idx }) => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.dataset.idx = idx;

        if(f.isImage && f.url){
          const img = document.createElement('img');
          img.src = f.url;
          img.alt = f.name;
          img.loading = 'lazy';
          item.appendChild(img);
        } else {
          const iconWrap = document.createElement('div');
          iconWrap.className = 'grid-icon';
          const g = document.createElement('span');
          g.className = 'g ' + f.icon;
          iconWrap.appendChild(g);
          item.appendChild(iconWrap);
        }

        const label = document.createElement('div');
        label.className = 'grid-label';
        label.textContent = f.name;
        item.appendChild(label);

        if(isAdmin){
          const delBtn = document.createElement('button');
          delBtn.className = 'grid-del';
          delBtn.textContent = '×';
          delBtn.title = 'Delete';
          delBtn.setAttribute('aria-label', 'Delete');
          delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteAt(idx); });
          item.appendChild(delBtn);
        }

        item.addEventListener('click', (e) => {
          if(e.target.closest('.grid-del')) return;
          showPreview(f, idx);
        });

        list.appendChild(item);
      });

    } else {
      colsEl.style.display = '';
      list.classList.remove('grid-view');

      // Update column header arrows
      document.querySelectorAll('.cols > div[data-sort]').forEach(el => {
        const k = el.dataset.sort;
        el.classList.toggle('sorted', k === sortKey);
        if(k === sortKey){ el.dataset.dir = sortDir === 1 ? 'asc' : 'desc'; }
        else { delete el.dataset.dir; }
      });

      visible.forEach(({ f, idx }) => {
        const row = document.createElement('div');
        row.className = 'row' + (idx === selectedIdx ? ' selected' : '');
        row.dataset.idx = idx;
        row.innerHTML =
          '<div class="ico"><span class="g ' + f.icon + '"></span></div>' +
          '<div class="name">' + f.name + '</div>' +
          '<div>' + f.dateStr + '</div>' +
          '<div>' + f.sizeStr + '</div>' +
          '<div class="kind-cell">' +
            '<span class="kind-text">' + f.kind + '</span>' +
            (isAdmin ? '<button class="del-btn" title="Delete" aria-label="Delete">×</button>' : '') +
          '</div>';

        row.querySelector('.del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteAt(idx);
        });
        row.addEventListener('click', (e) => {
          if(e.target.closest('.name') || e.target.closest('.del-btn')) return;
          selectedIdx = idx;
          render();
        });

        const nameEl = row.querySelector('.name');
        nameEl.addEventListener('click', (e) => {
          e.stopPropagation();
          showPreview(f, idx);
        });

        row.addEventListener('dblclick', () => { if(f.url) window.open(f.url, '_blank'); });

        list.appendChild(row);
      });
    }

    countEl.textContent = q ? visible.length + ' of ' + FILES.length : FILES.length;
    if(FILES.length === 0){ dropzone.classList.add('empty'); }
    else { dropzone.classList.remove('empty'); }
  }

  async function addFiles(fileList){
    const arr = [...fileList].filter(f => (f.type || '').startsWith('image/'));
    if(arr.length === 0){
      // Briefly flash the dropzone to indicate non-images were rejected
      dropzone.classList.add('reject');
      setTimeout(() => dropzone.classList.remove('reject'), 600);
      return;
    }
    for(const file of arr){
      let url = '';
      try {
        // Persist as data URL so files survive reload
        url = await readAsDataURL(file);
      } catch(_) {
        url = URL.createObjectURL(file);
      }
      FILES.push({
        name: randomName(file.name),
        sizeStr: fmtSize(file.size),
        sizeBytes: file.size,
        kind: kindFor(file),
        dateStr: fmtDate(new Date(file.lastModified || Date.now())),
        icon: iconFor(file),
        isImage: (file.type || '').startsWith('image/'),
        url
      });
    }
    persist();
    render();
  }

  function deleteAt(idx){
    if(idx < 0 || idx >= FILES.length) return;
    FILES.splice(idx, 1);
    if(selectedIdx === idx) selectedIdx = -1;
    else if(selectedIdx > idx) selectedIdx -= 1;
    persist();
    render();
  }

  function clearAll(){
    if(FILES.length === 0) return;
    if(!confirm('Delete all ' + FILES.length + ' files from the database?')) return;
    FILES = [];
    selectedIdx = -1;
    persist();
    render();
  }

  // Drag & drop — bind on document (capture) and on dropzone explicitly
  function onDragOver(e){
    e.preventDefault();
    e.stopPropagation();
    if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dropzone.classList.add('hot');
  }
  function onDragLeave(e){
    if(e.target === dropzone || e.target === document.body) dropzone.classList.remove('hot');
  }
  function onDrop(e){
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('hot');
    const files = e.dataTransfer && e.dataTransfer.files;
    if(files && files.length) addFiles(files);
  }

  ['dragenter','dragover'].forEach(ev => {
    window.addEventListener(ev, onDragOver, true);
    dropzone.addEventListener(ev, onDragOver);
  });
  window.addEventListener('dragleave', onDragLeave, true);
  window.addEventListener('drop', onDrop, true);
  dropzone.addEventListener('drop', onDrop);

  browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if(fileInput.files && fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = '';
  });

  // Search
  const searchInput = document.querySelector('.search input');
  if(searchInput){
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      selectedIdx = -1;
      render();
    });
    searchInput.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){ searchInput.value = ''; searchQuery = ''; render(); }
    });
  }

  // Column sort headers
  document.querySelectorAll('.cols > div[data-sort]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const k = el.dataset.sort;
      if(sortKey === k){ sortDir *= -1; }
      else { sortKey = k; sortDir = 1; }
      render();
    });
  });

  // View mode buttons (Icons / List)
  const viewBtns = document.querySelectorAll('.nav .btn[title="Icons"], .nav .btn[title="List"], .nav .btn[title="Columns"]');
  document.querySelector('.btn[title="Icons"]')?.addEventListener('click', () => {
    viewMode = 'grid';
    viewBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.btn[title="Icons"]').classList.add('active');
    render();
  });
  document.querySelector('.btn[title="List"]')?.addEventListener('click', () => {
    viewMode = 'list';
    viewBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.btn[title="List"]').classList.add('active');
    render();
  });

  function hidePreview(){
    preview.classList.remove('show');
    previewBackdrop.classList.remove('show');
  }

  // Backdrop click dismisses preview (and blocks clicks from reaching elements behind it)
  previewBackdrop.addEventListener('click', hidePreview);

  // Hide preview when clicking outside the name link or preview itself
  document.addEventListener('click', (e) => {
    if(!preview.classList.contains('show')) return;
    if(e.target.closest('.name')) return;
    if(e.target.closest('.preview')) return;
    if(e.target === previewBackdrop) return; // handled by backdrop listener
    hidePreview();
  });

  // Esc dismisses the preview
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && preview.classList.contains('show')) hidePreview();
  });

  // Delete key removes selected row (admin only)
  if(isAdmin){
    document.addEventListener('keydown', (e) => {
      if((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx >= 0){
        const target = e.target;
        if(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        deleteAt(selectedIdx);
      }
    });
  }

  // Clear all button (admin only)
  const clearBtn = document.getElementById('clear-all');
  if(clearBtn){
    if(isAdmin){ clearBtn.addEventListener('click', clearAll); }
    else { clearBtn.style.display = 'none'; }
  }

  render();

  // ---------- Drag window ----------
  const win = document.querySelector('.win');
  const titlebar = win.querySelector('.titlebar');
  let dragOff = null;
  titlebar.addEventListener('mousedown', (e) => {
    if(e.target.closest('.dot')) return; // don't drag from buttons
    const r = win.getBoundingClientRect();
    dragOff = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    // Lock window to absolute viewport position so flex-centering stops fighting us
    win.style.position = 'fixed';
    win.style.margin = '0';
    win.style.left = r.left + 'px';
    win.style.top = r.top + 'px';
    document.body.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if(!dragOff) return;
    const r = win.getBoundingClientRect();
    let x = e.clientX - dragOff.dx;
    let y = e.clientY - dragOff.dy;
    // Clamp so the entire window stays within the viewport
    const maxX = window.innerWidth - r.width;
    const maxY = window.innerHeight - r.height;
    if(x < 0) x = 0;
    if(y < 0) y = 0;
    if(x > maxX) x = maxX;
    if(y > maxY) y = maxY;
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });
  window.addEventListener('mouseup', () => {
    if(!dragOff) return;
    dragOff = null;
    document.body.style.cursor = '';
  });

  // ---------- Genie minimize ----------
  const hideBtn = document.getElementById('hide-btn');
  const finderDock = document.getElementById('dock-finder');
  let busy = false;

  function isHidden(){ return win.classList.contains('genie-out'); }

  function genieDown(){
    const r = win.getBoundingClientRect();
    const vh = window.innerHeight, vw = window.innerWidth;
    let tx = vw / 2, ty = vh - 4;
    if (finderDock) {
      const fr = finderDock.getBoundingClientRect();
      tx = fr.left + fr.width / 2;
      ty = fr.top + fr.height / 2;
    }
    win.style.setProperty('--gx', (tx - (r.left + r.width / 2)) + 'px');
    win.style.setProperty('--gy', (ty - r.top) + 'px');
    win.classList.add('genie-out');
    if (finderDock) finderDock.classList.add('has-window');
  }

  function hideInstant(){
    // Force a measure so getBoundingClientRect reflects layout, then set vars
    // and add genie-out without playing the transition.
    const prev = win.style.transition;
    win.style.transition = 'none';
    const r = win.getBoundingClientRect();
    const vh = window.innerHeight, vw = window.innerWidth;
    let tx = vw / 2, ty = vh - 4;
    if (finderDock) {
      const fr = finderDock.getBoundingClientRect();
      tx = fr.left + fr.width / 2;
      ty = fr.top + fr.height / 2;
    }
    win.style.setProperty('--gx', (tx - (r.left + r.width / 2)) + 'px');
    win.style.setProperty('--gy', (ty - r.top) + 'px');
    win.classList.add('genie-out');
    if (finderDock) finderDock.classList.add('has-window');
    // Force reflow then restore the transition
    void win.offsetWidth;
    win.style.transition = prev;
  }
  function genieUp(){
    win.classList.add('genie-in');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      win.classList.remove('genie-out');
      win.classList.remove('genie-in');
    }));
    if (finderDock) finderDock.classList.remove('has-window');
  }

  hideBtn.addEventListener('click', () => {
    if(busy || isHidden()) return;
    busy = true;
    genieDown();
    setTimeout(() => { busy = false; }, 450);
  });

  if (finderDock) {
    finderDock.addEventListener('click', () => {
      if(busy || !isHidden()) return;
      busy = true;
      genieUp();
      setTimeout(() => { busy = false; }, 450);
    });
  }

  // Desktop folder icon: same restore behavior as the Finder dock icon
  const deskFolder = document.getElementById('desk-myspace');
  if (deskFolder) {
    deskFolder.addEventListener('click', (e) => {
      e.preventDefault();
      if(busy || !isHidden()) return;
      busy = true;
      genieUp();
      setTimeout(() => { busy = false; }, 450);
    });
  }

  // Start with the window hidden on every page load
  hideInstant();

  // ---------- Trash confirm dialog ----------
  const trashBtn = document.getElementById('dock-trash');
  const modal = document.getElementById('trash-modal');
  const tdCancel = document.getElementById('td-cancel');
  const tdOk = document.getElementById('td-ok');

  function openTrashModal(){
    if(!modal) return;
    modal.hidden = false;
    // focus the default button so Enter triggers it
    setTimeout(() => tdOk && tdOk.focus(), 0);
  }
  function closeTrashModal(){
    if(!modal) return;
    modal.hidden = true;
  }

  if (trashBtn) {
    trashBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openTrashModal();
    });
  }
  if (tdCancel) tdCancel.addEventListener('click', closeTrashModal);
  if (tdOk) tdOk.addEventListener('click', closeTrashModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTrashModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (modal && !modal.hidden && (e.key === 'Escape')) closeTrashModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
