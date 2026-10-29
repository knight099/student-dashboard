(() => {
  const panel=document.getElementById('chat-panel');
  const launch=document.getElementById('chat-launch');
  const input=document.getElementById('chat-input');
  const messages=document.getElementById('chat-messages');
  const status=document.getElementById('chat-status');
  const send=document.getElementById('chat-send');
  const clear=document.getElementById('chat-clear');
  const history=[];
  let controller=null;
  const filters=()=>window.dashboardFilters();
  const scope=f=>`${f.cohort==='ALL'?'All cohorts':f.cohort} · ${f.mode==='ALL'?'All modes':f.mode}`;
  function updateScope(){document.getElementById('chat-context').textContent=`Using dashboard filters: ${scope(filters())}`;}
  const mobile=window.matchMedia('(max-width:600px)');
  function syncViewport(){
    const viewport=window.visualViewport;
    if(!viewport)return;
    for(const [name,value] of Object.entries({height:viewport.height,width:viewport.width,top:viewport.offsetTop,left:viewport.offsetLeft})){
      panel.style.setProperty(`--chat-viewport-${name}`,`${value}px`);
    }
  }
  function focusInput(){if(!panel.hidden && !mobile.matches)input.focus({preventScroll:true});}
  function show(open){
    panel.hidden=!open;document.documentElement.classList.toggle('chat-open',open);
    launch.setAttribute('aria-expanded',String(open));
    if(open){updateScope();syncViewport();if(mobile.matches)document.getElementById('chat-close').focus({preventScroll:true});else focusInput();}
    else{input.blur();launch.focus({preventScroll:true});}
  }
  window.visualViewport?.addEventListener('resize',syncViewport);
  window.visualViewport?.addEventListener('scroll',syncViewport);
  window.addEventListener('resize',syncViewport);
  function bubble(role,text,context){
    const item=document.createElement('div');item.className=`chat-message ${role}`;
    const label=document.createElement('strong');label.textContent=role==='user'?'You':`Dashboard assistant${context?` · ${scope(context)}`:''}`;
    const content=document.createElement('span');content.textContent=text;
    item.append(label,content);messages.append(item);messages.scrollTop=messages.scrollHeight;return item;
  }
  function welcome(){
    messages.replaceChildren();
    const item=bubble('assistant','Ask about attendance trends, compare cohorts, or find students who may need support. I use the selected dashboard filters and the sample dataset.');
    const suggestions=document.createElement('div');suggestions.className='chat-suggestions';
    for(const text of ['Summarize attendance','Which cohort needs support?','Who should I follow up with?']){
      const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=()=>{input.value=text;submit();};suggestions.append(button);
    }
    item.append(suggestions);
  }
  function busy(value){send.textContent=value?'Stop':'Send';clear.disabled=value;input.readOnly=value;messages.setAttribute('aria-busy',String(value));}
  async function submit(){
    if(controller){controller.abort();return;}
    const text=input.value.trim();if(!text)return;
    const currentFilters=filters();
    history.push({role:'user',content:text});
    const userBubble=bubble('user',text,currentFilters);
    input.value='';status.className='chat-status';status.textContent='Thinking about your dashboard…';
    controller=new AbortController();busy(true);
    try{
      // Keep complete turns and room for the current user message.
      const recent=history.slice(-15);
      while(recent.length>1 && JSON.stringify(recent).length>24000)recent.splice(0,2);
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:recent,filters:currentFilters}),signal:controller.signal});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Unable to send your message. Please try again.');
      history.push({role:'assistant',content:result.reply});bubble('assistant',result.reply,currentFilters);status.textContent='';
    }catch(error){
      history.pop();userBubble.remove();input.value=text;
      status.className='chat-status error';status.textContent=error.name==='AbortError'?'Stopped. Your question is ready to send again.':error.message;
    }finally{controller=null;busy(false);focusInput();}
  }
  launch.onclick=()=>show(panel.hidden);
  document.getElementById('chat-close').onclick=()=>show(false);
  clear.onclick=()=>{history.length=0;welcome();status.textContent='';input.value='';focusInput();};
  document.getElementById('chat-form').onsubmit=event=>{event.preventDefault();submit();};
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)show(false);});
  document.addEventListener('dashboard:filters',updateScope);
  welcome();updateScope();
})();
