"use strict";(self.webpackChunk_ircam_sc_components_doc=self.webpackChunk_ircam_sc_components_doc||[]).push([[774,670],{4774:(e,n,t)=>{t.r(n),t.d(n,{enter:()=>a,exit:()=>c,template:()=>d});var o=t(182),i=(t(4670),t(5913));window.audioContext=window.audioContext||null,window.Scheduler=i.b;const a=()=>{},c=()=>{},d=o.dy`
<h2>Scheduler - simple demo</h2>

<div class="demo">
  <div class="interface">
    <sc-button
      @input=${async()=>document.querySelector("sc-editor").save()}
    >Run the demo</sc-button>
    <sc-text>mute</sc-text><sc-toggle
      @change=${async e=>{e.detail.value?await window.audioContext.suspend():await window.audioContext.resume()}}
    ></sc-toggle>
  </div>
  <sc-editor
    save-button
    style="width: 900px; height: 700px;"
    value=${'/**\n * This interactive example code assumes two things:\n * - you have a resumed AudioContext instance at hand\n * - the Scheduler instance **must** be named "scheduler"\n *\n * You can edit the code and hear/see the result by pressing "Cmd+S"\n */\n\n// instantiate scheduler with the audio context timeline\nconst getTime = () => audioContext.currentTime;\nconst scheduler = new Scheduler(getTime);\n\n// simple metronome\nconst BPM = 120;\nconst metro = currentTime => {\n  // create the audio graph for this tick\n  const envelop = audioContext.createGain();\n  envelop.connect(audioContext.destination);\n  envelop.gain.value = 0;\n  envelop.gain.setValueAtTime(0, currentTime);\n  envelop.gain.linearRampToValueAtTime(0.8, currentTime + 0.002);\n  envelop.gain.linearRampToValueAtTime(0, currentTime + 0.01);\n\n  const sine = audioContext.createOscillator();\n  sine.connect(envelop);\n  sine.frequency.setValueAtTime(600, currentTime);\n  sine.start(currentTime);\n  sine.stop(currentTime + 0.01);\n\n  // define a period in seconds according to BPM and compute next time\n  const period = 60 / BPM;\n  const nextTime = currentTime + period;\n  // return the next time at which the metronome should play\n  return nextTime;\n}\n\n// add the metronome to the scheduler, starting now\nconst now = getTime();\nscheduler.add(metro, now);\n'}
    @change=${e=>async function(e){window.audioContext&&await window.audioContext.close(),window.audioContext=new AudioContext,await window.audioContext.resume(),window.module&&await window.module.exit();const n=new File([e+="\nexport function exit() {\n  scheduler.clear();\n}\n"],`module-${parseInt(1e9*Math.random())}.js`,{type:"text/javascript"}),t=URL.createObjectURL(n);window.module=await import(t)}(e.detail.value)}
  ></sc-editor>

</div>
`},4670:(e,n,t)=>{t.r(n),t.d(n,{default:()=>i});const o=document.createElement("style");function i(e){o.innerText=e}o.type="text/css",document.head.appendChild(o)}}]);