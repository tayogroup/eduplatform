
(function(){
  function create(config){
    const state = {
      batchStepId: null,
      batchDone: new Set(),
      done: new Set(),
      activeKey: null,
      justOpened: false,
      button: null,
      overlay: null,
      gridEl: null,
      closeBtn: null,
      resetBtn: null,
      printBtn: null,
      badge: null,
      rowsSel: null,
      colsSel: null
    };

    const cfg = Object.assign({
      unitKey: 'unit',
      storageBatchKey: 'pq_write_batch_done_v1',
      storageSettingsKey: 'pq_write_settings_v1',
      defaultSettings: { rows: 6, cols: 3 },
      buttonId: 'btnTrace',
      displayLabel: 'Write',
      batchStepIds: ['trace1', 'trace2'],
      batchRows: 2,
      batchCols: 3,
      getCurrentStep: () => ({ step: null, progress: null }),
      getGrid: () => null,
      getLetters: () => [],
      onUiRefresh: () => {},
      onStepCompleted: async () => {},
      onApplyRuntimeCompletion: null,
      onMaybeCompleteLegacy: async () => {},
    }, config || {});

    function loadBatchDone(stepId){
      try{
        const raw = localStorage.getItem(cfg.storageBatchKey);
        const obj = raw ? JSON.parse(raw) : {};
        const arr = (obj && obj[stepId]) ? obj[stepId] : [];
        return new Set(Array.isArray(arr) ? arr.map(x=>parseInt(x,10)).filter(Number.isFinite) : []);
      }catch(_e){ return new Set(); }
    }

    function saveBatchDone(stepId, set){
      try{
        const raw = localStorage.getItem(cfg.storageBatchKey);
        const obj = raw ? JSON.parse(raw) : {};
        obj[stepId] = Array.from(set || []);
        localStorage.setItem(cfg.storageBatchKey, JSON.stringify(obj));
      }catch(_e){}
    }

    function getSelectedKey(){
      try{
        const grid = cfg.getGrid();
        const t = grid && grid.querySelector('.tile.active');
        return t ? (t.getAttribute('data-key') || t.dataset.key || '') : '';
      }catch(_e){ return ''; }
    }

    function getTraceTargetKeys(){
      try{
        const cur = cfg.getCurrentStep();
        const sid = (cur && cur.step && cur.step.id) ? String(cur.step.id||'') : '';
        const grid = cfg.getGrid();
        const tiles = grid ? [...grid.querySelectorAll('.tile')] : [];
        const keysAll = tiles.map(t => (t.getAttribute('data-key')||t.dataset.key||'')).filter(Boolean);
        if (sid === 'trace1') return keysAll.slice(0, 6);
        if (sid === 'trace2') return keysAll.slice(6, 12);
        return [];
      }catch(_e){ return []; }
    }

    function loadSettings(){
      try{
        const raw = localStorage.getItem(cfg.storageSettingsKey);
        if(!raw) return Object.assign({}, cfg.defaultSettings);
        const o = JSON.parse(raw);
        return {
          rows: parseInt(o.rows || cfg.defaultSettings.rows, 10),
          cols: parseInt(o.cols || cfg.defaultSettings.cols, 10)
        };
      }catch(_e){ return Object.assign({}, cfg.defaultSettings); }
    }

    function saveSettings(rows, cols){
      try{ localStorage.setItem(cfg.storageSettingsKey, JSON.stringify({rows, cols})); }catch(_e){}
    }

    function syncUI(){
      try{
        const grid = cfg.getGrid();
        const cur = cfg.getCurrentStep();
        const step = cur ? cur.step : null;
        const progress = cur ? cur.progress : null;

        if(step && (step.id === 'trace1' || step.id === 'trace2') && progress && progress.completed){
          if(state.done && state.done.size){ state.done = new Set(); }
        }

        const inWriteStep = !!(step && (step.id === 'trace1' || step.id === 'trace2'));
        const enabled = !!inWriteStep;

        if(state.button){
          state.button.disabled = !enabled;
          state.button.classList.toggle('disabled', !enabled);
          state.button.style.opacity = enabled ? '1' : '.45';
          state.button.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        if(grid){
          [...grid.querySelectorAll('.tile')].forEach(t=>{
            const k=(t.getAttribute('data-key')||t.dataset.key||'');
            t.classList.toggle('aw-done', !!k && state.done.has(k));
          });
        }
      }catch(e){ console.warn('['+cfg.unitKey+' Write] sync ui failed', e); }
    }

    function makeTile(L, idx){
      const NS='http://www.w3.org/2000/svg';
      const svg=document.createElementNS(NS,'svg');
      svg.setAttribute('viewBox','0 0 200 200');
      svg.setAttribute('width','100%');
      svg.setAttribute('height','100%');
      svg.style.background='#fff';
      svg.style.border='1px solid #e7dbc1';
      svg.style.borderRadius='10px';
      svg.style.touchAction='none';

      const top=70, mid=95, base=130, bottom=165;
      function line(y,dash=null,wid=2,col='#e8e2cf'){
        const l=document.createElementNS(NS,'line');
        l.setAttribute('x1','8'); l.setAttribute('x2','192');
        l.setAttribute('y1',String(y)); l.setAttribute('y2',String(y));
        l.setAttribute('stroke',col); l.setAttribute('stroke-width',String(wid));
        if(dash) l.setAttribute('stroke-dasharray',dash);
        return l;
      }
      svg.append(line(top));
      svg.append(line(mid,'14 10',2,'#e0d6bc'));
      svg.append(line(base,null,3,'#d5c8a2'));
      svg.append(line(bottom));

      const ex=document.createElementNS(NS,'text');
      ex.setAttribute('x','100'); ex.setAttribute('y', String(base-6));
      ex.setAttribute('text-anchor','middle');
      ex.setAttribute('dominant-baseline','alphabetic');
      ex.setAttribute('fill','#10223a'); ex.setAttribute('opacity','.12');
      ex.setAttribute('font-family','Noto Naskh Arabic, Amiri, Scheherazade New, serif');
      ex.setAttribute('font-weight','900'); ex.setAttribute('font-size','72');
      ex.textContent = String((L && L.ar) || '').replace('◌','');
      svg.append(ex);

      const gInk=document.createElementNS(NS,'g');
      gInk.setAttribute('data-ink','1');
      svg.append(gInk);

      let drawing=false, last=null;
      function pt(evt){
        const r=svg.getBoundingClientRect();
        const x=(evt.clientX-r.left)/r.width*200;
        const y=(evt.clientY-r.top)/r.height*200;
        return {x,y};
      }
      function addStroke(p0,p1){
        const path=document.createElementNS(NS,'path');
        path.setAttribute('fill','none');
        path.setAttribute('stroke','#0d223a');
        path.setAttribute('stroke-width','3.5');
        path.setAttribute('stroke-linecap','round');
        path.setAttribute('stroke-linejoin','round');
        path.setAttribute('d',`M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
        gInk.appendChild(path);
        try{
          if(state.batchStepId){
            const i = parseInt(String(idx||0),10);
            if(!state.batchDone.has(i)){
              state.batchDone.add(i);
              saveBatchDone(state.batchStepId, state.batchDone);
              syncUI();
            }
          }
        }catch(_e){}
      }
      svg.addEventListener('pointerdown',(e)=>{ drawing=true; last=pt(e); svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove',(e)=>{ if(!drawing||!last) return; const p=pt(e); addStroke(last,p); last=p; });
      function end(e){ drawing=false; last=null; try{ svg.releasePointerCapture(e.pointerId);}catch(_e){} }
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);

      const wrap=document.createElement('div');
      wrap.className='traceCell';
      wrap.appendChild(svg);
      return wrap;
    }

    function buildGrid(L){
      const cur = cfg.getCurrentStep();
      const sid = (cur && cur.step && cur.step.id) ? String(cur.step.id||'') : '';
      const isBatch = cfg.batchStepIds.includes(sid);
      const letters = cfg.getLetters();

      if(isBatch){
        const rows = cfg.batchRows;
        const cols = cfg.batchCols;
        try{
          if(state.rowsSel){ state.rowsSel.value = String(rows); state.rowsSel.disabled = true; }
          if(state.colsSel){ state.colsSel.value = String(cols); state.colsSel.disabled = true; }
        }catch(_e){}

        const keys = getTraceTargetKeys();
        const items = keys.map(k => letters.find(x=>x.key===k)).filter(Boolean);

        if(state.gridEl){
          state.gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
          state.gridEl.innerHTML='';
          for(let i=0;i<rows*cols;i++){
            const Li = items[i] || { ar:'', name:'', key:'__empty_'+i };
            state.gridEl.appendChild(makeTile(Li,i));
          }
        }
        return;
      }

      const s = loadSettings();
      const rows = parseInt((state.rowsSel && state.rowsSel.value) || s.rows || cfg.defaultSettings.rows,10);
      const cols = parseInt((state.colsSel && state.colsSel.value) || s.cols || cfg.defaultSettings.cols,10);
      saveSettings(rows, cols);
      if(state.gridEl){
        state.gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
        state.gridEl.innerHTML='';
        for(let i=0;i<rows*cols;i++) state.gridEl.appendChild(makeTile(L,i));
      }
    }

    async function maybeComplete(){
      try{
        const cur = cfg.getCurrentStep();
        const step = cur ? cur.step : null;
        if(!(step && cfg.batchStepIds.includes(step.id))) return;
        const targets = getTraceTargetKeys();
        if(targets.length && state.done.size >= targets.length){
          await cfg.onStepCompleted(step.id);
          state.done = new Set();
          syncUI();
          await cfg.onUiRefresh();
        }
      }catch(e){ console.warn('['+cfg.unitKey+' Write] complete failed', e); }
    }

    function ensureOverlay(){
      try{
        if(document.getElementById('traceOverlay')) return;
        const stId = cfg.unitKey + 'WriteStyles';
        if(!document.getElementById(stId)){
          const st = document.createElement('style');
          st.id = stId;
          st.textContent = `
#traceOverlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999;}
#traceOverlay .panel{width:min(1100px,92vw);height:min(760px,88vh);background:#fff;border-radius:18px;box-shadow:0 18px 70px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;}
#traceOverlay .topbar{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #eee;}
#traceCloseX{border:0;background:#f3f4f6;border-radius:12px;padding:10px 14px;font-size:18px;cursor:pointer;}
#btnResetDraw,#btnPrintDraw{border:0;background:#f3f4f6;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer;}
#letterBadge{margin-left:auto;font-weight:800;}
#traceGrid{flex:1;overflow:auto;padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:#fafafa;}
#traceGrid .traceTile{background:#fff;border:1px solid #eee;border-radius:14px;overflow:hidden;}
#traceGrid svg{width:100%;height:100%;display:block;touch-action:none;}
#traceOverlay .settings{display:flex;gap:8px;align-items:center;margin-left:10px;}
#traceOverlay select{padding:6px 8px;border-radius:10px;border:1px solid #ddd;}
@media print{body>*{display:none !important;} #tracePrintRoot{display:block !important;}}
          `;
          document.head.appendChild(st);
        }

        const ov = document.createElement('div');
        ov.id='traceOverlay';
        ov.innerHTML = `
          <div class="panel" role="dialog" aria-modal="true">
            <div class="topbar">
              <button id="traceCloseX" title="Close">✕</button>
              <button id="btnResetDraw" title="Reset">Reset ↺</button>
              <button id="btnPrintDraw" title="Print">Print 🖨</button>
              <div class="settings">
                <label style="font-size:12px;color:#666;">Rows</label>
                <select id="traceRows">
                  <option>3</option><option>4</option><option>5</option><option selected>6</option><option>7</option><option>8</option>
                </select>
                <label style="font-size:12px;color:#666;">Cols</label>
                <select id="traceCols">
                  <option>1</option><option>2</option><option selected>3</option><option>4</option>
                </select>
              </div>
              <div id="letterBadge">${cfg.displayLabel}</div>
            </div>
            <div id="traceGrid"></div>
          </div>
        `;
        document.body.appendChild(ov);
      }catch(e){ console.warn('['+cfg.unitKey+' Write] ensure overlay failed', e); }
    }

    function open(L){
      try{
        if(!state.overlay || !state.gridEl) return;

        const cur = cfg.getCurrentStep();
        const sid = (cur && cur.step && cur.step.id) ? String(cur.step.id||'') : '';
        const isBatch = cfg.batchStepIds.includes(sid);

        state.batchStepId = isBatch ? sid : null;
        state.batchDone = state.batchStepId ? loadBatchDone(state.batchStepId) : new Set();

        state.activeKey = isBatch ? sid : (L && L.key) ? L.key : null;
        state.justOpened = true;

        if(state.badge){
          const suffix = isBatch ? sid.replace(/^trace/i,'write') : ((L && L.name) ? L.name : '');
          state.badge.textContent = isBatch ? `${cfg.displayLabel}: ${suffix}` : `${cfg.displayLabel}: ${suffix}`;
        }

        buildGrid(isBatch ? null : L);
        state.overlay.style.display='flex';
        syncUI();
      }catch(e){ console.warn('['+cfg.unitKey+' Write] open failed', e); }
    }

    function close(){
      try{
        if(state.overlay) state.overlay.style.display='none';

        if(state.batchStepId){
          const stepId = state.batchStepId;
          state.activeKey = null;
          state.justOpened = false;

          (async ()=>{
            try{
              const runtimeResult = await cfg.onStepCompleted(stepId);
              if (cfg.onApplyRuntimeCompletion) {
                cfg.onApplyRuntimeCompletion(stepId, runtimeResult);
              }
              await cfg.onUiRefresh();
              syncUI();
            }catch(_e){}
          })();
          return;
        }

        if(state.activeKey){
          state.done.add(state.activeKey);
          state.activeKey = null;
          state.justOpened = false;
          syncUI();
          maybeComplete();
        }
      }catch(e){ console.warn('['+cfg.unitKey+' Write] close failed', e); }
    }

    function bind(){
      ensureOverlay();
      state.button = document.getElementById(cfg.buttonId);
      state.overlay = document.getElementById('traceOverlay');
      state.gridEl = document.getElementById('traceGrid');
      state.closeBtn = document.getElementById('traceCloseX');
      state.resetBtn = document.getElementById('btnResetDraw');
      state.printBtn = document.getElementById('btnPrintDraw');
      state.badge = document.getElementById('letterBadge');
      state.rowsSel = document.getElementById('traceRows');
      state.colsSel = document.getElementById('traceCols');

      const s = loadSettings();
      if(state.rowsSel) state.rowsSel.value = String(s.rows);
      if(state.colsSel) state.colsSel.value = String(s.cols);

      if(state.button){
        state.button.addEventListener('click', ()=>{ try{ open(null); }catch(_e){} });
      }
      if(state.closeBtn) state.closeBtn.addEventListener('click', close);
      if(state.overlay){
        state.overlay.addEventListener('click', (e)=>{ if(e.target===state.overlay) close(); });
      }
      if(state.resetBtn){
        state.resetBtn.addEventListener('click', ()=>{
          try{ state.gridEl && state.gridEl.querySelectorAll('[data-ink] path').forEach(p=>p.remove()); }catch(_e){}
        });
      }
      if(state.rowsSel) state.rowsSel.addEventListener('change', ()=>{ const k=getSelectedKey(); const L=cfg.getLetters().find(x=>x.key===k); if(L) buildGrid(L); });
      if(state.colsSel) state.colsSel.addEventListener('change', ()=>{ const k=getSelectedKey(); const L=cfg.getLetters().find(x=>x.key===k); if(L) buildGrid(L); });

      if(state.printBtn){
        state.printBtn.addEventListener('click', ()=>{
          try{
            const title = (state.badge && state.badge.textContent) ? state.badge.textContent : cfg.displayLabel;
            let frame = document.getElementById('adTracePrintFrame');
            if(!frame){
              frame = document.createElement('iframe');
              frame.id = 'adTracePrintFrame';
              frame.style.position = 'fixed';
              frame.style.right = '0';
              frame.style.bottom = '0';
              frame.style.width = '0';
              frame.style.height = '0';
              frame.style.border = '0';
              frame.style.opacity = '0';
              frame.setAttribute('aria-hidden','true');
              document.body.appendChild(frame);
            }
            const doc = frame.contentWindow.document;
            const css = `
              <style>
                body{font-family:system-ui,Segoe UI,Arial;margin:16px;}
                h2{margin:0 0 12px 0;}
                #traceGrid{display:grid;gap:12px;}
                .traceCell svg{width:100%;height:auto}
              </style>`;
            doc.open();
            doc.write(`<html><head><title>${title}</title>${css}</head><body><h2>${title}</h2>${state.gridEl.outerHTML}</body></html>`);
            doc.close();
            setTimeout(()=>{
              try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(_e){}
            }, 150);
          }catch(e){ console.warn('[Write] print failed', e); }
        });
      }

      try{ document.body.classList.add('has-trace'); }catch(_e){}
      syncUI();
    }

    return {
      state,
      loadBatchDone,
      saveBatchDone,
      getSelectedKey,
      getTraceTargetKeys,
      syncUI,
      loadSettings,
      saveSettings,
      open,
      close,
      buildGrid,
      makeTile,
      maybeComplete,
      ensureOverlay,
      bind
    };
  }

  window.PQSharedWrite = { create };
})();
