"use strict";(self.webpackChunk_ircam_sc_components_doc=self.webpackChunk_ircam_sc_components_doc||[]).push([[6],{2006:(t,e,c)=>{function n(t,e,c,n,o=1/0){const s={},a=new Float32Array(c),r=c/e;Math.PI;let u=t/e,l=0,i=null,_=0,f=0;return s.frequency=t=>{u=t/e},s.start=()=>{!function t(){for(let t=0;t<c;t++){const e=Math.sin(2*l*Math.PI);a[t]=e,l=(l+u)%1}n(_,a),_+=r,f+=1,f<o&&(i=setTimeout(t,1e3*r))}()},s.stop=()=>{clearTimeout(i)},s}c.r(e),c.d(e,{default:()=>n})}}]);