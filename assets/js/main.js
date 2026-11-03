(() => {
  'use strict';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Remote editorial photographs have fully local SVG fallbacks.
  qsa('img[data-fallback]').forEach(img=>{
    let switched=false;
    const fallback=()=>{
      if(switched)return;
      switched=true;
      const url=img.dataset.fallback;
      if(url){ img.src=url; img.dataset.photoStatus='fallback'; }
    };
    img.addEventListener('error',fallback,{once:true});
    window.setTimeout(()=>{if(!img.complete||img.naturalWidth===0)fallback();},3500);
  });

  // One navigation model for all six pages.
  const menuButton=qs('#menu-button');
  const mobileNav=qs('#mobile-nav');
  const closeMenu=()=>{
    if(!menuButton||!mobileNav)return;
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label','Открыть меню');
    mobileNav.hidden=true;
  };
  if(menuButton&&mobileNav){
    menuButton.addEventListener('click',()=>{
      const opening=menuButton.getAttribute('aria-expanded')!=='true';
      menuButton.setAttribute('aria-expanded',String(opening));
      menuButton.setAttribute('aria-label',opening?'Закрыть меню':'Открыть меню');
      mobileNav.hidden=!opening;
    });
    qsa('a,button',mobileNav).forEach(item=>item.addEventListener('click',closeMenu));
    window.addEventListener('resize',()=>{if(window.innerWidth>980)closeMenu();});
  }

  // Reveal animation respects reduced motion and works without IntersectionObserver.
  const reveals=qsa('[data-reveal]');
  if(!reduced&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
      });
    },{rootMargin:'0px 0px -50px 0px',threshold:0.08});
    reveals.forEach(el=>observer.observe(el));
  }else reveals.forEach(el=>el.classList.add('is-visible'));

  // Request dialog — local-only draft, no network or fake order submission.
  const dialog=qs('#request-dialog');
  let restoreFocus=null;
  const openDialog=(service,trigger)=>{
    if(!dialog)return;
    closeMenu();
    restoreFocus=trigger||document.activeElement;
    const serviceSelect=qs('select[name="service"]',dialog);
    if(service&&serviceSelect){
      const options=Array.from(serviceSelect.options);
      const matching=options.find(option=>option.textContent.toLocaleLowerCase('ru').includes(service.toLocaleLowerCase('ru')));
      if(matching)serviceSelect.value=matching.value;
    }
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
    const name=qs('input[name="name"]',dialog);
    if(name)name.focus();
  };
  const closeDialog=()=>{
    if(!dialog)return;
    if(dialog.open&&typeof dialog.close==='function')dialog.close();
    else dialog.removeAttribute('open');
    if(restoreFocus&&typeof restoreFocus.focus==='function')restoreFocus.focus();
  };
  qsa('[data-open-modal]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.service||'',button)));
  qsa('[data-close-modal]').forEach(button=>button.addEventListener('click',closeDialog));
  if(dialog){
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
    dialog.addEventListener('close',()=>{if(restoreFocus&&typeof restoreFocus.focus==='function')restoreFocus.focus();});
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  qsa('[data-backtop]').forEach(b=>b.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'})));

  // Service filter; aria-pressed follows current category.
  const filterButtons=qsa('[data-filter]');
  const catalogItems=qsa('.catalog-card[data-category]');
  filterButtons.forEach(button=>button.addEventListener('click',()=>{
    const category=button.dataset.filter;
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    catalogItems.forEach(item=>{item.hidden=category!=='all'&&item.dataset.category!==category;});
  }));

  // Image comparison before/after on the project page.
  const comparison=qs('#comparison');
  const comparisonRange=qs('#comparison-range');
  if(comparison&&comparisonRange){
    const update=()=>comparison.style.setProperty('--compare',comparisonRange.value+'%');
    comparisonRange.addEventListener('input',update);update();
  }

  // Interactive, explicitly satirical water-over-Wi-Fi simulation.
  const simulator=qs('#simulation');
  const connect=qs('#connect-shower');
  const disconnect=qs('#disconnect-shower');
  const simStatus=qs('#simulation-status');
  let simulationTimer;
  const simText=(text)=>{if(simStatus)simStatus.innerHTML=`СОСТОЯНИЕ: <strong>${text}</strong>`;};
  const resetSimulation=()=>{
    window.clearTimeout(simulationTimer);
    if(simulator)simulator.classList.remove('is-on');
    if(connect)connect.disabled=false;
    simText('ОЖИДАНИЕ СИГНАЛА');
  };
  if(connect&&simulator){
    connect.addEventListener('click',()=>{
      window.clearTimeout(simulationTimer);
      connect.disabled=true;
      simulator.classList.add('is-on');
      simText('ПОИСК ВОДЯНОГО ПАКЕТА...');
      simulationTimer=window.setTimeout(()=>{
        simText('404 — ВОДА НЕ НАЙДЕНА. ТЕХНОЛОГИЯ ШУТОЧНАЯ.');
        connect.disabled=false;
      },1350);
    });
  }
  if(disconnect)disconnect.addEventListener('click',resetSimulation);

  // The range modifies only an overlaid visual effect, not plumbing.
  const modeRange=qs('#mode-range');
  const modeOverlay=qs('#mode-overlay');
  const modeTitle=qs('#mode-title');
  if(modeRange&&modeOverlay&&modeTitle){
    const update=()=>{
      const n=Number(modeRange.value);
      modeOverlay.style.setProperty('--steam',(n/160).toFixed(3));
      modeTitle.textContent='Режим: '+(n<25?'Сухой интернет':n<55?'Лёгкий туман':n<80?'Влажный вайб':'Ливень из пакетов');
    };
    modeRange.addEventListener('input',update);update();
  }

  // Deep links preserve selected fictional service without using a backend.
  const preselected=new URLSearchParams(location.search).get('service');
  if(preselected){
    qsa('select[name="service"]').forEach(select=>{
      const option=Array.from(select.options).find(o=>o.value.toLowerCase()===preselected.toLowerCase());
      if(option)select.value=option.value;
    });
  }

  const formatBrief=(form)=>{
    const data=new FormData(form);
    return `УЗЕЛ / ДЕМОНСТРАЦИОННАЯ ЗАЯВКА\nИмя: ${String(data.get('name')||'').trim()}\nКонцепт: ${String(data.get('service')||'')}\nОписание: ${String(data.get('message')||'').trim()||'Не указано'}\n\nЭто сатирическая заявка на несуществующую услугу.`;
  };
  qsa('form.copy-form').forEach(form=>{
    const result=qs('.form-result',form);
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=qs('input[name="name"]',form);
      if(name&&!name.value.trim()){
        name.setCustomValidity('Введите имя или псевдоним');
        name.reportValidity();
        name.focus();
        return;
      }
      if(name)name.setCustomValidity('');
      const brief=formatBrief(form);
      let copied=false;
      try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(brief);copied=true;}}
      catch(error){copied=false;}
      if(result){
        result.hidden=false;
        result.textContent=copied?'Заявка скопирована в буфер обмена. Никуда не отправлена.':'Заявка составлена, но буфер обмена недоступен. Скопируйте текст вручную:\n\n'+brief;
        if(!copied){result.tabIndex=0;result.focus();}
      }
    });
    const name=qs('input[name="name"]',form);
    if(name)name.addEventListener('input',()=>name.setCustomValidity(''));
  });
})();
