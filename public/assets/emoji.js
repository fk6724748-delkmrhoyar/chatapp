(function(){
  var EMOJIS = ('😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 🥰 😗 🙂 🤗 🤩 🤔 🤨 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 🥱 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 🤯 😬 😰 😱 🥵 🥶 😳 🤪 😵 😡 😠 🤬 😷 🤒 🤕 🤢 🤮 🥴 😇 🤠 🥳 🥺 🤥 🤫 🤭 🧐 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 🙏 👍 👎 👌 ✌️ 🤞 🤝 👏 🙌 👋 🤚 ✋ 💪 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💖 💗 💘 💝 💞 🔥 ✨ ⭐ 🌟 💯 🎉 🎊 🎁 🌹 🌸 🌺 🌻 🍀 ☀️ 🌙 ☁️ ⚡ ❄️ 🍕 🍔 🍟 🍩 🍰 🎂 ☕ 🍺 🥂 ⚽ 🏀 🎮 🎵 🎶 📞 📷 ✅ ❌ ⚠️').split(' ');
  function attach(form){
    if(form.dataset.emojiReady) return; form.dataset.emojiReady='1';
    var input = form.querySelector('textarea[name=body], input[type=text][name=body]');
    if(!input) return;
    var btn = document.createElement('button');
    btn.type='button';
    btn.className='icon-btn emoji-btn';
    btn.setAttribute('aria-label','Emoji');
    btn.textContent='😊';
    btn.style.cssText='background:none;border:0;cursor:pointer;font-size:22px;padding:4px;align-self:flex-end;line-height:1';
    var panel = document.createElement('div');
    panel.className='emoji-panel';
    panel.style.cssText='display:none;position:absolute;bottom:56px;left:8px;right:8px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px;max-height:200px;overflow:auto;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.15);font-size:22px;line-height:1.6';
    EMOJIS.forEach(function(em){
      var s=document.createElement('span'); s.textContent=em;
      s.style.cssText='display:inline-block;padding:2px 4px;cursor:pointer';
      s.addEventListener('mousedown',function(e){e.preventDefault();
        var p=input.selectionStart!=null?input.selectionStart:input.value.length;
        var end=input.selectionEnd!=null?input.selectionEnd:p;
        input.value = input.value.slice(0,p)+em+input.value.slice(end);
        input.focus();
        try{input.selectionStart=input.selectionEnd=p+em.length;}catch(e){}
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      panel.appendChild(s);
    });
    btn.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      panel.style.display = (panel.style.display==='none'||!panel.style.display)?'block':'none';
    });
    input.parentNode.insertBefore(btn, input);
    if(getComputedStyle(form).position==='static') form.style.position='relative';
    form.appendChild(panel);
    document.addEventListener('click',function(ev){
      if(ev.target===btn) return;
      if(!panel.contains(ev.target)) panel.style.display='none';
    });
  }
  function init(){ document.querySelectorAll('form.compose').forEach(attach); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
