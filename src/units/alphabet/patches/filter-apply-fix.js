(function PQSettingsFilterApplyFix(){
  'use strict';
  function getCfg(){ return window.UNIT_CFG || window.PQ_UNIT_CFG || window.__UNIT_CFG || window.unitCfg || window.cfg || null; }
  function getFilterSets(cfg){ return cfg ? (cfg.filterSets || (cfg.ui && cfg.ui.filterSets) || (cfg.filters && cfg.filters.sets) || null) : null; }
  function getCells(cfg){
    if (!cfg) return [];
    if (cfg.canvas && Array.isArray(cfg.canvas.cells)) return cfg.canvas.cells;
    if (Array.isArray(cfg.cells)) return cfg.cells;
    if (Array.isArray(cfg.allCells)) return cfg.allCells;
    return [];
  }
  function tileKey(tile, index, cells){
    if (!tile) return '';
    return tile.dataset.key || tile.dataset.cellKey || tile.dataset.itemKey || tile.dataset.id ||
      tile.getAttribute('data-key') || tile.getAttribute('data-cell-key') || tile.getAttribute('data-item-key') ||
      (cells[index] && (cells[index].key || cells[index].id || cells[index].cellKey)) || '';
  }
  function remember(tile){ if (tile && !tile.dataset.pqOriginalDisplay) tile.dataset.pqOriginalDisplay = tile.style.display || '__EMPTY__'; }
  function show(tile){ if (!tile) return; var d=tile.dataset.pqOriginalDisplay; tile.style.display=(!d||d==='__EMPTY__')?'':d; tile.hidden=false; tile.removeAttribute('aria-hidden'); }
  function hide(tile){ if (!tile) return; remember(tile); tile.style.display='none'; tile.hidden=true; tile.setAttribute('aria-hidden','true'); }
  function applyFilter(){
    try{
      var select=document.getElementById('uiFilter'); var grid=document.getElementById('grid'); var cfg=getCfg();
      if(!select||!grid||!cfg) return false;
      var value=select.value||'all'; var sets=getFilterSets(cfg)||{}; var cells=getCells(cfg); var tiles=Array.from(grid.querySelectorAll('.tile'));
      if(!tiles.length) return false;
      try{cfg.currentFilter=value;}catch(_e){} try{cfg.activeFilter=value;}catch(_e){} try{if(cfg.ui) cfg.ui.filter=value;}catch(_e){} window.__pqCurrentFilter=value;
      if(value==='all'||!sets[value]){ tiles.forEach(show); return true; }
      var allowed=new Set((sets[value]||[]).map(String));
      tiles.forEach(function(tile,i){ allowed.has(String(tileKey(tile,i,cells)||'')) ? show(tile) : hide(tile); });
      return true;
    }catch(_e){ return false; }
  }
  function bind(){
    var select=document.getElementById('uiFilter'); if(!select||select.dataset.pqFilterApplyBound==='1') return false;
    select.dataset.pqFilterApplyBound='1';
    select.addEventListener('change', function(){ setTimeout(applyFilter,0); setTimeout(applyFilter,80); setTimeout(applyFilter,250); });
    select.addEventListener('input', function(){ setTimeout(applyFilter,0); });
    return true;
  }
  function boot(){
    bind(); applyFilter();
    var tries=0; var timer=setInterval(function(){ tries++; bind(); applyFilter(); if(tries>=80) clearInterval(timer); },100);
    try{ var grid=document.getElementById('grid'); if(grid) new MutationObserver(function(){setTimeout(applyFilter,0);setTimeout(applyFilter,80);}).observe(grid,{childList:true,subtree:false}); }catch(_e){}
    try{ window.addEventListener('load', function(){ bind(); setTimeout(applyFilter,250); setTimeout(applyFilter,1000); }); }catch(_e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
