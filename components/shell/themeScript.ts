import { PREFERENCE_KEYS } from '@/lib/events'

const theme = JSON.stringify(PREFERENCE_KEYS.theme)
const intro = JSON.stringify(PREFERENCE_KEYS.introSeen)

export const themeScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');try{var t=localStorage.getItem(${theme});if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.setAttribute('data-theme',t)}catch(e){d.setAttribute('data-theme','dark')}try{d.setAttribute('data-intro',sessionStorage.getItem(${intro})==='1'?'seen':'pending')}catch(e){d.setAttribute('data-intro','seen')}window.addEventListener('cw:theme-change',function(e){var v=e&&e.detail;if(v!=='light'&&v!=='dark')return;d.setAttribute('data-theme',v);try{localStorage.setItem(${theme},v)}catch(_){}})})();`
