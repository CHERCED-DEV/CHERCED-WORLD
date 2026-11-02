import { PREFERENCE_KEYS } from '@/lib/events'

export const INTRO_MAX_MS = 1500

export const INTRO_SKIP_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

const key = JSON.stringify(PREFERENCE_KEYS.introSeen)
const events = JSON.stringify(INTRO_SKIP_EVENTS)

export const introScript = `(function(){var d=document.documentElement;if(d.getAttribute('data-intro')!=='pending')return;try{sessionStorage.setItem(${key},'1')}catch(e){}var ev=${events},o={capture:true,passive:true},t,i;function done(){clearTimeout(t);for(i=0;i<ev.length;i++)window.removeEventListener(ev[i],done,o);if(d.getAttribute('data-intro')==='pending')d.setAttribute('data-intro','seen')}for(i=0;i<ev.length;i++)window.addEventListener(ev[i],done,o);t=setTimeout(done,${INTRO_MAX_MS})})();`
