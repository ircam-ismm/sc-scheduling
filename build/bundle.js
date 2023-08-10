/*! For license information please see bundle.js.LICENSE.txt */
      ${t.styles}

      :host {
        position: relative;
      }

      .midi-control-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 20;
        color: black;
        overflow: hidden;
        white-space: nowrap;
        user-select: none;
        webkit-user-select: none;
        webkit-touch-callout: none;
        box-sizing: border-box;
      }

      .midi-control-overlay span {
        position: absolute;
        top: 0;
        left: 2px;
        font-size: 9px;
        height: 12px;
        line-height: 12px;
      }

      .midi-control-overlay::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: .4;
        z-index: -1;
        background-color: var(--sc-color-secondary-2);
      }

      .midi-control-overlay.learning::before {
        background-color: var(--sc-color-secondary-3);
      }

      .midi-control-overlay.mapped::before {
        background-color: var(--sc-color-secondary-4);
      }

      .midi-control-overlay.highlight {
        border: 1px solid var(--sc-color-primary-5);
      }
    `;constructor(){super();const t=this.tagName.toLowerCase();if(globalThis[g].add(t),!("midiValue"in this)||!("midiType"in this))throw new Error(`[sc-components] "${e}" must implement "midiType" getter  ("control" or "instrument") AND "midiValue" getter and setter to map from midi value to component value`);this.midiLearnState="idle"}render(){const e=super.render();if(this.midiLearnActive){let t="idle";this.midiControlInfos&&(t="mapped"),this.midiLearnSelected&&(t="learning");const n={"midi-control-overlay":!0,mapped:this.midiControlInfos&&!this.midiLearnSelected,learning:this.midiLearnSelected,highlight:this.midiControlHighlight};return a.dy`
          <div class="${m(n)}">
            ${this.midiControlInfos?a.dy`<span>cc ${this.midiControlInfos.channel} - ${this.midiControlInfos.deviceString}</span>`:a.Ld}
          </div>
          ${e}
        `}return this.midiControlHighlight=!1,e}}return Object.defineProperty(n,"name",{value:e}),n},f=class{constructor(e,t){if(!t.filterCodes)throw new Error("keyboard-controller: filterCodes option is mandatory");if(!t.callback)throw new Error("keyboard-controller: callback option is mandatory");this._host=e,this._filterCodes=t.filterCodes,this._callback=t.callback,this._deduplicateEvents=t.deduplicateEvents||!1,this._debug=t.debug||!1,this._codeLastEventTypeMap=new Map,e.addController(this),this._onFocus=this._onFocus.bind(this),this._onBlur=this._onBlur.bind(this),this._triggerEvent=this._triggerEvent.bind(this)}hostConnected(){this._host.addEventListener("focus",this._onFocus),this._host.addEventListener("blur",this._onBlur)}hostDisconnect(){this._host.removeEventListener("focus",this._onFocus),this._host.removeEventListener("blur",this._onBlur)}_onFocus(){document.addEventListener("keydown",this._triggerEvent),document.addEventListener("keyup",this._triggerEvent)}_onBlur(){document.removeEventListener("keydown",this._triggerEvent),document.removeEventListener("keyup",this._triggerEvent)}_triggerEvent(e){const t=e.code;if(this._debug&&console.log(t),this._filterCodes.includes(t)){if(e.preventDefault(),this._deduplicateEvents&&this._codeLastEventTypeMap.get(e.code)===e.type)return;this._codeLastEventTypeMap.set(e.code,e.type),this._callback(e)}}};class E extends u{static properties={active:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      width: 30px;
      height: 30px;
      vertical-align: top;
      box-sizing: border-box;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
      font-size: 0;
      line-height: 0;
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    circle {
      stroke-width: 8px;
      stroke: var(--sc-color-primary-4);
      fill: var(--sc-color-primary-2);
    }

    circle.active {
      fill: var(--sc-color-primary-5);
      stroke: none;
    }
  `;get midiType(){return"control"}set midiValue(e){this.active=!0,this._dispatchInputEvent()}get midiValue(){return this.active?127:0}constructor(){super(),this.active=!1,this.disabled=!1,this._timeoutId=null,this._triggerEvent=this._triggerEvent.bind(this),this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return this.active&&(clearTimeout(this._timeoutId),this._timeoutId=setTimeout((()=>this.active=!1),50)),a.dy`
      <svg
        viewbox="0 0 100 100"
        @mousedown="${this._triggerEvent}"
        @touchstart="${{handleEvent:this._triggerEvent,passive:!1}}"
      >
        <circle cx="50" cy="50" r="34" ></circle>
        ${this.active?a.YP`<circle class="active" cx="50" cy="50" r="20"></circle>`:a.Ld}
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||"keydown"===e.type&&(this.active=!0,this._dispatchInputEvent())}_triggerEvent(e){e.preventDefault(),this.disabled||(this.focus(),this.active=!0,this._dispatchInputEvent())}_dispatchInputEvent(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:!0}});this.dispatchEvent(e)}}const S=h("ScBang",E);void 0===customElements.get("sc-bang")&&customElements.define("sc-bang",S);class b extends u{static properties={value:{type:String,reflect:!0},midiValue:{type:Number},selected:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0},_pressed:{type:Boolean,state:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: inline-block;
      box-sizing: border-box;
      overflow: hidden;
      width: 200px;
      height: 30px;
      line-height: 0;
      font-size: var(--sc-font-size);
      color: #ffffff;
      border: 1px solid var(--sc-color-primary-3);

      --sc-button-background-color: var(--sc-color-primary-2);
      --sc-button-background-color-hover: var(--sc-color-primary-3);
      --sc-button-background-color-active: var(--sc-color-primary-4);
      --sc-button-background-color-selected: var(--sc-color-secondary-3);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    button {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      font-family: var(--sc-font-family);
      background-color: var(--sc-button-background-color);
      border: none;
      font-size: inherit;
      color: inherit;
      cursor: pointer;
    }

    /* remove default button focus */
    button:focus, button:focus-visible {
      outline: none;
    }

    button:hover {
      background-color: var(--sc-button-background-color-hover);
    }

    button.selected {
      background-color: var(--sc-button-background-color-selected);
    }

    :host([selected]) {
      border: 1px solid var(--sc-button-background-color-selected);
    }

    /* use class because :active does not work in Firefox because of e.preventDefault(); */
    button.active {
      background-color: var(--sc-button-background-color-active);
    }

    /* prevent any layout change when disabled */
    :host([disabled]) button {
      cursor: default;
    }

    :host([disabled]) button:hover {
      background-color: var(--sc-button-background-color);
      cursor: default;
    }

    :host([disabled]) button.selected:hover {
      background-color: var(--sc-button-background-color-selected);
      cursor: default;
    }
  `;get midiType(){return"control"}set midiValue(e){if(this.disabled)return;const t=0===e?"release":"press";this._dispatchEvent(t)}get midiValue(){return this._pressed?127:0}constructor(){super(),this.value=null,this.selected=!1,this.disabled=!1,this._pressed=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){const e={active:this._pressed,selected:this.selected};return a.dy`
      <button
        tabindex="-1"
        class="${m(e)}"
        @mousedown="${this._onEvent}"
        @mouseup="${this._onEvent}"
        @touchstart="${{handleEvent:this._onEvent.bind(this),passive:!1}}"
        @touchend="${this._onEvent}"
      >
        <slot>${this.value}</slot>
      </button>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){if(this.disabled)return;const t="keydown"===e.type?"press":"release";this._dispatchEvent(t)}_onEvent(e){if(e.preventDefault(),this.disabled)return;this.focus();const t="touchend"===e.type||"mouseup"===e.type?"release":"press";this._dispatchEvent(t)}_dispatchEvent(e){if("release"===e&&!1===this._pressed)return;const t=null===this.value?this.textContent:this.value;this._pressed="press"===e;const n=new CustomEvent(e,{bubbles:!0,composed:!0,detail:{value:t}});if(this.dispatchEvent(n),"press"===e){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:t}});this.dispatchEvent(e)}}}const v=h("ScButton",b);function T(e,t,n){for(e+="";e.length<n;)e=t+e;return e}void 0===customElements.get("sc-button")&&customElements.define("sc-button",v);class C extends u{static properties={getTimeFunction:{type:Function,attribute:!1},twinkle:{type:Boolean,reflect:!0},format:{type:String,reflect:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: inline-block;
      box-sizing: border-box;
      width: 200px;
      height: 30px;
      vertical-align: top;
      border-radius: 2px;
      font-size: var(--sc-font-size);
      font-family: var(--sc-font-family);
      background-color: var(--sc-color-primary-4);
      color: white;
      text-align: center;
    }

    div {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      display: flex;
      text-align: center;
      justify-content: center;
      align-items: center;
    }

    .idle {
      opacity: 0.3;
    }

    .hidden {
      visibility: hidden;
    }
  `;get format(){return this._format}set format(e){this._showHours=!!/hh/.test(e),this._showMinutes=!!/mm/.test(e),this._showSeconds=!!/ss/.test(e),this._showMilliseconds=!!/ms/.test(e),this._format=e}constructor(){super(),this._currentTime={hours:null,minutes:null,seconds:null,millesconds:null},this._format=null,this._showHours=!1,this._showMinutes=!1,this._showSeconds=!1,this._showMilliseconds=!1;const e=60*(new Date).getTimezoneOffset();this.getTimeFunction=()=>Date.now()/1e3-e,this.twinkle=!1,this.format="hh:mm:ss:ms"}render(){const{time:e,twinkle:t,sign:n,hours:i,minutes:r,seconds:o,milliseconds:s}=this._currentTime,l=0===e;let c=[];return this._showHours&&c.push(a.dy`<span>${i}</span>`),this._showMinutes&&c.push(a.dy`<span>${r}</span>`),this._showSeconds&&c.push(a.dy`<span>${o}</span>`),this._showMilliseconds&&c.push(a.dy`<span>${s}</span>`),c=c.flatMap((e=>[e,a.dy`<span class="${t?"hidden":""}">:</span>`])).slice(0,-1),a.dy`
      <div class="${l?"idle":""}">
        ${n?a.dy`<span>${n}</span>`:a.Ld}
        ${c}
      </div>
    `}_getFormattedInfos(){const e=this.getTimeFunction();let t,n;e>=0?(t="",n=Math.abs(Math.floor(e))):(t="-",n=Math.abs(Math.ceil(e)));const i=Math.floor(n/3600),r=Math.floor((n-3600*i)/60),a=n-3600*i-60*r,o=Math.abs(e)-n,s=Math.floor(1e3*o);return{time:e,sign:t,hours:T(i%24,"0",2),minutes:T(r,"0",2),seconds:T(a,"0",2),milliseconds:T(s,"0",3)}}_render(){const e=this._getFormattedInfos();let t=!1;this._currentTime.sign!==e.sign&&(t=!0),this._showHours&&this._currentTime.hours!==e.hours&&(t=!0),this._showMinutes&&this._currentTime.minutes!==e.minutes&&(t=!0),this._showSeconds&&this._currentTime.seconds!==e.seconds&&(t=!0),this._showMilliseconds&&this._currentTime.milliseconds!==e.milliseconds&&(t=!0),e.twinkle=!1;const n=parseInt(e.milliseconds)/1e3;this.twinkle&&n>=.5&&n<1&&(e.twinkle=!0),this._currentTime.twinkle!==e.twinkle&&(t=!0),t&&(this._currentTime=e,this.requestUpdate()),this._rafId=requestAnimationFrame((()=>this._render()))}connectedCallback(){super.connectedCallback(),this._render()}disconnectedCallback(){cancelAnimationFrame(this._timeoutInterval),super.disconnectedCallback()}}void 0===customElements.get("sc-clock")&&customElements.define("sc-clock",C);class y extends p{constructor(e){if(super(e),this.et=i.Ld,2!==e.type)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===i.Ld||null==e)return this.ft=void 0,this.et=e;if(e===i.Jb)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.et)return this.ft;this.et=e;const t=[e];return t.raw=t,this.ft={_$litType$:this.constructor.resultType,strings:t,values:[]}}}y.directiveName="unsafeHTML",y.resultType=1;const N=_(y),R=n(6057);class O extends u{static properties={language:{type:String,reflect:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: block;
      box-sizing: border-box;
      vertical-align: top;
      font-size: 0;
      font-size: var(--sc-font-size);
      font-family: var(--sc-font-family);
      border-radius: 2px;
      background-color: #23241f;
    }

    pre, code {
      border-radius: inherit;
    }

    /* highlight.js monokai theme */
    pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{background:#23241f;color:#f8f8f2}.hljs-subst,.hljs-tag{color:#f8f8f2}.hljs-emphasis,.hljs-strong{color:#a8a8a2}.hljs-bullet,.hljs-link,.hljs-literal,.hljs-number,.hljs-quote,.hljs-regexp{color:#ae81ff}.hljs-code,.hljs-section,.hljs-selector-class,.hljs-title{color:#a6e22e}.hljs-strong{font-weight:700}.hljs-emphasis{font-style:italic}.hljs-attr,.hljs-keyword,.hljs-name,.hljs-selector-tag{color:#f92672}.hljs-attribute,.hljs-symbol{color:#66d9ef}.hljs-class .hljs-title,.hljs-params,.hljs-title.class_{color:#f8f8f2}.hljs-addition,.hljs-built_in,.hljs-selector-attr,.hljs-selector-id,.hljs-selector-pseudo,.hljs-string,.hljs-template-variable,.hljs-type,.hljs-variable{color:#e6db74}.hljs-comment,.hljs-deletion,.hljs-meta{color:#75715e}
  `;constructor(){super(),this.language="javascript"}render(){let e="";try{e=R.highlight(this.textContent.trim(),{language:this.language}).value}catch(t){e=t.message}return a.dy`
      <pre><code class="hljs ${this.language?`language-${this.language}`:""}">${N(e)}</pre></code>
    `}}function A(e,t){const n=(t[1]-t[0])/(e[1]-e[0]),i=t[0]-n*e[0];function r(e){return n*e+i}return r.invert=function(e){return(e-i)/n},r}void 0===customElements.get("sc-code-example")&&customElements.define("sc-code-example",O);const I=globalThis.performance&&globalThis.performance.now,x=I?performance.now():Date.now();function D(){return I?.001*(performance.now()-x):.001*(Date.now()-x)}globalThis.crossOriginIsolated||console.warn("[@ircam/sc-gettime] Your page is not Cross Origin Isolated. The accuracy of the clock may be reduced by the User-Agent to prevent finger-printing\n(see: https://web.dev/coop-coep/ for more informations)");class w extends u{static styles=a.iv`
    :host {
      display: inline-block;
      width: 100%;
      height: 100%;
    }

    div {
      width: 100%;
      height: 100%;
    }
  `;constructor(){super(),this._pointerId=null,this._lastPointer=null,this._lastTime=null,this._mouseMove=this._mouseMove.bind(this),this._mouseUp=this._mouseUp.bind(this),this._touchStart=this._touchStart.bind(this),this._touchMove=this._touchMove.bind(this),this._touchEnd=this._touchEnd.bind(this),this._propagateValues=this._propagateValues.bind(this),this._rafId=null}render(){return a.dy`
      <div
        @mousedown="${this._mouseDown}"
        @touchstart="${{handleEvent:this._touchStart,passive:!1}}"
      ></div>
    `}_mouseDown(e){window.addEventListener("mousemove",this._mouseMove),window.addEventListener("mouseup",this._mouseUp),this._requestUserSelectNoneOnBody(),this._pointerId="mouse",this._lastTime=D(),this._lastPointer=e}_mouseMove(e){this._requestPropagateValues(e)}_mouseUp(e){window.removeEventListener("mousemove",this._mouseMove),window.removeEventListener("mouseup",this._mouseUp),this._cancelUserSelectNoneOnBody(),this._requestPropagateValues(e),setTimeout((()=>{this._pointerId=null,this._requestPropagateValues(e)}),20)}_touchStart(e){if(e.preventDefault(),null===this._pointerId){const t=e.changedTouches[0];this._pointerId=t.identifier,window.addEventListener("touchmove",this._touchMove,{passive:!1}),window.addEventListener("touchend",this._touchEnd),window.addEventListener("touchcancel",this._touchEnd),this._requestUserSelectNoneOnBody(),this._lastTime=D(),this._lastPointer=t}}_touchMove(e){e.preventDefault();for(let t of e.changedTouches)t.identifier===this._pointerId&&this._requestPropagateValues(t)}_touchEnd(e){for(let t of e.changedTouches)t.identifier===this._pointerId&&(window.removeEventListener("touchmove",this._touchMove),window.removeEventListener("touchend",this._touchEnd),window.removeEventListener("touchcancel",this._touchEnd),this._cancelUserSelectNoneOnBody(),this._requestPropagateValues(t),setTimeout((()=>{this._pointerId=null,this._requestPropagateValues(t)}),20))}_requestPropagateValues(e){window.cancelAnimationFrame(this._rafId),this._rafId=window.requestAnimationFrame((()=>this._propagateValues(e)))}_propagateValues(e){const t=this._lastPointer.screenX,n=this._lastPointer.screenY,i=e.screenX,r=e.screenY,a=D(),o=1e3*(this._lastTime-a),s=(i-t)/o,l=(r-n)/o;this._lastTime=a,this._lastPointer=e;const c=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{dx:s,dy:l,pointerId:this._pointerId}});this.dispatchEvent(c)}}function M(e,t,n,i){const r=(i-90)*Math.PI/180;return{x:e+n*Math.cos(r),y:t+n*Math.sin(r)}}function L(e,t,n,i,r){const a=M(e,t,n,r),o=M(e,t,n,i),s=r-i<=180?"0":"1";return["M",a.x,a.y,"A",n,n,0,s,0,o.x,o.y].join(" ")}void 0===customElements.get("sc-speed-surface")&&customElements.define("sc-speed-surface",w);class k extends u{static properties={min:{type:Number,reflect:!0},max:{type:Number,reflect:!0},value:{type:Number},unit:{type:String,reflect:!0},hideValue:{type:Boolean,reflect:!0,attribute:"hide-value"},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      position: relative;
      width: 50px;
      height: 50px;
      vertical-align: top;
      box-sizing: border-box;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
      font-size: 0;
      line-height: 0;

      --sc-dial-color: var(--sc-color-secondary-1);
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host([hidden]) {
      display: none
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    path.bg {
      stroke: #fff;
      stroke-width: 3px;
      fill: transparent;
    }

    path.fg {
      stroke: var(--sc-dial-color);
      stroke-width: 4px;
      fill: transparent;
    }

    line {
      stroke-width: 3px;
      stroke: var(--sc-dial-color);
      stroke-linecap: butt;
    }

    sc-speed-surface {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    p {
      position: absolute;
      bottom: 2px;
      left: 0;
      width: 100%;
      height: 12px;
      line-height: 12px;
      color: var(--sc-color-primary-5);
      font-size: 8px;
      margin: 0;
      text-align: center;
      user-select: none;
      webkit-user-select: none;
      webkit-touch-callout: none;
    }
  `;get min(){return this._min}set min(e){e===this.max&&(e-=1e-10),this._min=e,this.value=this.value,this._updateScales(),this.requestUpdate()}get max(){return this._max}set max(e){e===this.min&&(e+=1e-10),this._max=e,this.value=this.value,this._updateScales(),this.requestUpdate()}get value(){return this._value}set value(e){this._value=Math.max(this.min,Math.min(this.max,e)),this.requestUpdate()}get midiType(){return"control"}set midiValue(e){this.value=(this.max-this.min)*e/127+this.min,this._dispatchInputEvent(),clearTimeout(this._midiValueTimeout),this._midiValueTimeout=setTimeout((()=>{this._dispatchChangeEvent()}),500)}get midiValue(){return Math.round((this.value-this.min)/(this.max-this.min)*127)}constructor(){super(),this._min=0,this._max=0,this._value=0,this._minAngle=-140,this._maxAngle=140,this.max=1,this.min=0,this.value=0,this.hideValue=!1,this.disabled=!1,this._midiValueTimeout=null,this.keyboard=new f(this,{filterCodes:["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"],callback:this._onKeyboardEvent.bind(this)})}render(){const e=this.hideValue?54:42,t=this._valueToAngleScale(this.value),n=M(50,e,34,t);return a.dy`
      <div
        @mousedown=${e=>e.preventDefault()}
        @touchstart=${e=>e.preventDefault()}
        @dblclick=${this._resetValue}>
        <svg viewbox="0 0 100 100">
          <path
            class="bg"
            d="${L(50,e,32,Math.min(this._maxAngle,t+8),this._maxAngle)}"
          />
          <path
            class="fg"
            d="${L(50,e,32,this._minAngle,t)}"
          />
          <line x1=${50} y1=${e} x2=${n.x} y2=${n.y} />
        </svg>

        ${this.hideValue?a.Ld:a.dy`<p>${this.value.toFixed(2)}${this.unit?` ${this.unit}`:a.Ld}</p>`}

        <sc-speed-surface @input=${this._updateValue}></sc-speed-surface>
      </div>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_updateScales(){this._valueToAngleScale=A([this.min,this.max],[this._minAngle,this._maxAngle]),this._pixelToDiffScale=A([0,15],[0,this.max-this.min])}_onKeyboardEvent(e){if(!this.disabled)switch(e.type){case"keydown":{const t=Number.isFinite(this.min)&&Number.isFinite(this.max)?(this.max-this.min)/100:1;"ArrowUp"===e.code||"ArrowRight"===e.code?this.value+=t:"ArrowDown"!==e.code&&"ArrowLeft"!==e.code||(this.value-=t),this._dispatchInputEvent();break}case"keyup":this._dispatchChangeEvent()}}_resetValue(e){e.preventDefault(),this.disabled||(this.focus(),this.value=this.min,this._dispatchInputEvent(),this._dispatchChangeEvent())}_updateValue(e){if(e.preventDefault(),e.stopPropagation(),!this.disabled)if(this.focus(),null!==e.detail.pointerId){if(Math.abs(e.detail.dy)<.02)return;this._value,e.detail.dy;const t=this._pixelToDiffScale(e.detail.dy);this.value+=t,this._dispatchInputEvent()}else this._dispatchChangeEvent()}_dispatchInputEvent(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}_dispatchChangeEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}const P=h("ScDial",k);void 0===customElements.get("sc-dial")&&customElements.define("sc-dial",P);const{I:F}=i._$LH,U=()=>document.createComment(""),B=(e,t,n)=>{var i;const r=e._$AA.parentNode,a=void 0===t?e._$AB:t._$AA;if(void 0===n){const t=r.insertBefore(U(),a),i=r.insertBefore(U(),a);n=new F(t,i,e,e.options)}else{const t=n._$AB.nextSibling,o=n._$AM,s=o!==e;if(s){let t;null===(i=n._$AQ)||void 0===i||i.call(n,e),n._$AM=e,void 0!==n._$AP&&(t=e._$AU)!==o._$AU&&n._$AP(t)}if(t!==a||s){let e=n._$AA;for(;e!==t;){const t=e.nextSibling;r.insertBefore(e,a),e=t}}}return n},G=(e,t,n=e)=>(e._$AI(t,n),e),Y={},H=(e,t=Y)=>e._$AH=t,$=e=>{var t;null===(t=e._$AP)||void 0===t||t.call(e,!1,!0);let n=e._$AA;const i=e._$AB.nextSibling;for(;n!==i;){const e=n.nextSibling;n.remove(),n=e}},V=(e,t,n)=>{const i=new Map;for(let r=t;r<=n;r++)i.set(e[r],r);return i},z=_(class extends p{constructor(e){if(super(e),2!==e.type)throw Error("repeat() can only be used in text expressions")}ct(e,t,n){let i;void 0===n?n=t:void 0!==t&&(i=t);const r=[],a=[];let o=0;for(const t of e)r[o]=i?i(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:r}}render(e,t,n){return this.ct(e,t,n).values}update(e,[t,n,r]){var a;const o=(e=>e._$AH)(e),{values:s,keys:l}=this.ct(t,n,r);if(!Array.isArray(o))return this.ut=l,s;const c=null!==(a=this.ut)&&void 0!==a?a:this.ut=[],d=[];let u,_,p=0,m=o.length-1,g=0,h=s.length-1;for(;p<=m&&g<=h;)if(null===o[p])p++;else if(null===o[m])m--;else if(c[p]===l[g])d[g]=G(o[p],s[g]),p++,g++;else if(c[m]===l[h])d[h]=G(o[m],s[h]),m--,h--;else if(c[p]===l[h])d[h]=G(o[p],s[h]),B(e,d[h+1],o[p]),p++,h--;else if(c[m]===l[g])d[g]=G(o[m],s[g]),B(e,o[p],o[m]),m--,g++;else if(void 0===u&&(u=V(l,g,h),_=V(c,p,m)),u.has(c[p]))if(u.has(c[m])){const t=_.get(l[g]),n=void 0!==t?o[t]:null;if(null===n){const t=B(e,o[p]);G(t,s[g]),d[g]=t}else d[g]=G(n,s[g]),B(e,o[p],n),o[t]=null;g++}else $(o[m]),m--;else $(o[p]),p++;for(;g<=h;){const t=B(e,d[h+1]);G(t,s[g]),d[g++]=t}for(;p<=m;){const e=o[p++];null!==e&&$(e)}return this.ut=l,H(e,d),i.Jb}});class q extends u{static properties={xRange:{type:Array,attribute:"x-range"},yRange:{type:Array,attribute:"y-range"}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    div {
      width: 100%;
      height: 100%;
    }
  `;constructor(){super(),this.xRange=[0,1],this.yRange=[0,1],this._activePointers=new Map,this._pointerIds=[],this._mouseMove=this._mouseMove.bind(this),this._mouseUp=this._mouseUp.bind(this),this._touchStart=this._touchStart.bind(this),this._touchMove=this._touchMove.bind(this),this._touchEnd=this._touchEnd.bind(this),this._propagateValues=this._propagateValues.bind(this),this._resizeObserver=null,this._rafId=null}render(){return a.dy`
      <div
        @mousedown="${this._mouseDown}"
        @touchstart="${{handleEvent:this._touchStart,passive:!1}}"
      ></div>
    `}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver((e=>{const t=e[0],{width:n,height:i}=t.contentRect,r=this.xRange[1]-this.xRange[0],a=this.yRange[1]-this.yRange[0];this._px2x=e=>e/n*r+this.xRange[0],this._px2y=e=>e/i*a+this.yRange[0]})),this._resizeObserver.observe(this)}disconnectedCallback(){this._resizeObserver.disconnect(),super.disconnectedCallback()}_mouseDown(e){window.addEventListener("mousemove",this._mouseMove,{passive:!1}),window.addEventListener("mouseup",this._mouseUp),this._pointerIds.push("mouse"),this._activePointers.set("mouse",e),this._requestUserSelectNoneOnBody(),this._requestPropagateValues(e)}_mouseMove(e){this._activePointers.set("mouse",e),this._requestPropagateValues(e)}_mouseUp(e){window.removeEventListener("mousemove",this._mouseMove),window.removeEventListener("mouseup",this._mouseUp),this._pointerIds.splice(this._pointerIds.indexOf("mouse")),this._activePointers.delete("mouse"),this._cancelUserSelectNoneOnBody();const t=new CustomEvent("pointerend",{bubbles:!0,composed:!0,detail:{pointerId:"mouse"}});this.dispatchEvent(t),this._requestPropagateValues(e)}_touchStart(e){e.preventDefault(),0===this._pointerIds.length&&(window.addEventListener("touchmove",this._touchMove,{passive:!1}),window.addEventListener("touchend",this._touchEnd),window.addEventListener("touchcancel",this._touchEnd),this._requestUserSelectNoneOnBody());for(let t of e.changedTouches){const e=t.identifier;this._pointerIds.push(e),this._activePointers.set(e,t)}this._requestPropagateValues(e)}_touchMove(e){e.preventDefault();for(let t of e.changedTouches){const e=t.identifier;-1!==this._pointerIds.indexOf(e)&&this._activePointers.set(e,t)}this._requestPropagateValues(e)}_touchEnd(e){for(let t of e.changedTouches){const e=t.identifier,n=this._pointerIds.indexOf(e);if(-1!==n){this._pointerIds.splice(n,1),this._activePointers.delete(e);const t=new CustomEvent("pointerend",{bubbles:!0,composed:!0,detail:{pointerId:e}});this.dispatchEvent(t)}}0===this._pointerIds.length&&(window.removeEventListener("touchmove",this._touchMove),window.removeEventListener("touchend",this._touchEnd),window.removeEventListener("touchcancel",this._touchEnd),this._cancelUserSelectNoneOnBody(e)),this._requestPropagateValues(e)}_requestPropagateValues(e){window.cancelAnimationFrame(this._rafId),this._rafId=window.requestAnimationFrame((()=>this._propagateValues(e)))}_propagateValues(e){const t=this.getBoundingClientRect(),n=this._pointerIds.map((e=>{const n=this._activePointers.get(e),i=n.clientX-t.left,r=this._px2x(i),a=n.clientY-t.top;return{x:r,y:this._px2y(a),pointerId:e}})),i=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:n}});this.dispatchEvent(i)}}void 0===customElements.get("sc-position-surface")&&customElements.define("sc-position-surface",q);class W extends u{static properties={value:{type:Array,attribute:!1,hasChanged:(e,t)=>!0},xRange:{type:Array,attribute:"x-range"},yRange:{type:Array,attribute:"y-range"},radius:{type:Number,attribute:"radius",reflect:!0},radiusRelative:{type:Number,attribute:"radius-relative",reflect:!0},captureEvents:{type:Boolean,attribute:"capture-events"},persistEvents:{type:Boolean,attribute:"persist-events"}};static get styles(){return a.iv`
      :host {
        display: inline-block;
        box-sizing: border-box;
        position: relative;
        line-height: 0;
        vertical-align: top;
        width: 300px;
        height: 300px;

        --sc-dots-opacity: 1;
        --sc-dots-color: var(--sc-color-secondary-2);
        --sc-dots-background-color: var(--sc-color-primary-1);
        --sc-dots-background-image: none;
      }

      :host([hidden]) {
        display: none
      }

      :host(.debug) {
        outline: 1px solid yellow;
      }

      :host(.debug) sc-position-surface {
        outline: 1px dashed blue;
      }

      :host(.debug) svg {
        outline: 1px dotted red;
      }

      sc-position-surface {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
      }

      svg {
        position: relative;
        background-color: var(--sc-dots-background-color);
        background-image: var(--sc-dots-background-image);
        background-size: contain;
        background-position: 50% 50%;
        background-repeat: no-repeat;
      }

      circle {
        pointer-event: none;
        fill-opacity: var(--sc-dots-opacity);
        fill: var(--sc-dots-color);
      }
    `}constructor(){super(),this.value=[],this.xRange=[0,1],this.yRange=[0,1],this.radius=null,this.radiusRelative=null,this.captureEvents=!1,this.persistEvents=!1,this._defaultRadius=5,this._resizeObserver=null,this._x2px=null,this._y2px=null,this._radius2px=null,this._width=null,this._height=null,this._svgWidth=null,this._svgHeight=null}update(e){(e.has("xRange")||e.has("yRange"))&&this._updateScales(),super.update(e)}render(){let e=this._defaultRadius;return this.radius?e=this.radius:this.radiusRelative&&(e=this._radius2px(this.radiusRelative)),a.dy`
      ${this.captureEvents?a.dy`
          <sc-position-surface
            style="
              width: ${this._svgWidth}px;
              height: ${this._svgHeight}px;
              left: ${(this._width-this._svgWidth)/2}px;
              top: ${(this._height-this._svgHeight)/2}px;
            "
            x-range="${JSON.stringify(this.xRange)}"
            y-range="${JSON.stringify(this.yRange)}"
            @input="${this._updatePositions}"
          ></sc-position-surface>
        `:""}
      <svg
        style="
          width: ${this._svgWidth}px;
          height: ${this._svgHeight}px;
          left: ${(this._width-this._svgWidth)/2}px;
          top: ${(this._height-this._svgHeight)/2}px;
        "
        viewBox="0 0 ${this._svgWidth} ${this._svgHeight}"
      >
        ${z(this.value,(e=>`${e.x}-${e.y}`),(t=>a.YP`<circle
            r="${e}"
            cx="${this._x2px(t.x)}"
            cy="${this._y2px(t.y)}"
            style="${t.color?`fill: ${t.color}`:""}"
          ></circle>`))}
      </svg>
    `}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver((e=>this._updateScales())),this._resizeObserver.observe(this)}disconnectedCallback(){this._resizeObserver.disconnect(),super.disconnectedCallback()}_updateScales(){const{width:e,height:t}=this.getBoundingClientRect(),n=Math.abs(this.xRange[1]-this.xRange[0]),i=Math.abs(this.yRange[1]-this.yRange[0]);let r,a;n/i>e/t?(r=e,a=n):(r=t,a=i),this._svgWidth=r/a*n,this._svgHeight=r/a*i,this._width=e,this._height=t;{const e=this._svgWidth/(this.xRange[1]-this.xRange[0]),t=-this.xRange[0]*e;this._x2px=n=>e*n+t}{const e=this._svgHeight/(this.yRange[1]-this.yRange[0]),t=-this.yRange[0]*e;this._y2px=n=>e*n+t}{const e=Math.abs(this._svgHeight/(this.yRange[1]-this.yRange[0]));this._radius2px=t=>e*t}this.requestUpdate()}_updatePositions(e){if(e.stopPropagation(),this.persistEvents&&0===e.detail.value.length)return;const t=e.detail.value.map((e=>{const t=Math.min(this.xRange[0],this.xRange[1]),n=Math.max(this.xRange[0],this.xRange[1]),i=Math.min(this.yRange[0],this.yRange[1]),r=Math.max(this.yRange[0],this.yRange[1]);return{x:Math.min(n,Math.max(t,e.x)),y:Math.min(r,Math.max(i,e.y))}}));this.value=t;const n=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(n),this.requestUpdate()}}void 0===customElements.get("sc-dots")&&customElements.define("sc-dots",W);const K=new AudioContext;class Q extends u{static properties={format:{type:String,reflect:!0},_status:{type:String,state:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      width: 300px;
      height: 150px;
      box-sizing: border-box;
      border: 1px solid var(--sc-color-primary-2);
      background-color: var(--sc-color-primary-1);
      border-radius: 2px;
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      color: white;
      user-select: none;
      webkit-user-select: none;
      webkit-touch-callout: none;

      --sc-dragndrop-dragged-background-color: var(--sc-color-primary-2);
      --sc-dragndrop-processing-background-color: var(--sc-color-secondary-3);
    }

    :host([hidden]) {
      display: none
    }

    .drop-zone {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .drop-zone.dragged {
      background-color: var(--sc-dragndrop-dragged-background-color);
    }

    .drop-zone.processing {
      background-color: var(--sc-dragndrop-processing-background-color);
    }
  `;get format(){return this._format}set format(e){if("load"!==e&&"raw"!==e)return void console.warn('sc-dragndrop: format should be either "load" or "raw"');const t=this._format;this._format=e,this.requestUpdate("format",t)}constructor(){super(),this._status="idle",this.format="load"}render(){const e={"drop-zone":!0,dragged:"drag"===this._status,processing:"processing"===this._status};return a.dy`
      <div class="${m(e)}"
        @dragover=${this.onDragOver}
        @dragleave=${this.onDragLeave}
        @drop=${this.onDrop}
      >
        ${"processing"===this._status?"processing...":a.dy`<slot>drag and drop files</slot>`}
      </div>
    `}onDragOver(e){e.preventDefault(),e.dataTransfer.dropEffect="copy",this._status="drag"}onDragLeave(e){e.preventDefault(),this._status="idle"}onDrop(e){if(e.preventDefault(),this._status="processing","load"===this.format){const t=Array.from(e.dataTransfer.files),n={};let i=0;t.forEach(((e,r)=>{let a;const o=new FileReader;switch(a="audio/midi"===e.type?"midi":/^audio/.test(e.type)?"audio":/json$/.test(e.type)?"json":/^image/.test(e.type)?"image":/^text/.test(e.type)?"text":"unknown",o.onload=async r=>{switch(a){case"audio":try{const t=await K.decodeAudioData(o.result);n[e.name]=t}catch(t){console.log(t),n[e.name]=null}break;case"json":n[e.name]=JSON.parse(o.result);break;case"image":{const t=new Image;t.src=o.result,n[e.name]=t;break}default:n[e.name]=o.result}if(i+=1,i===t.length){this.value=n;const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e),this._status="idle"}},a){case"audio":o.readAsArrayBuffer(e);break;case"json":case"text":default:o.readAsText(e);break;case"image":case"midi":o.readAsDataURL(e)}}))}else if("raw"==this.format){const t=Array.from(e.dataTransfer.files);this.value={},t.forEach((e=>this.value[e.name]=e));const n=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(n),this._status="idle"}else console.log(`Unknow format: "${this.format}"`)}}void 0===customElements.get("sc-dragndrop")&&customElements.define("sc-dragndrop",Q);var j=n(1036);n(4952),n(6963),n(5169),n(191),n(1041),n(5930),n(2500);const X=a.iv`
/* BASICS */

.CodeMirror {
  /* Set height, width, borders, and global font properties here */
  font-family: monospace;
  height: 300px;
  color: black;
  direction: ltr;
}

/* PADDING */

.CodeMirror-lines {
  padding: 4px 0; /* Vertical padding around content */
}
.CodeMirror pre.CodeMirror-line,
.CodeMirror pre.CodeMirror-line-like {
  padding: 0 4px; /* Horizontal padding of content */
}

.CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
  background-color: white; /* The little square between H and V scrollbars */
}

/* GUTTER */

.CodeMirror-gutters {
  border-right: 1px solid #ddd;
  background-color: #f7f7f7;
  white-space: nowrap;
}
.CodeMirror-linenumbers {}
.CodeMirror-linenumber {
  padding: 0 3px 0 5px;
  min-width: 20px;
  text-align: right;
  color: #999;
  white-space: nowrap;
}

.CodeMirror-guttermarker { color: black; }
.CodeMirror-guttermarker-subtle { color: #999; }

/* CURSOR */

.CodeMirror-cursor {
  border-left: 1px solid black;
  border-right: none;
  width: 0;
}
/* Shown when moving in bi-directional text */
.CodeMirror div.CodeMirror-secondarycursor {
  border-left: 1px solid silver;
}
.cm-fat-cursor .CodeMirror-cursor {
  width: auto;
  border: 0 !important;
  background: #7e7;
}
.cm-fat-cursor div.CodeMirror-cursors {
  z-index: 1;
}
.cm-fat-cursor .CodeMirror-line::selection,
.cm-fat-cursor .CodeMirror-line > span::selection, 
.cm-fat-cursor .CodeMirror-line > span > span::selection { background: transparent; }
.cm-fat-cursor .CodeMirror-line::-moz-selection,
.cm-fat-cursor .CodeMirror-line > span::-moz-selection,
.cm-fat-cursor .CodeMirror-line > span > span::-moz-selection { background: transparent; }
.cm-fat-cursor { caret-color: transparent; }
@-moz-keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}
@-webkit-keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}
@keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}

/* Can style cursor different in overwrite (non-insert) mode */
.CodeMirror-overwrite .CodeMirror-cursor {}

.cm-tab { display: inline-block; text-decoration: inherit; }

.CodeMirror-rulers {
  position: absolute;
  left: 0; right: 0; top: -50px; bottom: 0;
  overflow: hidden;
}
.CodeMirror-ruler {
  border-left: 1px solid #ccc;
  top: 0; bottom: 0;
  position: absolute;
}

/* DEFAULT THEME */

.cm-s-default .cm-header {color: blue;}
.cm-s-default .cm-quote {color: #090;}
.cm-negative {color: #d44;}
.cm-positive {color: #292;}
.cm-header, .cm-strong {font-weight: bold;}
.cm-em {font-style: italic;}
.cm-link {text-decoration: underline;}
.cm-strikethrough {text-decoration: line-through;}

.cm-s-default .cm-keyword {color: #708;}
.cm-s-default .cm-atom {color: #219;}
.cm-s-default .cm-number {color: #164;}
.cm-s-default .cm-def {color: #00f;}
.cm-s-default .cm-variable,
.cm-s-default .cm-punctuation,
.cm-s-default .cm-property,
.cm-s-default .cm-operator {}
.cm-s-default .cm-variable-2 {color: #05a;}
.cm-s-default .cm-variable-3, .cm-s-default .cm-type {color: #085;}
.cm-s-default .cm-comment {color: #a50;}
.cm-s-default .cm-string {color: #a11;}
.cm-s-default .cm-string-2 {color: #f50;}
.cm-s-default .cm-meta {color: #555;}
.cm-s-default .cm-qualifier {color: #555;}
.cm-s-default .cm-builtin {color: #30a;}
.cm-s-default .cm-bracket {color: #997;}
.cm-s-default .cm-tag {color: #170;}
.cm-s-default .cm-attribute {color: #00c;}
.cm-s-default .cm-hr {color: #999;}
.cm-s-default .cm-link {color: #00c;}

.cm-s-default .cm-error {color: #f00;}
.cm-invalidchar {color: #f00;}

.CodeMirror-composing { border-bottom: 2px solid; }

/* Default styles for common addons */

div.CodeMirror span.CodeMirror-matchingbracket {color: #0b0;}
div.CodeMirror span.CodeMirror-nonmatchingbracket {color: #a22;}
.CodeMirror-matchingtag { background: rgba(255, 150, 0, .3); }
.CodeMirror-activeline-background {background: #e8f2ff;}

/* STOP */

/* The rest of this file contains styles related to the mechanics of
   the editor. You probably shouldn't touch them. */

.CodeMirror {
  position: relative;
  overflow: hidden;
  background: white;
}

.CodeMirror-scroll {
  overflow: scroll !important; /* Things will break if this is overridden */
  /* 50px is the magic margin used to hide the element's real scrollbars */
  /* See overflow: hidden in .CodeMirror */
  margin-bottom: -50px; margin-right: -50px;
  padding-bottom: 50px;
  height: 100%;
  outline: none; /* Prevent dragging from highlighting the element */
  position: relative;
  z-index: 0;
}
.CodeMirror-sizer {
  position: relative;
  border-right: 50px solid transparent;
}

/* The fake, visible scrollbars. Used to force redraw during scrolling
   before actual scrolling happens, thus preventing shaking and
   flickering artifacts. */
.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
  position: absolute;
  z-index: 6;
  display: none;
  outline: none;
}
.CodeMirror-vscrollbar {
  right: 0; top: 0;
  overflow-x: hidden;
  overflow-y: scroll;
}
.CodeMirror-hscrollbar {
  bottom: 0; left: 0;
  overflow-y: hidden;
  overflow-x: scroll;
}
.CodeMirror-scrollbar-filler {
  right: 0; bottom: 0;
}
.CodeMirror-gutter-filler {
  left: 0; bottom: 0;
}

.CodeMirror-gutters {
  position: absolute; left: 0; top: 0;
  min-height: 100%;
  z-index: 3;
}
.CodeMirror-gutter {
  white-space: normal;
  height: 100%;
  display: inline-block;
  vertical-align: top;
  margin-bottom: -50px;
}
.CodeMirror-gutter-wrapper {
  position: absolute;
  z-index: 4;
  background: none !important;
  border: none !important;
}
.CodeMirror-gutter-background {
  position: absolute;
  top: 0; bottom: 0;
  z-index: 4;
}
.CodeMirror-gutter-elt {
  position: absolute;
  cursor: default;
  z-index: 4;
}
.CodeMirror-gutter-wrapper ::selection { background-color: transparent }
.CodeMirror-gutter-wrapper ::-moz-selection { background-color: transparent }

.CodeMirror-lines {
  cursor: text;
  min-height: 1px; /* prevents collapsing before first draw */
}
.CodeMirror pre.CodeMirror-line,
.CodeMirror pre.CodeMirror-line-like {
  /* Reset some styles that the rest of the page might have set */
  -moz-border-radius: 0; -webkit-border-radius: 0; border-radius: 0;
  border-width: 0;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  margin: 0;
  white-space: pre;
  word-wrap: normal;
  line-height: inherit;
  color: inherit;
  z-index: 2;
  position: relative;
  overflow: visible;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-variant-ligatures: contextual;
  font-variant-ligatures: contextual;
}
.CodeMirror-wrap pre.CodeMirror-line,
.CodeMirror-wrap pre.CodeMirror-line-like {
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: normal;
}

.CodeMirror-linebackground {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  z-index: 0;
}

.CodeMirror-linewidget {
  position: relative;
  z-index: 2;
  padding: 0.1px; /* Force widget margins to stay inside of the container */
}

.CodeMirror-widget {}

.CodeMirror-rtl pre { direction: rtl; }

.CodeMirror-code {
  outline: none;
}

/* Force content-box sizing for the elements where we expect it */
.CodeMirror-scroll,
.CodeMirror-sizer,
.CodeMirror-gutter,
.CodeMirror-gutters,
.CodeMirror-linenumber {
  -moz-box-sizing: content-box;
  box-sizing: content-box;
}

.CodeMirror-measure {
  position: absolute;
  width: 100%;
  height: 0;
  overflow: hidden;
  visibility: hidden;
}

.CodeMirror-cursor {
  position: absolute;
  pointer-events: none;
}
.CodeMirror-measure pre { position: static; }

div.CodeMirror-cursors {
  visibility: hidden;
  position: relative;
  z-index: 3;
}
div.CodeMirror-dragcursors {
  visibility: visible;
}

.CodeMirror-focused div.CodeMirror-cursors {
  visibility: visible;
}

.CodeMirror-selected { background: #d9d9d9; }
.CodeMirror-focused .CodeMirror-selected { background: #d7d4f0; }
.CodeMirror-crosshair { cursor: crosshair; }
.CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: #d7d4f0; }
.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }

.cm-searching {
  background-color: #ffa;
  background-color: rgba(255, 255, 0, .4);
}

/* Used to force a border model for a node */
.cm-force-border { padding-right: .1px; }

@media print {
  /* Hide the cursor when printing */
  .CodeMirror div.CodeMirror-cursors {
    visibility: hidden;
  }
}

/* See issue #2901 */
.cm-tab-wrap-hack:after { content: ''; }

/* Help users use markselection to safely style text background */
span.CodeMirror-selectedtext { background: none; }

`,Z=a.iv`
/* Based on Sublime Text's Monokai theme */

.cm-s-monokai.CodeMirror { background: #272822; color: #f8f8f2; }
.cm-s-monokai div.CodeMirror-selected { background: #49483E; }
.cm-s-monokai .CodeMirror-line::selection, .cm-s-monokai .CodeMirror-line > span::selection, .cm-s-monokai .CodeMirror-line > span > span::selection { background: rgba(73, 72, 62, .99); }
.cm-s-monokai .CodeMirror-line::-moz-selection, .cm-s-monokai .CodeMirror-line > span::-moz-selection, .cm-s-monokai .CodeMirror-line > span > span::-moz-selection { background: rgba(73, 72, 62, .99); }
.cm-s-monokai .CodeMirror-gutters { background: #272822; border-right: 0px; }
.cm-s-monokai .CodeMirror-guttermarker { color: white; }
.cm-s-monokai .CodeMirror-guttermarker-subtle { color: #d0d0d0; }
.cm-s-monokai .CodeMirror-linenumber { color: #d0d0d0; }
.cm-s-monokai .CodeMirror-cursor { border-left: 1px solid #f8f8f0; }

.cm-s-monokai span.cm-comment { color: #75715e; }
.cm-s-monokai span.cm-atom { color: #ae81ff; }
.cm-s-monokai span.cm-number { color: #ae81ff; }

.cm-s-monokai span.cm-comment.cm-attribute { color: #97b757; }
.cm-s-monokai span.cm-comment.cm-def { color: #bc9262; }
.cm-s-monokai span.cm-comment.cm-tag { color: #bc6283; }
.cm-s-monokai span.cm-comment.cm-type { color: #5998a6; }

.cm-s-monokai span.cm-property, .cm-s-monokai span.cm-attribute { color: #a6e22e; }
.cm-s-monokai span.cm-keyword { color: #f92672; }
.cm-s-monokai span.cm-builtin { color: #66d9ef; }
.cm-s-monokai span.cm-string { color: #e6db74; }

.cm-s-monokai span.cm-variable { color: #f8f8f2; }
.cm-s-monokai span.cm-variable-2 { color: #9effff; }
.cm-s-monokai span.cm-variable-3, .cm-s-monokai span.cm-type { color: #66d9ef; }
.cm-s-monokai span.cm-def { color: #fd971f; }
.cm-s-monokai span.cm-bracket { color: #f8f8f2; }
.cm-s-monokai span.cm-tag { color: #f92672; }
.cm-s-monokai span.cm-header { color: #ae81ff; }
.cm-s-monokai span.cm-link { color: #ae81ff; }
.cm-s-monokai span.cm-error { background: #f92672; color: #f8f8f0; }

.cm-s-monokai .CodeMirror-activeline-background { background: #373831; }
.cm-s-monokai .CodeMirror-matchingbracket {
  text-decoration: underline;
  color: white !important;
}

`,J=a.iv`
.CodeMirror-dialog {
  position: absolute;
  left: 0; right: 0;
  background: inherit;
  z-index: 15;
  padding: .1em .8em;
  overflow: hidden;
  color: inherit;
}

.CodeMirror-dialog-top {
  border-bottom: 1px solid #eee;
  top: 0;
}

.CodeMirror-dialog-bottom {
  border-top: 1px solid #eee;
  bottom: 0;
}

.CodeMirror-dialog input {
  border: none;
  outline: none;
  background: transparent;
  width: 20em;
  color: inherit;
  font-family: monospace;
}

.CodeMirror-dialog button {
  font-size: 70%;
}

`,ee={};ee.question=a.dy`
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">
  <g>
    <path fill="white" d="M500,9.9c270.1,0,490.5,220.6,490,490.3c-0.5,270.7-220.6,490.6-490.3,489.9C229.2,989.4,10.4,770.5,10,500.1C9.6,230.3,229.9,9.9,500,9.9z M943.7,499.9c0-244.4-198-443-443.5-443.5C255.5,55.9,56.6,254.5,56.3,499.9c-0.3,244.4,198.3,442.9,443.4,443.6C743.8,944.2,943.8,744.5,943.7,499.9z M527.3,658.3c-20.9,0-41.3,0-62.2,0c0-12.4-0.7-24.6,0.1-36.7c1.6-24.4,7.3-47.9,20-69.2c9.9-16.6,22.6-30.9,36.7-44c17.5-16.3,35.1-32.4,52.3-49.1c10.1-9.8,19-20.8,23.7-34.4c11.2-32.7,4-61.8-17.7-87.8c-36.1-43.1-96.4-44.6-133.4-23c-23.3,13.6-37.3,34.4-45.4,59.5c-3.7,11.2-6.2,22.8-9.5,35.1c-21.5-2.5-43.5-5.2-66.3-7.9c0.9-5.7,1.5-11,2.5-16.3c5.7-29.6,15.9-57.2,35.3-80.8c23.5-28.8,54.2-45.6,90.3-52.5c37.7-7.2,75.3-6.5,112,5.5c46.9,15.2,81.6,45,97.4,92.4c15.1,45.5,7.7,88.5-22.1,127c-18.9,24.4-42.4,44.2-64.5,65.4c-9.7,9.3-19.6,18.7-28,29.2c-12.5,15.5-17.3,34.3-18.8,53.9C528.6,635.5,528.1,646.6,527.3,658.3z M461,790c0-24.6,0-48.9,0-73.7c24.6,0,49,0,73.7,0c0,24.5,0,48.9,0,73.7C510.3,790,485.8,790,461,790z" />
  </g>
</svg>`,ee.info=a.dy`
<svg viewbox="0 0 23.7 23.7" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"
>
  <path fill="#fff" d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm.5 17h-1v-9h1v9zm-.5-12c.466 0 .845.378.845.845 0 .466-.379.844-.845.844-.466 0-.845-.378-.845-.844 0-.467.379-.845.845-.845z"/>
</svg>
`,ee.github=a.dy`
<svg viewbox="0 0 98 98" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff"/>
</svg>
`,ee.burger=a.dy`
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g>
<path d="M3 6H21M3 12H21M3 18H21" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>
`,ee.gear=a.dy`
<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"  xml:space="preserve">
  <style type="text/css">
    .st0{fill:#ffffff;}
  </style>
  <g>
    <path class="st0" d="M499.139,318.571l-37.178-5.407c-2.329-0.178-4.336-1.642-5.228-3.8l-12.054-29.086
      c-0.901-2.15-0.526-4.613,1-6.379l22.243-29.88c3.533-4.141,3.301-10.314-0.554-14.168l-17.602-17.594
      c-3.846-3.854-10.029-4.104-14.159-0.553l-29.889,22.233c-1.758,1.518-4.238,1.91-6.38,1.018l-29.094-12.062
      c-2.151-0.883-3.622-2.926-3.81-5.228l-5.389-37.169c-0.428-5.442-4.96-9.635-10.402-9.635h-24.893
      c-5.45,0-9.983,4.193-10.402,9.635l-5.407,37.169c-0.17,2.32-1.642,4.345-3.792,5.228l-29.103,12.062
      c-2.151,0.892-4.613,0.5-6.388-1.018l-29.872-22.233c-4.13-3.542-10.304-3.302-14.167,0.553l-17.594,17.594
      c-3.854,3.854-4.086,10.028-0.554,14.168l22.234,29.888c1.508,1.758,1.91,4.229,1.009,6.371l-12.054,29.086
      c-0.874,2.159-2.908,3.622-5.219,3.81l-37.195,5.398c-5.425,0.429-9.618,4.961-9.618,10.412v24.883
      c0,5.442,4.194,9.993,9.618,10.403l37.195,5.398c2.311,0.188,4.345,1.659,5.219,3.81l12.054,29.086
      c0.901,2.159,0.5,4.63-1.009,6.388l-22.234,29.889c-3.533,4.14-3.301,10.295,0.554,14.168l17.594,17.594
      c3.863,3.854,10.037,4.086,14.167,0.544l29.872-22.243c1.775-1.498,4.237-1.9,6.388-0.998l29.103,12.044
      c2.151,0.902,3.622,2.918,3.802,5.246l5.398,37.169c0.428,5.433,4.952,9.636,10.402,9.636h24.893c5.451,0,9.974-4.203,10.402-9.636
      l5.389-37.169c0.188-2.328,1.659-4.344,3.81-5.246l29.103-12.044c2.142-0.902,4.622-0.5,6.379,0.998l29.881,22.243
      c4.13,3.542,10.314,3.31,14.159-0.544l17.602-17.594c3.864-3.873,4.087-10.028,0.554-14.168l-22.243-29.889
      c-1.499-1.758-1.9-4.229-1-6.388l12.054-29.086c0.892-2.151,2.899-3.622,5.228-3.81l37.178-5.398
      c5.434-0.41,9.627-4.961,9.627-10.403v-24.883C508.766,323.532,504.573,319,499.139,318.571z M379.093,382.328
      c-10.93,10.912-25.445,16.926-40.898,16.926c-15.444,0-29.978-6.014-40.898-16.926c-10.92-10.938-16.943-25.454-16.943-40.907
      c0-15.444,6.022-29.969,16.943-40.89c10.92-10.939,25.454-16.934,40.898-16.934c15.454,0,29.969,5.995,40.898,16.934
      c10.92,10.92,16.934,25.446,16.934,40.89C396.027,356.874,390.014,371.39,379.093,382.328z"/>
    <path class="st0" d="M187.351,252.156c4.032-1.445,6.254-5.746,5.122-9.868l-5.898-28.854c-0.472-1.767,0.072-3.649,1.419-4.88
      l18.263-16.621c1.338-1.222,3.284-1.588,4.97-0.946l27.961,8.466c3.989,1.508,8.485-0.294,10.306-4.166l8.297-17.656
      c1.837-3.881,0.366-8.485-3.346-10.591l-24.339-16.14c-1.58-0.91-2.535-2.632-2.436-4.452l1.16-24.66
      c0.098-1.829,1.186-3.444,2.838-4.194l26.008-13.874c3.898-1.74,5.781-6.218,4.336-10.215l-6.603-18.371
      c-1.454-4.024-5.755-6.254-9.876-5.121l-28.863,5.879c-1.767,0.5-3.632-0.053-4.871-1.41L195.185,56.23
      c-1.24-1.357-1.614-3.265-0.955-4.978l8.468-27.944c1.507-4.006-0.294-8.494-4.175-10.306l-17.648-8.306
      c-3.872-1.821-8.494-0.366-10.608,3.354l-16.131,24.34c-0.902,1.58-2.623,2.533-4.444,2.445l-24.66-1.169
      c-1.82-0.08-3.462-1.205-4.202-2.847L106.974,4.821c-1.758-3.898-6.219-5.782-10.234-4.336L78.379,7.096
      c-4.024,1.446-6.254,5.738-5.112,9.859l5.888,28.872c0.482,1.748-0.062,3.64-1.418,4.862l-18.264,16.63
      c-1.356,1.222-3.274,1.597-4.987,0.955l-27.944-8.476c-3.988-1.516-8.476,0.304-10.305,4.175L7.939,81.622
      c-1.82,3.872-0.366,8.494,3.346,10.599l24.339,16.14c1.588,0.902,2.534,2.615,2.436,4.435l-1.16,24.66
      c-0.071,1.838-1.187,3.444-2.837,4.193L8.055,155.522c-3.9,1.749-5.782,6.219-4.336,10.216l6.611,18.37
      c1.445,4.024,5.746,6.254,9.859,5.131l28.881-5.906c1.749-0.482,3.64,0.071,4.862,1.427l16.612,18.255
      c1.24,1.356,1.598,3.283,0.954,4.987l-8.466,27.944c-1.499,3.997,0.304,8.485,4.175,10.305l17.648,8.297
      c3.881,1.829,8.493,0.357,10.608-3.346l16.122-24.348c0.91-1.57,2.623-2.534,4.452-2.428l24.661,1.16
      c1.829,0.09,3.453,1.178,4.211,2.846l13.847,25.989c1.767,3.9,6.219,5.8,10.233,4.354L187.351,252.156z M148.229,172.296
      c-11.394,4.095-23.714,3.524-34.68-1.633c-10.965-5.157-19.245-14.275-23.358-25.678c-4.095-11.402-3.524-23.714,1.634-34.67
      c5.156-10.974,14.283-19.254,25.677-23.357c11.402-4.105,23.714-3.534,34.67,1.641c10.956,5.139,19.254,14.258,23.366,25.66
      c4.096,11.403,3.516,23.706-1.632,34.672C168.731,159.886,159.621,168.183,148.229,172.296z"/>
  </g>
</svg>
`,ee.save=a.dy`
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path id="Combined Shape" fill-rule="evenodd" clip-rule="evenodd" d="M35.2822 4.88487C34.7186 4.31826 33.9535 4 33.1551 4H6.99915C5.34286 4 3.99915 5.34372 3.99915 7V41C3.99915 42.6563 5.34286 44 6.99915 44H40.9991C42.6569 44 43.9991 42.6568 43.9991 41V14.888C43.9991 14.095 43.6861 13.3357 43.1261 12.7728L35.2822 4.88487ZM6.99915 6H12.9999V15.9508C12.9999 17.0831 13.9197 18.0028 15.0519 18.0028H32.9479C34.0802 18.0028 34.9999 17.0831 34.9999 15.9508V11.2048C34.9999 10.6525 34.5522 10.2048 33.9999 10.2048C33.4477 10.2048 32.9999 10.6525 32.9999 11.2048V15.9508C32.9999 15.9785 32.9757 16.0028 32.9479 16.0028H15.0519C15.0242 16.0028 14.9999 15.9785 14.9999 15.9508V6H33.1551C33.4211 6 33.6759 6.10599 33.8642 6.29523L41.7081 14.1831C41.8952 14.3712 41.9991 14.6234 41.9991 14.888V41C41.9991 41.5526 41.552 42 40.9991 42H6.99915C6.44743 42 5.99915 41.5517 5.99915 41V7C5.99915 6.44828 6.44743 6 6.99915 6ZM27.9999 30.0206C27.9999 27.8121 26.2089 26.0206 23.9999 26.0206C23.4477 26.0206 22.9999 25.5729 22.9999 25.0206C22.9999 24.4683 23.4477 24.0206 23.9999 24.0206C27.3136 24.0206 29.9999 26.7077 29.9999 30.0206C29.9999 33.3349 27.3142 36.0206 23.9999 36.0206C20.6857 36.0206 17.9999 33.3349 17.9999 30.0206C17.9999 29.4683 18.4477 29.0206 18.9999 29.0206C19.5522 29.0206 19.9999 29.4683 19.9999 30.0206C19.9999 32.2303 21.7902 34.0206 23.9999 34.0206C26.2097 34.0206 27.9999 32.2303 27.9999 30.0206Z" fill="#ffffff"/>
</svg>
`,ee.close=a.dy`
<svg viewBox="100 80 820 820" fill="#ffffff" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <path d="M512 897.6c-108 0-209.6-42.4-285.6-118.4-76-76-118.4-177.6-118.4-285.6 0-108 42.4-209.6 118.4-285.6 76-76 177.6-118.4 285.6-118.4 108 0 209.6 42.4 285.6 118.4 157.6 157.6 157.6 413.6 0 571.2-76 76-177.6 118.4-285.6 118.4z m0-760c-95.2 0-184.8 36.8-252 104-67.2 67.2-104 156.8-104 252s36.8 184.8 104 252c67.2 67.2 156.8 104 252 104 95.2 0 184.8-36.8 252-104 139.2-139.2 139.2-364.8 0-504-67.2-67.2-156.8-104-252-104z" />
  <path d="M707.872 329.392L348.096 689.16l-31.68-31.68 359.776-359.768z" />
  <path d="M328 340.8l32-31.2 348 348-32 32z" />
</svg>
`,ee.delete=a.dy`
<svg viewBox="1 5 20 13" stroke="#ffffff" xmlns="http://www.w3.org/2000/svg">
<path d="M16 9L13.0001 11.9999M13.0001 11.9999L10 15M13.0001 11.9999L10.0002 9M13.0001 11.9999L16.0002 15M8 6H19C19.5523 6 20 6.44772 20 7V17C20 17.5523 19.5523 18 19 18H8L2 12L8 6Z" stroke-width="1" stroke-linecap="round"/>
</svg>
`,ee.midi=a.dy`
  <svg viewBox="1 1 22 22" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" version="1.1" >
    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M20.18,12C20.18,8.18 17.55,4.96 14,4.07V6H10V4.07C6.45,4.96 3.82,8.18 3.82,12A8.18,8.18 0 0,0 12,20.18A8.18,8.18 0 0,0 20.18,12M7,10.64A1.36,1.36 0 0,1 8.36,12A1.36,1.36 0 0,1 7,13.36C6.25,13.36 5.64,12.75 5.64,12C5.64,11.25 6.25,10.64 7,10.64M17,10.64A1.36,1.36 0 0,1 18.36,12A1.36,1.36 0 0,1 17,13.36A1.36,1.36 0 0,1 15.64,12A1.36,1.36 0 0,1 17,10.64M8.36,14.27A1.37,1.37 0 0,1 9.73,15.64C9.73,16.39 9.12,17 8.36,17A1.36,1.36 0 0,1 7,15.64C7,14.88 7.61,14.27 8.36,14.27M15.64,14.27C16.39,14.27 17,14.88 17,15.64A1.36,1.36 0 0,1 15.64,17C14.88,17 14.27,16.39 14.27,15.64A1.37,1.37 0 0,1 15.64,14.27M12,15.64A1.36,1.36 0 0,1 13.36,17A1.36,1.36 0 0,1 12,18.36A1.36,1.36 0 0,1 10.64,17A1.36,1.36 0 0,1 12,15.64Z" />
  </svg>
`;const te=ee;class ne extends u{static properties={type:{type:String,reflect:!0},href:{type:String,reflect:!0},value:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: inline-block;
      box-sizing: border-box;
      overflow: hidden;
      width: 30px;
      height: 30px;
      border: 1px solid var(--sc-color-primary-3);
      background-color: var(--sc-color-primary-2);
      cursor: pointer;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    :host(:hover) {
      background-color: var(--sc-color-primary-3);
    }

    div {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    div:active {
      opacity: 0.5;
    }

    a {
      box-sizing: border-box;
      display: block;
      width: 100%;
      height: 100%;
    }

    svg {
      box-sizing: border-box;
      padding: 3px;
      width: 100%;
      height: 100%;
    }

    :host([disabled]:hover) {
      background-color: var(--sc-color-primary-2);
    }

    :host([disabled]) div:active {
      opacity: 1;
    }
  `;constructor(){super(),this.type="question",this.value=null,this.href=null,this.disabled=!1,this._pressed=!1,this._onEvent=this._onEvent.bind(this),this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){let e;return e=null===this.href||""===this.href||this.disabled?te[this.type]:a.dy`
        <a href="${this.href}" target="_blank">
          ${te[this.type]}
        </a>
      `,a.dy`
      <div
        @mousedown="${this._onEvent}"
        @mouseup="${this._onEvent}"
        @touchstart="${{handleEvent:this._onEvent,passive:!1}}"
        @touchend="${this._onEvent}"
      >
        ${e}
      </div>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){if(this.disabled)return;const t="keydown"===e.type?"press":"release";this._dispatchEvent(t)}_onEvent(e){if(e.preventDefault(),this.disabled)return;const t="touchend"===e.type||"mouseup"===e.type?"release":"press";this._dispatchEvent(t)}_dispatchEvent(e){if("release"===e&&!1===this._pressed)return;this._pressed="press"===e;const t=new CustomEvent(e,{bubbles:!0,composed:!0,detail:{value:this.value}});if(this.dispatchEvent(t),"press"===e){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}}void 0===customElements.get("sc-icon")&&customElements.define("sc-icon",ne),j.commands.save=function(e){e._scComponent.save()};class ie extends u{static properties={value:{type:String},saveButton:{type:Boolean,reflect:!0,attribute:"save-button"},dirty:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: inline-block;
      box-sizing: boder-box;
      width: 300px;
      height: 200px;
      border-left: 2px solid var(--sc-color-primary-3);
      position: relative;
      font-size: var(--sc-font-size);
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border-left: 2px solid var(--sc-color-primary-4);
    }

    :host([dirty]) {
      border-left: 2px solid var(--sc-color-secondary-3);
    }

    .container {
      width: 100%;
      height: 100%;
    }

    /* highlight focused editor */
    .CodeMirror { opacity: 0.9; }
    .CodeMirror.CodeMirror-focused { opacity: 1; }
    /* code mirror styles */
    ${X}
    ${Z}
    ${J}

    sc-icon {
      position: absolute;
      bottom: 2px;
      right: 2px;
    }
  `;get value(){return this._value}set value(e){if(this._value=null!==e?e:"",this._codeMirror){const e=this._codeMirror.getCursor();this._codeMirror.setValue(this._value),this._codeMirror.setCursor(e),this._cleanDoc(),setTimeout((()=>this._codeMirror.refresh()),1)}}constructor(){super(),this.value="",this.saveButton=!1,this.dirty=!1}render(){return a.dy`
      <div @keydown="${this._onKeydown}" class="container"></div>
      ${this.dirty&&this.saveButton?a.dy`<sc-icon type="save" @input=${this.save}></sc-icon>`:a.Ld}
    `}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver((e=>{const t=this.shadowRoot.querySelector(".container"),{width:n,height:i}=t.getBoundingClientRect();this._codeMirror.setSize(n,i)})),this._resizeObserver.observe(this)}disconnectedCallback(){this._resizeObserver.disconnect(),super.disconnectedCallback()}firstUpdated(){const e=this.shadowRoot.querySelector(".container");this._codeMirror=j(e,{value:this.value,mode:"javascript",theme:"monokai",lineNumbers:!0,tabSize:2,keyMap:"sublime"}),this._codeMirror._scComponent=this,this._codeMirror.setOption("extraKeys",{Tab:function(e){let t="";for(let n=0;n<e.getOption("indentUnit");n++)t+=" ";e.replaceSelection(t)}}),this._codeMirror.on("change",(()=>{this._codeMirror.getDoc().isClean()||(this.dirty=!0)}))}_onKeydown(e){e.stopPropagation(),e.metaKey&&e.shiftKey&&(e.preventDefault(),"/"===e.key&&this._codeMirror.toggleComment())}async save(e){this._value=this._codeMirror.getValue();const t={value:this._value},n=new CustomEvent("change",{bubbles:!0,composed:!0,detail:t});this._cleanDoc(),this.dispatchEvent(n)}_cleanDoc(){this._codeMirror.getDoc().markClean(),this.dirty=!1}}void 0===customElements.get("sc-editor")&&customElements.define("sc-editor",ie);void 0===customElements.get("sc-context-menu")&&customElements.define("sc-context-menu",class extends u{static get properties(){return{options:{type:Array},event:{type:Object}}}static get styles(){return a.iv`
      :host {
        display: inline-block;
        box-sizing: border-box;
        font-size: 0 !important;
        height: auto;
        width: 250px;
        display: block;
/*        background-color: rgba(0, 0, 0, 0.8);*/
        background-color: var(--sc-color-primary-1);
        border-radius: 2px;
        border: 1px solid var(--sc-color-primary-4);
        box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.2);
        position: fixed;
        font-size: var(--sc-font-size);
        color: white;
      }

      ul {
        list-style-type: none;
        padding: 5px;
      }

      li {
        font-size: calc(var(--sc-font-size) - 1px);
        color: white;
        padding: 4px 6px;
        color: white;
        border-radius: 1px;
        cursor: default;
      }

      li:hover {
        background-color: var(--sc-color-secondary-2);
        /* rgb(97, 141, 201); */
      }

      li:active {
        background-color: rgb(97, 141, 201, 0.5);
      }
    `}constructor(){super(),this.options=[],this.event=null,this._triggerClose=this._triggerClose.bind(this)}render(){return a.dy`
      <ul>
      ${this.options.map((e=>a.dy`
        <li @click="${t=>this._triggerEvent(t,e.action)}">${e.label}</li>
      `))}
      </ul>
    `}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._triggerClose),document.addEventListener("contextmenu",this._triggerClose),this.style.left=`${this.event.clientX}px`,this.style.top=`${this.event.clientY}px`}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._triggerClose),document.removeEventListener("contextmenu",this._triggerClose)}_triggerEvent(e,t){const n=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:t}});this.dispatchEvent(n),this._triggerClose(e)}_triggerClose(e){e.preventDefault();const t=new CustomEvent("close",{bubbles:!0,composed:!0,detail:null});this.dispatchEvent(t)}});class re extends u{static properties={value:{type:Object},editable:{type:Boolean,reflect:!0},_contextMenuInfos:{type:Object,state:!0},_updateTreeInfos:{type:Object,state:!0}};static styles=a.iv`
    :host {
      display: flex;
      box-sizing: border-box;
      font-size: 0 !important;
      flex-direction: row;
      display: inline-block;
      overflow: auto;
      color: #cccccc;
      padding: 10px 0;
      width: 300px;
      height: 150px;
      margin: 0;
      padding: 0;
      position: relative;

      background-color: var(--sc-color-primary-2);
      --sc-filetree-hover-background-color: var(--sc-color-primary-3);
      --sc-filetree-active-background-color: var(--sc-color-primary-4);
    }

    :host([hidden]) {
      display: none
    }

    ul {
      font-size: 11px;
      list-style: none;
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }

    li {
      cursor: default;
      position: relative;
      min-height: 22px;
      vertical-align: middle;
    }

    li span {
      height: 22px;
      line-height: 22px;
      display: inline-block;
    }

    li .hover, li .hover-bg {
      position: absolute;
      top: 0;
      left: 0;
      height: 22px;
      width: 100%;
      background-color: transparent;
      z-index: 0;
    }

    li .content {
      position: relative;
      z-index: 1;
    }

    li .hover {
      z-index: 2;
    }

    li.trigger-context-menu .hover + .hover-bg {
      background-color: var(--sc-filetree-hover-background-color);
    }

    li .hover:hover + .hover-bg {
      background-color: var(--sc-filetree-hover-background-color);
    }

    li.active > .hover-bg, li.active .hover:hover + .hover-bg {
      background-color: var(--sc-filetree-active-background-color);
    }

    li.directory + li {
      display: none;
    }

    li.open + li {
      display: block;
    }

    li.directory::before {
      content: '';
      display: inline-block;
      position: absolute;
      top: 7px;
      font-size: 0;
      width: 0px;
      height: 0px;
      border-left: 7px solid white;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      z-index: 1;
    }

    li.directory.open::before {
      top: 9px;
      border-top: 6px solid white;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
    }

    /** prevent hover and blur on list */
    .capture-panel {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 9;
    }

    sc-context-menu {
      z-index: 11;
    }

    sc-text {
      width: 100%;
      position: absolute;
      z-index: 10;
      left: 0;
      bottom: 0;
    }
  `;get editable(){return this._editable}set editable(e){const t=this._editable;this._contextMenuInfos=null,this._updateTreeInfos=null,this._editable=e,this.requestUpdate("editable",t)}constructor(){super(),this._contextMenuInfos=null,this._updateTreeInfos=null,this._editable=!1,this.value=null,this.editable=!1,this._currentActive=null}_renderNode(e,t){if(!e)return a.Ld;const n={directory:"directory"===e.type,open:0===t};return a.dy`
      <li
        style="text-indent: ${16*t+6}px;"
        class=${m(n)}
        @click=${t=>this._onItemClick(t,e)}
        @contextmenu=${t=>this._showContextMenu(t,e)}
      >
        <div class="hover"></div>
        <div class="hover-bg"></div><!-- must be after .hover -->
        <div class="content">
          <span style="
            text-indent: ${"directory"===e.type?16:0}px;
          ">${e.name}</span>
        </div>
      </li>
      ${"directory"===e.type?a.dy`
          <li>
            <ul>
              ${e.children.map((e=>this._renderNode(e,t+1)))}
            </ul>
          </li>
        `:a.Ld}
    `}render(){return a.dy`
      ${null!==this._contextMenuInfos?a.dy`
            <div class="capture-panel"></div>
            <sc-context-menu
              .event=${this._contextMenuInfos.event}
              .options=${this._contextMenuInfos.options}
              @close=${this._hideContextMenu}
              @input=${this._onContextMenuCommand}
            ></sc-context-menu>`:a.Ld}
      ${null!==this._updateTreeInfos?a.dy`
            <sc-text
              editable
              @input=${e=>e.stopPropagation()}
              @change=${this._onTreeChange}
            >${"rename"===this._updateTreeInfos.command?this._updateTreeInfos.node.name:""}</sc-text>
        `:a.Ld}
      <ul>
        ${this._renderNode(this.value,0)}
      </ul>
    `}updated(){if(super.updated(),this._updateTreeInfos){const e=this.shadowRoot.querySelector("sc-text");setTimeout((()=>{e.focus();const t=window.getSelection(),n=document.createRange();n.selectNodeContents(e),t.removeAllRanges(),t.addRange(n)}),0)}}_onItemClick(e,t){e.stopPropagation(),"directory"===t.type&&e.currentTarget.classList.toggle("open"),this._setActive(e.currentTarget);const n=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:t}});this.dispatchEvent(n)}_onTreeChange(e){e.stopPropagation();const t=e.detail.value,{node:n,command:i}=this._updateTreeInfos,r=e.detail.value.trim().replace("\n",""),a={command:i};switch(i){case"mkdir":case"writeFile":a.pathname=`${n.path}/${r}`;break;case"rename":a.oldPathname=n.path,a.newPathname=n.path.replace(n.name,t)}const o=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:a}});this.dispatchEvent(o),this._updateTreeInfos=null}_onContextMenuCommand(e){e.stopPropagation(),this._setActive(this._contextMenuInfos.$el);const t=e.detail.value;switch(t){case"rm":{const e=this._contextMenuInfos.node.path,n=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:{command:t,pathname:e}}});this.dispatchEvent(n);break}case"mkdir":case"writeFile":case"rename":{const{node:e}=this._contextMenuInfos;this._updateTreeInfos={node:e,command:t}}}}_setActive(e){this._currentActive&&this._currentActive.classList.toggle("active"),e.classList.toggle("active"),this._currentActive=e}_showContextMenu(e,t){if(e.preventDefault(),e.stopPropagation(),!this.editable)return;if(null!==this._contextMenuInfos)return;const n=e.currentTarget;let i=null;i="directory"===t.type?[{action:"writeFile",label:"New File"},{action:"rename",label:"Rename..."},{action:"mkdir",label:"New Folder..."},{action:"rm",label:"Delete Folder"}]:[{action:"rename",label:"Rename..."},{action:"rm",label:"Delete File"}],n.classList.add("trigger-context-menu"),this._contextMenuInfos={event:e,$el:n,node:t,options:i}}_hideContextMenu(){this._contextMenuInfos.$el.classList.remove("trigger-context-menu"),this._contextMenuInfos=null}}void 0===customElements.get("sc-filetree")&&customElements.define("sc-filetree",re);class ae extends u{static properties={duration:{type:Number,reflect:!0},active:{type:Number}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      width: 100px;
      height: 30px;
      background-color: var(--sc-color-primary-1);
      border: 1px solid var(--sc-color-primary-3);

      --sc-flash-active: var(--sc-color-secondary-3);
    }

    div {
      width: 100%;
      height: 100%;
    }

    div.active {
      background-color: var(--sc-flash-active);
    }
  `;constructor(){super(),this.duration=.05,this.active=!1,this._timeoutId=null}render(){return this.active&&(clearTimeout(this._timeoutId),this._timeoutId=setTimeout((()=>this.active=!1),1e3*this.duration)),a.dy`<div class="${this.active?"active":""}"></div>`}}void 0===customElements.get("sc-flash")&&customElements.define("sc-flash",ae);var oe=n(1402);const se=[0,2,4,5,7,9,11],le=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];class ce extends u{static properties={offset:{type:Number,reflect:!0},range:{type:Number,reflect:!0},mode:{type:String,reflect:!0},inputMode:{type:String,reflect:!0,attribute:"input-mode"},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      width: 300px;
      height: 80px;
      background-color: white;
      border-top: 1px solid var(--sc-color-primary-3);

      --sc-keyboard-active-key: var(--sc-color-secondary-2);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border-top: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
    }

    rect {
      stroke: black;
      shape-rendering: crispedges;
    }

    rect.white {
      fill: white;
    }

    rect.black {
      fill: black;
    }

    rect.active {
      fill: var(--sc-keyboard-active-key);
    }
  `;get offset(){return this._offset}set offset(e){e<0?console.warn("sc-keyboard: offset should be >= 0"):(this._offset=e,this.requestUpdate())}get range(){return this._range}set range(e){e<=0?console.warn("sc-keyboard: range should be > 0"):(this._range=e,this.requestUpdate())}get inputMode(){return this._inputMode}set inputMode(e){"reactive"===e||"stateful"===e?(this._inputMode=e,this._clear(),this.requestUpdate()):console.warn('sc-keyboard: input-mode should be either "reactive" or "statefull"')}get mode(){return this._mode}set mode(e){"monophonic"===e||"polyphonic"===e?(this._mode=e,this._clear(),this.requestUpdate()):console.warn('sc-keyboard: input-mode should be either "monophonic" or "polyphonic"')}get midiType(){return"instrument"}set midiValue(e){const[t,n,i]=e;this.shadowRoot.querySelector(`[data-midi-note="${n}"]`)&&(128===t?this._handleKeyRelease(n,0):144===t&&this._handleKeyPress(n,i))}get midiValue(){return null}constructor(){super(),this._width=300,this._height=80,this._currentNotes=new Map,this.offset=48,this.range=24,this.mode="polyphonic",this.inputMode="reactive",this.disabled=!1,this._keyboardOctava=null,this._keyboardKeys=["KeyA","KeyW","KeyS","KeyE","KeyD","KeyF","KeyT","KeyG","KeyY","KeyH","KeyU","KeyJ","KeyK"],this._keyboard=new f(this,{filterCodes:[...this._keyboardKeys,"ArrowUp","ArrowRight","ArrowBottom","ArrowLeft"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){super.render();let e=this.offset,t=e+this.range,n=0;for(let i=e;i<t;i++)se.includes(i%12)&&(n+=1);const i=this._width,r=this._height,o=i/n;let s=[],l=[],c=null,d=se.includes(e%12)?0:-.35;for(let n=e;n<t;n++){const t=se.includes(n%12);n>e&&(t&&c?d+=1:!t&&c?d+=.65:t&&!c&&(d+=.35)),c=t,t?s.push(a.YP`
          <rect
            data-midi-note=${n}
            class="white ${this._currentNotes.has(n)?"active":""}"
            x=${d*o}
            y=0
            width=${o}
            height=${r}
          ></rect>

        `):l.push(a.YP`
          <rect
            data-midi-note=${n}
            class="black ${this._currentNotes.has(n)?"active":""}"
            x=${d*o}
            y=0
            width=${.7*o}
            height=${.65*r}
          ></rect>
        `)}return a.dy`
      <svg
        @mousedown=${this._onPointerDown}
        @touchstart=${this._onPointerDown}
        @mouseup=${this._onPointerUp}
        @touchend=${this._onPointerUp}
      >
        ${s}
        ${l}
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0,this._resizeObserver=new ResizeObserver((e=>{const t=e[0],{width:n,height:i}=t.contentRect;this._width=n,this._height=i,this.requestUpdate()})),this._resizeObserver.observe(this)}disconnectedCallback(){this._resizeObserver.disconnect(),super.disconnectedCallback()}_onKeyboardEvent(e){if(null===this._keyboardOctava){let e=0;for(;;){const t=12*e;if(t>=this.offset){this._keyboardOctava=e;break}if(t>127)break;e+=1}}if("ArrowUp"===e.code||"ArrowRight"===e.code)return void("keydown"===e.type&&(this._keyboardOctava+=1));if("ArrowDown"===e.code||"ArrowLeft"===e.code)return void("keydown"===e.type&&(this._keyboardOctava-=1));const t=this._keyboardKeys.indexOf(e.code),n=12*this._keyboardOctava+t;"keydown"===e.type?this._handleKeyPress(n,127):this._handleKeyRelease(n,0)}_onPointerDown(e){if(e.stopPropagation(),this.disabled)return;const t=e.target,n=parseInt(t.dataset.midiNote),{top:i,height:r}=t.getBoundingClientRect(),a=(r-(e.clientY-i))/r,o=Math.round(127*a);this._handleKeyPress(n,o)}_onPointerUp(e){if(e.stopPropagation(),this.disabled)return;const t=e.target,n=parseInt(t.dataset.midiNote);this._handleKeyRelease(n,0)}_clear(){for(let[e,t]of this._currentNotes.entries())this._triggerNoteOff(e,0);this._currentNotes.clear()}_handleKeyPress(e,t){switch(this.inputMode){case"reactive":"monophonic"===this.mode&&this._clear(),this._triggerNoteOn(e,t);break;case"stateful":switch(this.mode){case"monophonic":{const n=!this._currentNotes.has(e);this._clear(),n&&this._triggerNoteOn(e,t);break}case"polyphonic":this._currentNotes.has(e)?this._triggerNoteOff(e,0):this._triggerNoteOn(e,t)}}}_handleKeyRelease(e,t){"stateful"!==this.inputMode&&this._triggerNoteOff(e,t)}_triggerNoteOn(e,t){const n=le[e%12],i=(0,oe.IF)(e),r=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:{type:"note-on",midiNote:e,velocity:t,name:n,frequency:i}}});this.dispatchEvent(r),this._currentNotes.set(e,t),this.requestUpdate()}_triggerNoteOff(e,t){const n=le[e%12],i=(0,oe.IF)(e),r=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:{type:"note-off",midiNote:e,velocity:t,name:n,frequency:i}}});this.dispatchEvent(r),this._currentNotes.delete(e),this.requestUpdate()}}const de=h("ScKeyboard",ce);void 0===customElements.get("sc-keyboard")&&customElements.define("sc-keyboard",de);class ue extends u{static properties={active:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border: 1px solid var(--sc-color-primary-3);
      background-color: var(--sc-color-primary-2);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
      stroke: #ffffff;
      fill: #ffffff;
    }

    svg.active {
      background-color: var(--sc-color-primary-1);
      stroke: var(--sc-color-secondary-5);
      fill: var(--sc-color-secondary-5);
    }

    path {
      stroke-width: 10;
      fill: none;
    }
  `;get value(){return this.active}set value(e){this.active=e}constructor(){super(),this.active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){const e=this._size-2;return a.dy`
      <svg
        class="${this.active?"active":""}"
        style="
          width: ${e}px;
          height: ${e}px;
        "
        viewbox="-10 -8 120 120"
        @mousedown=${this._onInput}
        @touchstart=${this._onInput}
      >
        <path
          d="M 30,20
            L 70,20
            C 75,20 80,25 80,30
            L 80,70
            C 80,75 75,80 70,80
            L 60,80
            M 40,80
            L 30,80
            C 25,80 20,75 20,70
            L 20,30
            C 20,25 25,20 30,20
          "
        ></path>
        <polygon points="45,80 60,65 60,95"></polygon>
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||"keydown"===e.type&&(this.active=!this.active,this._dispatchChangeEvent())}_onInput(e){e.preventDefault(),this.disabled||(this.focus(),this.active=!this.active,this._dispatchChangeEvent())}_dispatchChangeEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.active}});this.dispatchEvent(e),this.requestUpdate()}}function*_e(e,t,n=1){const i=void 0===t?0:e;null!=t||(t=e);for(let e=i;n>0?e<t:t<e;e+=n)yield e}void 0===customElements.get("sc-loop")&&customElements.define("sc-loop",ue);class pe extends u{static properties={columns:{type:Number,reflect:!0},rows:{type:Number,reflect:!0},states:{type:Array},value:{type:Array},reset:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      box-sizing: border-box;
      width: 300px;
      height: 150px;
      vertical-align: top;
      display: inline-block;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);

      --sc-matrix-cell-color: #ffffff;
      --sc-matrix-cell-border: var(--sc-color-primary-4);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    rect {
      fill: var(--sc-matrix-cell-color);
      shape-rendering: crispedges;
    }

    line {
      stroke: var(--sc-matrix-cell-border);
      shape-rendering: crispedges;
    }

    rect.keyboard-nav-cell {
      fill: var(--sc-color-secondary-5);
      shape-rendering: crispedges;
      pointer-events: none;
    }
  `;set rows(e){e<1?console.warn("sc-matrix: Invalid value for rows, should be >= 1"):(this._rows=e,this._resizeMatrix())}get rows(){return this._rows}set columns(e){e<1?console.warn("sc-matrix: Invalid value for columns, should be >= 1"):(this._columns=e,this._resizeMatrix())}get columns(){return this._columns}set value(e){this._value=e,this._rows=this._value.length,this._columns=this._value[0].length,this.requestUpdate()}get value(){return this._value}set reset(e){this._reset()}get reset(){}set states(e){this._states=e;for(let e=0;e<this._value.length;e++){const t=this._value[e];for(let n=0;n<t.length;n++){const i=t[n];if(-1===this._states.indexOf(i)){const t=this.states.reduce(((e,t)=>Math.abs(t-i)<Math.abs(e-i)?t:e));this._value[e][n]=t}}}this._emitChange(),this.requestUpdate()}get states(){return this._states}constructor(){super(),this._value=[],this._states=[0,1],this._width=300,this._height=200,this._resizeObserver=null,this.columns=8,this.rows=4,this.disabled=!1,this._keyboardHighlightCell=null,this._onFocus=this._onFocus.bind(this),this._onBlur=this._onBlur.bind(this),this.keyboard=new f(this,{filterCodes:["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","Space","Enter","Escape","Backspace"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){const e=this._width/this.columns,t=this._height/this.rows,n=this._states[0],i=this._states[this._states.length-1];let o=null;return null!==this._keyboardHighlightCell&&(o=a.YP`
        <rect
          class="keyboard-nav-cell"
          width=${e}
          height=${t}
          x=${this._keyboardHighlightCell.x*e}
          y=${this._keyboardHighlightCell.y*t}
          opacity="0.4"
        ></rect>
      `),a.dy`
      <svg
        @mousedown=${e=>e.preventDefault()}
        @touchstart=${e=>e.preventDefault()}
      >
        <g>
          ${this.value.map(((r,o)=>{const s=o*t;return r.map(((r,l)=>{const c=l*e,d=(r-n)/(i-n);return a.YP`
                <rect
                  width=${e}
                  height=${t}
                  x=${c}
                  y=${s}
                  style="fill-opacity: ${d}"
                  data-row-index=${o}
                  data-column-index=${l}
                  @mousedown=${this._onCellEvent}
                  @touchend=${this._onCellEvent}
                ></rect>
              `}))}))}
        </g>
        <!-- keyboard controlled highligth cell -->
        ${o?a.YP`<g>${o}</g>`:a.Ld}
        <g>
          <!-- horizontal lines -->
          ${r(_e(1,this.value.length),(e=>{const n=e*t;return a.YP`<line x1="0" y1=${n} x2=${this._width} y2=${n}></line>`}))}

          <!-- vertical lines -->
          ${r(_e(1,this.value[0].length),(t=>{const n=t*e;return a.YP`<line x1=${n} y1="0" x2=${n} y2=${this._height}></line>`}))}
        <g>
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0,this._resizeObserver=new ResizeObserver((e=>{const t=this.shadowRoot.querySelector("svg"),{width:n,height:i}=t.getBoundingClientRect();this._width=n,this._height=i,this.requestUpdate()})),this._resizeObserver.observe(this),this.addEventListener("focus",this._onFocus),this.addEventListener("blur",this._onBlur)}disconnectedCallback(){this._resizeObserver.disconnect(),this.removeEventListener("focus",this._onFocus),this.removeEventListener("blur",this._onBlur),super.disconnectedCallback()}_resizeMatrix(){const e=this.value;for(let t=e.length-1;t>=this.rows;t--)e.splice(t,1);e.forEach((e=>{for(let t=e.length-1;t>=this.columns;t--)e.splice(t,1)}));const t=e.length;for(let n=0;n<this.rows;n++)if(n<t)e.forEach((e=>{for(let t=e.length;t<this.columns;t++)e[t]=this._states[0]}));else{const t=new Array(this.columns).fill(this._states[0]);e[n]=t}this.requestUpdate()}_onFocus(){this._keyboardHighlightCell=null,this.requestUpdate()}_onBlur(){this._keyboardHighlightCell=null,this.requestUpdate()}_onKeyboardEvent(e){if("keydown"===e.type){if(null===this._keyboardHighlightCell)this._keyboardHighlightCell={x:0,y:this.rows-1};else switch(e.code){case"ArrowUp":this._keyboardHighlightCell.y-=1;break;case"ArrowRight":this._keyboardHighlightCell.x+=1;break;case"ArrowDown":this._keyboardHighlightCell.y+=1;break;case"ArrowLeft":this._keyboardHighlightCell.x-=1;break;case"Space":case"Enter":{const e=this._keyboardHighlightCell.y,t=this._keyboardHighlightCell.x;this._updateCell(e,t);break}case"Escape":case"Backspace":this._reset()}this._keyboardHighlightCell.y<0&&(this._keyboardHighlightCell.y=this.rows-1),this._keyboardHighlightCell.y>=this.rows&&(this._keyboardHighlightCell.y=0),this._keyboardHighlightCell.x<0&&(this._keyboardHighlightCell.x=this.columns-1),this._keyboardHighlightCell.x>=this.columns&&(this._keyboardHighlightCell.x=0),this.requestUpdate()}}_reset(){this._value.forEach((e=>{for(let t=0;t<e.length;t++)e[t]=this._states[0]})),this.requestUpdate(),this._emitChange()}_onCellEvent(e){if(e.preventDefault(),this.disabled)return;this.focus();const{rowIndex:t,columnIndex:n}=e.target.dataset;this._updateCell(t,n)}_updateCell(e,t){const n=this._states.indexOf(this.value[e][t]),i=-1===n?0:(n+1)%this._states.length;this.value[e][t]=this._states[i],this._emitChange(),this.requestUpdate()}_emitChange(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}void 0===customElements.get("sc-matrix")&&customElements.define("sc-matrix",pe);const me=Symbol.for("sc-midi");function ge(e){return`${e.manufacturer}${e.name}`}function he(e){return{id:e.id,manufacturer:e.manufacturer,name:e.name}}function fe(e){return e.manufacturer?`${e.name} (${e.manufacturer})`:`${e.name}`}function Ee(e,t=null){return{device:he(e),deviceString:fe(e),channel:t}}function Se(e){return e.id||e._scId}globalThis[me]||(globalThis[me]=new Set);class be extends u{static properties={active:{type:Boolean,reflect:!0},_devices:{state:!0},_connected:{type:Boolean,state:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      overflow: hidden;
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      width: 80px;
      height: 30px;

      background-color: var(--sc-color-primary-3);
      border: 1px solid var(--sc-color-primary-3);

      --sc-midi-panel-position-top: 0;
      --sc-midi-panel-position-right: 0;
      --sc-midi-panel-position-bottom: auto;
      --sc-midi-panel-position-left: auto;
      --sc-midi-panel-position-width: 300px;
      --sc-midi-panel-position-height: auto;
    }

    :host([hidden]) {
      display: none;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    :host([active]) {
      background-color: var(--sc-color-secondary-3);
      border: 1px solid var(--sc-color-secondary-3);
    }

    .button {
      width: 100%;
      height: 100%;
      display: flex;
      flex-orientation: row;
      justify-content: space-between;
      background-color: transparent;
      cursor: pointer;
      border: none;
    }

    .button sc-text, .button sc-icon {
      background: transparent;
      border: none;
      height: 100%;
    }

    .button sc-text {
      user-select: none;
      webkit-user-select: none;
      webkit-touch-callout: none;
    }

    .button sc-text {
      width: 40px;
    }

    .button sc-icon {
      opacity: 0.6;
    }

    .button.connected sc-icon {
      opacity: 1;
    }

    .control-panel {
      position: fixed;
      top: var(--sc-midi-panel-position-top);
      right: var(--sc-midi-panel-position-right);;
      bottom: var(--sc-midi-panel-position-bottom);;
      left: var(--sc-midi-panel-position-left);
      width: var(--sc-midi-panel-position-width);
      height: var(--sc-midi-panel-position-height);
      box-sizing: border-box;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
      z-index: 50;
      overflow-y: auto;
    }

    .control-panel .header {
      display: flex;
      padding: 4px 0;
      background-color: var(--sc-color-primary-1);
    }

    .control-panel .header sc-text {
      width: 80%;
    }

    .control-panel .header sc-icon {
      background-color: var(--sc-color-primary-1);
      border: none;
    }

    .device-bindings {
      margin-top: 12px;
    }

    .device-bindings .title {
      display: flex;
    }

    .device-bindings .title sc-text {
      background-color: var(--sc-color-primary-3);
      width: 100%;
    }

    .device-bindings.disconnected {
      font-style: italic;
      opacity: 0.6;
    }

    .binding-item {
      display: flex;
      flex-orientation: row;
      justify-content: space-between;
      border-bottom: 1px solid var(--sc-color-primary-3);
    }

    .binding-item.not-in-dom {
      font-style: italic;
      opacity: 0.6;
    }

    /* channel */
    .binding-item > sc-text.channel {
      width: 60px;
      border-right: 1px solid var(--sc-color-primary-4);
    }

    /* id */
    .binding-item.control > sc-text.node-id {
      width: 80%;
    }

    .binding-item.instrument > sc-text.node-id {
      width: 100%;
    }
  `;constructor(){super(),this._devices=new Map,this._knownDevices=new Map,this._$nodes=new Map,this._controlBindings=new Map,this._instrumentBindings=new Map,this._$selectedNode=null,this._mutationObserver=null,this.active=!1,this._processMidiMessage=this._processMidiMessage.bind(this),this._onSelectNode=this._onSelectNode.bind(this),this._updateNodeList=this._updateNodeList.bind(this),this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0}),this._loadFromLocalStorage()}render(){const e={button:!0,connected:this._devices.size>0};return a.dy`
      <div
        class="${m(e)}"
        @click=${this._toggleActive}
      >
        <sc-icon type="midi" disabled></sc-icon>
        <sc-text>MIDI</sc-text>
      </div>

      ${this.active?a.dy`
          <div class="control-panel">
            <div class="header">
              <sc-icon type="midi"></sc-icon>
              <sc-text>MIDI bindings</sc-text>
              <sc-icon
                class="close"
                type="close"
                @input=${this._toggleActive}
              >close</sc-icon>
            </div>

            <div class="select-interface">
              ${z(this._knownDevices,(([e,t])=>e),(([e,t])=>{const n=this._devices.has(e),i=this._controlBindings.get(e),r=this._instrumentBindings.get(e),o=[];if(i)for(let[t,n]of i.entries())n.forEach((n=>{const i=this._$nodes.has(n),r=a.dy`
                        <div
                          class="binding-item control ${i?"":"not-in-dom"}"
                          @mouseover=${e=>this._highlightElement(n)}
                          @mouseout=${e=>this._unhighlightElement(n)}
                        >
                          <sc-text class="channel">cc ${t}</sc-text>
                          <sc-text class="node-id">${n}</sc-text>
                          <sc-icon
                            type="delete"
                            @input=${i=>this._deleteControlBinding(e,t,n)}
                          ></sc-icon>
                        </div>
                      `;o.push(r)}));return r&&r.forEach((t=>{const n=this._$nodes.has(t),i=a.dy`
                      <div
                        class="binding-item instrument ${n?"":"not-in-dom"}"
                        @mouseover=${e=>this._highlightElement(t)}
                        @mouseout=${e=>this._unhighlightElement(t)}
                      >
                        <sc-text class="node-id">${t}</sc-text>
                        <sc-icon
                          type="delete"
                          @input=${n=>this._deleteInstrumentBinding(e,t)}
                        ></sc-icon>
                      </div>
                    `;o.push(i)})),a.dy`
                  <div class="device-bindings ${n?"":"disconnected"}">
                    <div class="title">
                      <sc-text>${fe(t)}</sc-text>
                      <sc-icon type="delete" @input=${t=>this._deleteDevice(e)}></sc-icon>
                    </div>
                    ${o}
                  </div>
                `}))}
            </div>
          </div>
        `:a.Ld}
    `}async connectedCallback(){super.connectedCallback();const e=await navigator.requestMIDIAccess();e.addEventListener("statechange",(e=>{"input"===e.port.type&&this._updateDeviceList(e.currentTarget.inputs)})),this._updateDeviceList(e.inputs),this._mutationObserver=new MutationObserver(this._updateNodeList),this._mutationObserver.observe(document.body,{subtree:!0,childList:!0}),this._updateNodeList(),this.hasAttribute("tabindex")||this.setAttribute("tabindex",0)}disconnectedCallback(){this._mutationObserver.disconnect()}_onKeyboardEvent(e){"keydown"===e.type&&this._toggleActive()}_updateNodeList(){const e=Array.from(globalThis[me]),t=document.querySelectorAll(e.join(","));this._$nodes.clear(),t.forEach((e=>{const t=Se(e);this._$nodes.set(t,e)}));for(let[e,t]of this._controlBindings.entries()){const n=this._knownDevices.get(e);for(let[e,i]of t.entries())i.forEach((t=>{if(this._$nodes.has(t)){const i=this._$nodes.get(t),r=Ee(n,e);i.midiControlInfos=r}}))}for(let[e,t]of this._instrumentBindings.entries()){const n=this._knownDevices.get(e);t.forEach((e=>{if(this._$nodes.has(e)){const t=this._$nodes.get(e),i=Ee(n);t.midiControlInfos=i}}))}this._toggleLearnableElements()}_updateDeviceList(e){for(let[t,n]of e.entries()){const e=ge(n);this._devices.has(e)||(n.addEventListener("midimessage",this._processMidiMessage),this._devices.set(e,n),this._knownDevices.set(e,he(n)))}for(let[t,n]of this._devices.entries()){let i=!1;for(let[n,r]of e.entries())ge(r)===t&&(i=!0);i||(n.removeEventListener("midimessage",this._processMidiMessage),this._devices.delete(t))}this._persistToLocalStorage(),this.requestUpdate()}_toggleActive(){this.active=!this.active,null!==this._$selectedNode&&(this._$selectedNode.midiLearnSelected=!1,this._$selectedNode=null),this._toggleLearnableElements()}_toggleLearnableElements(){this.active?this._$nodes.forEach((e=>{e.midiLearnActive=!0,e.addEventListener("click",this._onSelectNode)})):this._$nodes.forEach((e=>{e.midiLearnActive=!1,e.removeEventListener("click",this._onSelectNode)}))}_highlightElement(e){this._$nodes.has(e)&&(this._$nodes.get(e).midiControlHighlight=!0)}_unhighlightElement(e){this._$nodes.has(e)&&(this._$nodes.get(e).midiControlHighlight=!1)}_onSelectNode(e){const t=e.currentTarget;this._$nodes.forEach((e=>{e!==t&&(e.midiLearnSelected=!1)})),t.midiLearnSelected?(t.midiLearnSelected=!1,this._$selectedNode=null):(t.midiLearnSelected=!0,this._$selectedNode=t)}_processMidiMessage(e){const t=e.currentTarget,n=ge(t),i=e.data[0];let r;if(i>=128&&i<144)r="note-off";else if(i>=144&&i<160)r="note-on";else{if(!(i>=176&&i<192))return;r="control"}if(this.active&&null!==this._$selectedNode){if("control"===r&&"instrument"===this._$selectedNode.midiType)return void console.warn("sc-midi: cannot bind control to instrument");if("control"!==r&&"control"===this._$selectedNode.midiType)return void console.warn("sc-midi: cannot bind instrument to control");if("control"===r){const i=e.data[1];this._controlBindings.has(n)||this._controlBindings.set(n,new Map);const r=this._controlBindings.get(n);r.has(i)||r.set(i,new Set);const a=r.get(i),o=Se(this._$selectedNode);if(!a.has(o)){if(this._$selectedNode.midiControlInfos){const{device:e,channel:t}=this._$selectedNode.midiControlInfos,n=ge(e);this._deleteControlBinding(n,t,o)}a.add(o);const e=Ee(t,i);this._$selectedNode.midiControlInfos=e,this._persistToLocalStorage(),this.requestUpdate()}}else{this._instrumentBindings.has(n)||this._instrumentBindings.set(n,new Set);const e=this._instrumentBindings.get(n),i=Se(this._$selectedNode);if(!e.has(i)){if(this._$selectedNode.midiControlInfos){const{device:e}=this._$selectedNode.midiControlInfos,t=ge(e),n=Se(this._$selectedNode);this._deleteInstrumentBinding(t,n)}e.add(i);const n=Ee(t);this._$selectedNode.midiControlInfos=n,this._persistToLocalStorage(),this.requestUpdate()}}}if("control"===r&&this._controlBindings.has(n)){const t=e.data[1],i=e.data[2],r=this._controlBindings.get(n);r.has(t)&&r.get(t).forEach((e=>{this._$nodes.has(e)&&(this._$nodes.get(e).midiValue=i)}))}if("control"!==r&&this._instrumentBindings.has(n)){const t=["note-on"===r?144:128,e.data[1],e.data[2]];this._instrumentBindings.get(n).forEach((e=>{this._$nodes.has(e)&&(this._$nodes.get(e).midiValue=t)}))}}_deleteControlBinding(e,t,n){if(this._controlBindings.get(e).get(t).delete(n),this._$nodes.has(n)){const e=this._$nodes.get(n);e.midiControlInfos=null,e.midiControlHighlight=null}this._persistToLocalStorage(),this.requestUpdate()}_deleteInstrumentBinding(e,t){if(this._instrumentBindings.get(e).delete(t),this._$nodes.has(t)){const e=this._$nodes.get(t);e.midiControlInfos=null,e.midiControlHighlight=null}this._persistToLocalStorage(),this.requestUpdate()}_deleteDevice(e){const t=this._devices.has(e),n=[];if(this._controlBindings.has(e)){const t=this._controlBindings.get(e);for(let[e,i]of t.entries())i.forEach((e=>n.push(e)))}this._instrumentBindings.has(e)&&this._instrumentBindings.get(e).forEach((e=>n.push(e))),t||this._knownDevices.delete(e),this._controlBindings.delete(e),this._instrumentBindings.delete(e),n.forEach((e=>{this._$nodes.has(e)&&(this._$nodes.get(e).midiControlInfos=null)})),this._persistToLocalStorage(),this.requestUpdate()}_serialize(){const e=Object.fromEntries(this._knownDevices.entries()),t={};for(let[e,n]of this._controlBindings.entries()){t[e]={};for(let[i,r]of n.entries())t[e][i]=Array.from(r)}const n={};for(let[e,t]of this._instrumentBindings.entries())n[e]=Array.from(t);return JSON.stringify({knownDevices:e,controlBindings:t,instrumentBindings:n})}_deserialize(e){let t;try{t=JSON.parse(e)}catch(e){console.warn("Malformed stored data for sc-midi")}const n=new Map,i=new Map,r=new Map;if(t){for(let e in t.knownDevices){const i=t.knownDevices[e];n.set(e,i)}for(let e in t.controlBindings){i.set(e,new Map);const n=t.controlBindings[e],r=i.get(e);for(let e in n){const t=n[e];r.set(parseInt(e),new Set(t))}}for(let e in t.instrumentBindings){const n=t.instrumentBindings[e];r.set(e,new Set(n))}}return{knownDevices:n,controlBindings:i,instrumentBindings:r}}_persistToLocalStorage(){const e=this._serialize();localStorage.setItem("sc-midi-bindings",e)}_loadFromLocalStorage(){const e=localStorage.getItem("sc-midi-bindings"),{knownDevices:t,controlBindings:n,instrumentBindings:i}=this._deserialize(e);this._knownDevices=t,this._controlBindings=n,this._instrumentBindings=i}}void 0===customElements.get("sc-midi")&&customElements.define("sc-midi",be);class ve extends u{static properties={_active:{type:Boolean,state:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      cursor: pointer;
      width: 30px;
      height: 30px;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
      fill: #ffffff;
      stroke: #ffffff;
    }

    svg.active {
      background-color: var(--sc-color-primary-1);
      fill: var(--sc-color-secondary-4);
      stroke: var(--sc-color-secondary-4);
    }

    path {
      stroke-width: 10;
      fill-opacity: 0;
    }
  `;constructor(){super(),this._active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <svg
        class="${this._active?"active":""}"
        viewbox="-10 -8 120 120"
        @mousedown="${this._onInput}"
        @touchstart="${this._onInput}"
        @mouseup="${this._onRelease}"
        @touchend="${this._onRelease}"
      >
        <path d="M 80,20L 80,80"></path>
        <polygon points="20,20 70,50 20,80"></polygon>
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){"keydown"===e.type?this._onInput(e):"keyup"===e.type&&this._onRelease()}_onInput(e){e.preventDefault(),this.disabled||(this.focus(),this._active=!0,this._dispatchEvent())}_onRelease(e){this._active=!1}_dispatchEvent(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this._active}});this.dispatchEvent(e)}}function Te(e,t){return void 0===t&&(t=15),+parseFloat(Number(e).toPrecision(t))}function Ce(e){var t=e.toString().split(/[eE]/),n=(t[0].split(".")[1]||"").length-+(t[1]||0);return n>0?n:0}function ye(e){if(-1===e.toString().indexOf("e"))return Number(e.toString().replace(".",""));var t=Ce(e);return t>0?Te(Number(e)*Math.pow(10,t)):Number(e)}function Ne(e){De&&(e>Number.MAX_SAFE_INTEGER||e<Number.MIN_SAFE_INTEGER)&&console.warn(e+" is beyond boundary when transfer to integer, the results may not be accurate")}function Re(e){return function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];var i=t[0];return t.slice(1).reduce((function(t,n){return e(t,n)}),i)}}customElements.define("sc-next",ve);var Oe=Re((function(e,t){var n=ye(e),i=ye(t),r=Ce(e)+Ce(t),a=n*i;return Ne(a),a/Math.pow(10,r)})),Ae=Re((function(e,t){var n=Math.pow(10,Math.max(Ce(e),Ce(t)));return(Oe(e,n)+Oe(t,n))/n})),Ie=Re((function(e,t){var n=Math.pow(10,Math.max(Ce(e),Ce(t)));return(Oe(e,n)-Oe(t,n))/n})),xe=Re((function(e,t){var n=ye(e),i=ye(t);return Ne(n),Ne(i),Oe(n/i,Te(Math.pow(10,Ce(t)-Ce(e))))})),De=!0;const we={strip:Te,plus:Ae,minus:Ie,times:Oe,divide:xe,round:function(e,t){var n=Math.pow(10,t),i=xe(Math.round(Math.abs(Oe(e,n))),n);return e<0&&0!==i&&(i=Oe(i,-1)),i},digitLength:Ce,float2Fixed:ye,enableBoundaryChecking:function(e){void 0===e&&(e=!0),De=e}};class Me extends u{static properties={min:{type:Number,reflect:!0},max:{type:Number,reflect:!0},value:{type:Number},integer:{type:Boolean,reflect:!0},readonly:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      vertical-align: top;
      display: inline-block;
      width: 100px;
      height: 30px;
      box-sizing: border-box;
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      color: #ffffff;
      position: relative;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host([hidden]) {
      display: none
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    :host([disabled]:focus), :host([disabled]:focus-visible),
    :host([readonly]:focus), :host([readonly]:focus-visible) {
      outline: none;
      box-shadow: none;
      border: 1px solid var(--sc-color-primary-3);
    }

    .container {
      overflow-y: hidden;
      position: relative;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      user-select: none;
      webkit-user-select: none;
      webkit-touch-callout: none;
    }

    .container:focus {
      outline: none;
    }

    .info {
      width: 15px;
      height: 100%;
      display: inline-block;
      background-color: var(--sc-color-primary-3);
      box-sizing: border-box;
    }

    .container:focus .info {
      outline: 2px solid var(--sc-color-secondary-2);
    }

    :host([disabled]) .container:focus .info,
    :host([readonly]) .container:focus .info {
      outline: none;
    }

    .info.edited {
      background-color: var(--sc-color-primary-4);
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      box-sizing: border-box;
      position: absolute;
      top: 0;
      left: 15px;
      padding-left: 12px;
      height: 100%;
      width: calc(100% - 15px);
    }

    :host([readonly]) .info {
      width: 5px;
      background-color: var(--sc-color-primary-2);
    }

    :host([readonly]) .content {
      left: 5px;
      width: calc(100% - 5px);
    }

    .z {
      display: inline-block;
      vertical-align: top;
      text-align: center;
      position: relative;
      height: 100%;
      display: inline-flex;
      align-items: center;
    }

    /* contains the integer part which can be larger than one character */
    .z:first-child {
      width: auto;
      min-width: 7px;
    }

    /* full width if integer */
    :host([integer]) .z {
      width: 100%;
      text-align: left;
    }

    .z sc-speed-surface {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
    }

    input[type="number"] {
      position: absolute;
      top: 1px;
      left: 1px;
      width: 1px;
      height: 1px;
      padding: 0;
      border: none;
      background-color: var(--sc-color-primary-3);
    }

    input[type="number"]:focus {
      outline: none;
    }
  `;set min(e){this._min=Math.min(e,this._max),this._value<this._min&&(this.value=this._min,this._emitChange())}get min(){return this._min}set max(e){this._max=Math.max(e,this._min),this._value>this._max&&(this.value=this._max,this._emitChange())}get max(){return this._max}set value(e){(e=Math.min(this._max,Math.max(this._min,e)))!==this._value&&(this._value=e,this._displayValue=e.toString(),this.requestUpdate())}get value(){return this._value}constructor(){super(),this._min=-1/0,this._max=1/0,this._value=0,this._displayValue="0",this.integer=!1,this.disabled=!1,this.readonly=!1,this._valueChanged=!1,this._updateValue1=this._updateValueFromPointer(1),this._updateValue01=this._updateValueFromPointer(.1),this._updateValue001=this._updateValueFromPointer(.01),this._updateValue0001=this._updateValueFromPointer(.001),this._updateValue00001=this._updateValueFromPointer(1e-4),this._updateValue000001=this._updateValueFromPointer(1e-5),this._updateValue0000001=this._updateValueFromPointer(1e-6),this._hasVirtualKeyboard=!1,this._numKeyPressed=0,this._onKeyDown=this._onKeyDown.bind(this),this.keyboard=new f(this,{filterCodes:["ArrowUp","ArrowDown"],callback:this._onKeyboardEvent.bind(this)})}render(){const e=this._displayValue.split(".");e[1]||(e[1]=[]);const t=N("&nbsp;"),n={edited:0!==this._numKeyPressed};return a.dy`
      <div
        tabindex="-1"
        class="container"
        @focus="${this._onFocus}"
        @blur="${this._onBlur}"
        @touchstart="${this._handleFocus}"
        @touchend="${this._openVirtualKeyboard}"
      >
        <div class="info ${m(n)}"></div>

        <div class="content">
          <span class="z">
            ${e[0]}
            <sc-speed-surface @input="${this._updateValue1}"></sc-speed-surface>
          </span>
          ${this.integer?a.Ld:a.dy`
              <span class="z">
                .
              </span>
              <span class="z">
                ${e[1][0]||t}
                <sc-speed-surface @input="${this._updateValue01}"></sc-speed-surface>
              </span>
              <span class="z">
                ${e[1][1]||t}
                <sc-speed-surface @input="${this._updateValue001}"></sc-speed-surface>
              </span>
              <span class="z">
                ${e[1][2]||t}
                <sc-speed-surface @input="${this._updateValue0001}"></sc-speed-surface>
              </span>
              <span class="z">
                ${e[1][3]||t}
                <sc-speed-surface @input="${this._updateValue00001}"></sc-speed-surface>
              </span>
              <span class="z">
                ${e[1][4]||t}
                <sc-speed-surface @input="${this._updateValue000001}"></sc-speed-surface>
              </span>
              <span class="z">
                ${e[1][5]||t}
                <sc-speed-surface @input="${this._updateValue0000001}"></sc-speed-surface>
              </span>`}
        </div>
      </div>
    `}updated(e){if(e.has("disabled")||e.has("disabled")){const e=this.disabled||this.readonly?-1:this._tabindex;this.setAttribute("tabindex",e),(this.disabled||this.readonly)&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_handleFocus(e){e.preventDefault(),e.stopPropagation()}_openVirtualKeyboard(e){if(e.preventDefault(),e.stopPropagation(),this._hasVirtualKeyboard)return;if(this.disabled||this.readonly)return;this._hasVirtualKeyboard=!0;const t=document.createElement("input");t.type="number",this.shadowRoot.appendChild(t),t.focus(),t.click(),t.addEventListener("input",(e=>{e.preventDefault(),e.stopPropagation(),e.target.value&&(this.value=parseFloat(e.target.value),this._emitInput())})),t.addEventListener("change",(e=>{e.preventDefault(),e.stopPropagation(),e.target.value&&(this.value=parseFloat(e.target.value)),this.focus(),t.remove(),this._hasVirtualKeyboard=!1,this._emitInput(),this._emitChange()}))}_onFocus(){this._numKeyPressed=0,window.addEventListener("keydown",this._onKeyDown)}_onBlur(){this._updateValueFromDisplayValue(),window.removeEventListener("keydown",this._onKeyDown)}_onKeyboardEvent(e){this.disabled||this.readonly||"keydown"===e.type&&("ArrowUp"===e.code?this.value+=1:this.value-=1,this._emitInput(),this._emitChange())}_onKeyDown(e){if(!this.disabled&&!this.readonly){if(-1!==(this.integer?["0","1","2","3","4","5","6","7","8","9","-"]:["0","1","2","3","4","5","6","7","8","9","-",".",","]).indexOf(e.key)){e.preventDefault(),e.stopPropagation(),0===this._numKeyPressed&&(this._displayValue="");let t=e.key;","===t&&(t="."),this._displayValue+=t,this._numKeyPressed+=1,this.requestUpdate()}"Backspace"!==e.key&&8!==e.which||(e.preventDefault(),e.stopPropagation(),"."===this._displayValue[this._displayValue.length-1]&&(this._displayValue=this._displayValue.substring(0,this._displayValue.length-1)),this._displayValue=this._displayValue.substring(0,this._displayValue.length-1),this._numKeyPressed+=1,this.requestUpdate()),"Enter"!==e.key&&13!==e.which||(e.preventDefault(),e.stopPropagation(),this._updateValueFromDisplayValue())}}_updateValueFromPointer(e){return t=>{if(t.stopPropagation(),!this.disabled&&!this.readonly&&!this._hasVirtualKeyboard){if(null!==t.detail.pointerId){if(Math.abs(t.detail.dy)<.02)return;const n=this._value,i=t.detail.dy<0?-1:1,r=8,a=1.2;let o=Math.pow(Math.abs(t.detail.dy*r),a);o=Math.max(1,o),o*=i,this._value+=e*o,this._value=we.times(Math.round(this._value/e),e),this._value=Math.max(this._min,Math.min(this._max,this._value));const s=this._value.toString().toString().split("."),l=e.toString().split(".")[1];if(l)for(s[1]||(s[1]=[]);s[1].length<l.length;)s[1]+="0";this._displayValue=s.join("."),this._value!==n&&(this._valueChanged=!0,this._emitInput())}else!0===this._valueChanged&&(this._valueChanged=!1,this._emitChange());this.requestUpdate()}}}_updateValueFromDisplayValue(){this._numKeyPressed>0&&(this._value=this.integer?parseInt(this._displayValue):parseFloat(this._displayValue),(this._value<this._min||this._value>this._max)&&(this._value=Math.max(this._min,Math.min(this._max,this._value)),this._displayValue=this._value.toString()),this._numKeyPressed=0,this._emitInput(),this._emitChange(),this.requestUpdate())}_emitInput(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this._value}});this.dispatchEvent(e)}_emitChange(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this._value}});this.dispatchEvent(e)}}void 0===customElements.get("sc-number")&&customElements.define("sc-number",Me);class Le extends u{static properties={_active:{type:Boolean,state:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      cursor: pointer;
      width: 30px;
      height: 30px;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
      fill: #ffffff;
      stroke: #ffffff;
    }

    svg.active {
      background-color: var(--sc-color-primary-1);
      fill: var(--sc-color-secondary-4);
      stroke: var(--sc-color-secondary-4);
    }

    path {
      stroke-width: 10;
      fill-opacity: 0;
    }
  `;constructor(){super(),this._active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <svg
        class="${this._active?"active":""}"
        viewbox="-10 -8 120 120"
        @mousedown="${this._onInput}"
        @touchstart="${this._onInput}"
        @mouseup="${this._onRelease}"
        @touchend="${this._onRelease}"
      >
        <path d="M 20,20L 20,80"></path>
        <polygon points="30,50 80,20 80,80"></polygon>
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||("keydown"===e.type?this._onInput(e):"keyup"===e.type&&this._onRelease())}_onInput(e){e.preventDefault(),this.disabled||(this.focus(),this._active=!0,this._dispatchEvent())}_onRelease(e){this._active=!1}_dispatchEvent(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this._active}});this.dispatchEvent(e)}}customElements.define("sc-prev",Le);let ke=0;class Pe extends u{static properties={options:{type:Object},value:{type:String,reflect:!0},placeholder:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      height: 30px;
      width: 200px;
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      color: #fff;
      border: 1px solid var(--sc-color-primary-5);
      border-radius: 2px;
      overflow: auto;
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      border: 1px solid var(--sc-color-primary-4);
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    select {
      display: block;
      font-family: inherit;
      font-size: inherit;
      width: 100%;
      height: 100%;
      text-indent: 4px;
      border-radius: 0;
      border: none;
    }

    select:focus {
      outline: none;
    }

    option {
      text-indent: 4px;
    }
  `;constructor(){super(),this.options=[],this.value=null,this.disabled=!1,this.placeholder=""}render(){const e=(0,oe.PO)(this.options);return a.dy`
      <select
        ?disabled=${this.disabled}
        @change=${this._dispatchEvent}
      >
        ${this.placeholder?a.dy`<option value="">${this.placeholder}</option`:a.Ld}
        ${z(Object.entries(this.options),(()=>"sc-select-"+ke++),(([t,n])=>a.dy`
            <option
              value=${t}
              ?selected=${n===this.value}
            >${e?t:n}</option>
          `))}
      </select>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.shadowRoot.querySelector("select").setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_dispatchEvent(e){if(this.disabled)return;if((0,oe.PO)(this.options)){const t=e.target.value;this.value=this.options[t]}else{const t=this.placeholder?e.target.selectedIndex-1:e.target.selectedIndex;this.value=this.options[t]}const t=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(t)}}void 0===customElements.get("sc-select")&&customElements.define("sc-select",Pe);class Fe extends u{static properties={min:{type:Number,reflect:!0},max:{type:Number,reflect:!0},step:{type:Number,reflect:!0},value:{type:Number},orientation:{type:String,reflect:!0},relative:{type:Boolean,reflect:!0},numberBox:{type:Boolean,reflect:!0,attribute:"number-box"},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      vertical-align: top;
      border: 1px solid var(--sc-color-primary-3);
      font-size: 0;

      --sc-slider-background-color: var(--sc-color-primary-2);
      --sc-slider-foreground-color: var(--sc-color-primary-5);
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host([hidden]) {
      display: none
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      height: 30px;
      width: 200px;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
      height: 200px;
      width: 30px;
    }

    :host([number-box][orientation="horizontal"]) {
      width: 280px;
    }

    :host([number-box][orientation="vertical"]) {
      width: 80px;
    }

    :host([number-box][orientation="horizontal"]) .slider {
      width: calc(100% - 80px);
    }

    :host([number-box][orientation="vertical"]) .slider {
      flex-direction: column;
      height: calc(100% - 30px);
    }

    .slider {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      position: relative;
      display: inline-block;
    }

    svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    rect.background {
      fill: var(--sc-slider-background-color);
    }

    rect.foreground {
      fill: var(--sc-slider-foreground-color);
    }

    sc-position-surface {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    sc-number {
      display: inline-block;
      width: 80px;
      height: 100%;
      border: none;
    }

    :host([number-box][orientation="vertical"]) sc-number {
      display: block;
      height: 30px;
      width: 100%;
    }
  `;get min(){return this._min}set min(e){e>=this.max?console.warn("sc-slider: min cannot be >= to max"):(this._min=e,this._updateScales())}get max(){return this._max}set max(e){e<=this.min?console.warn("sc-slider: max cannot be <= to min"):(this._max=e,this._updateScales())}get step(){return this._step}set step(e){this._step=e,this._updateScales()}get midiType(){return"control"}set midiValue(e){const t=(this.max-this.min)*e/127+this.min;this.value=this._clipper(t),this._dispatchInputEvent(),clearTimeout(this._midiValueTimeout),this._midiValueTimeout=setTimeout((()=>{this._dispatchChangeEvent()}),500)}get midiValue(){return Math.round((this.value-this.min)/(this.max-this.min)*127)}constructor(){super(),this._scale=null,this._clipper=null,this._min=0,this._max=1,this._step=.001,this.min=0,this.max=1,this.step=.001,this.value=.5,this.orientation="horizontal",this.relative=!1,this.numberBox=!1,this.disabled=!1,this._pointerId=null,this._startPointerValue=null,this._startSliderValue=null,this._midiValueTimeout=null,this.keyboard=new f(this,{filterCodes:["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"],callback:this._onKeyboardEvent.bind(this)})}render(){const e=Math.max(0,this._scale(this.value));return a.dy`
      <div
        @mousedown=${e=>e.preventDefault()}
        @touchstart=${e=>e.preventDefault()}
        class="slider"
      >
        <svg viewbox="0 0 1000 1000" preserveAspectRatio="none">
          ${"horizontal"===this.orientation?a.YP`
                <rect class="background" width="1000" height="1000"></rect>
                <rect class="foreground" width="${e}" height="1000"></rect>
              `:a.YP`
                <rect class="foreground" width="1000" height="1000"></rect>
                <rect class="background" width="1000" height="${1e3-e}"></rect>
              `}
        </svg>
        <sc-position-surface
          x-range=${JSON.stringify([this.min,this.max])}
          y-range=${JSON.stringify([this.max,this.min])}
          clamp
          @input=${this._onPositionInput}
          @pointerend=${this._onPositionChange}
        ></sc-position-surface>
      </div>
      ${this.numberBox?a.dy`
          <sc-number
            min=${this.min}
            max=${this.max}
            value=${this.value}
            @input=${this._onNumberBoxInput}
            @change=${this._onNumberBoxChange}
          ></sc-number>
        `:a.Ld}
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_updateScales(){if(this._max<this._min){const e=this._max;this._max=this._min,this._min=e}var e,t,n;this._scale=A([this._min,this._max],[0,1e3]),this._clipper=(e=this._min,t=this._max,n=this._step,i=>{const r=Math.round(i/n)*n,a=Math.max(Math.log10(1/n),0),o=r.toFixed(a);return Math.min(t,Math.max(e,parseFloat(o)))}),this.value=this._clipper(this.value)}_onKeyboardEvent(e){if(!this.disabled)switch(e.type){case"keydown":{const t=Number.isFinite(this.min)&&Number.isFinite(this.max)?(this.max-this.min)/100:1;"ArrowUp"===e.code||"ArrowRight"===e.code?this.value=this._clipper(this.value+t):"ArrowDown"!==e.code&&"ArrowLeft"!==e.code||(this.value=this._clipper(this.value-t)),this._dispatchInputEvent();break}case"keyup":this._dispatchChangeEvent()}}_onNumberBoxInput(e){e.stopPropagation(),this.disabled||(this.value=this._clipper(e.detail.value),this._dispatchInputEvent())}_onNumberBoxChange(e){e.stopPropagation(),this.disabled||(this.value=this._clipper(e.detail.value),this._dispatchChangeEvent())}_onPositionChange(e){e.stopPropagation(),this.disabled||e.detail.pointerId===this._pointerId&&(this._pointerId=null,this._dispatchChangeEvent())}_onPositionInput(e){if(e.stopPropagation(),!this.disabled)if(this.focus(),this.relative){if(e.detail.value[0]&&(null===this._pointerId||e.detail.value[0].pointerId===this._pointerId)){const{x:t,y:n,pointerId:i}=e.detail.value[0],r="horizontal"===this.orientation?t:n;null===this._pointerId&&(this._startPointerValue=r,this._startSliderValue=this.value),this._pointerId=i;const a=r-this._startPointerValue;this.value=this._clipper(this._startSliderValue+a),this._dispatchInputEvent()}}else if(e.detail.value[0]&&(null===this._pointerId||e.detail.value[0].pointerId===this._pointerId)){const{x:t,y:n,pointerId:i}=e.detail.value[0],r="horizontal"===this.orientation?t:n;this._pointerId=i,this.value=this._clipper(r),this._dispatchInputEvent()}}_dispatchInputEvent(){const e=new CustomEvent("input",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}_dispatchChangeEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}const Ue=h("ScSlider",Fe);void 0===customElements.get("sc-slider")&&customElements.define("sc-slider",Ue);let Be=0;class Ge extends u{static properties={options:{type:Array},value:{type:String,reflect:!0},orientation:{type:String,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-flex;
      vertical-align: top;
      box-sizing: border-box;
      background-color: var(--sc-color-primary-1);
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      color: #ffffff;
      overflow: auto;
      border: 1px solid var(--sc-color-primary-3);

      --sc-tab-selected: var(--sc-color-secondary-1);
    }

    :host([hidden]) {
      display: none
    }

    :host([orientation="horizontal"]) {
      height: 30px;
      width: 400px;
    }

    :host([orientation="vertical"]) {
      width: 120px;
      height: auto;
      flex-direction: column;
      justify-content: space-between;
    }

    :host([orientation="vertical"]) sc-button {
      width: 100%;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    sc-button {
      border-radius: 0;
      --sc-button-selected: var(--sc-tab-selected);
      height: 100%;
      font-size: inherit;
      border: none;
    }

    :host([orientation="horizontal"]) sc-button:not(:first-child) {
      border-left: 1px solid var(--sc-color-primary-3);
    }

    :host([orientation="vertical"]) sc-button:not(:first-child) {
      border-top: 1px solid var(--sc-color-primary-3);
    }
  `;constructor(){super(),this.options=[],this.value=null,this.orientation="horizontal",this._keyboard=new f(this,{filterCodes:["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","Space","Enter"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return z(this.options,(()=>"sc-tab-"+Be++),(e=>a.dy`
        <sc-button
          .value=${e}
          ?selected=${e===this.value}
          @input="${this._onInput}"
          @focus=${e=>e.preventDefault()}
          tabindex="-1"
        >${e}</sc-button>
      `))}connectedCallback(){super.connectedCallback(),this.hasAttribute("tabindex")||this.setAttribute("tabindex",0)}_onKeyboardEvent(e){if("keydown"===e.type){let t=this.options.indexOf(this.value);"ArrowUp"===e.code||"ArrowRight"===e.code||"Space"===e.code||"Enter"==e.code?t+=1:"ArrowDown"!==e.code&&"ArrowLeft"!==e.code||(t-=1),t<0?t=this.options.length-1:t>=this.options.length&&(t=0),this.focus(),this.value=this.options[t],this._dispatchEvent()}}_onInput(e){e.stopPropagation(),this.value=e.detail.value,this._dispatchEvent()}_dispatchEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}void 0===customElements.get("sc-tab")&&customElements.define("sc-tab",Ge),_(class extends p{constructor(){super(...arguments),this.key=i.Ld}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(H(e),this.key=t),n}});void 0===customElements.get("sc-text")&&customElements.define("sc-text",class extends u{static get properties(){return{value:{type:String},editable:{type:Boolean,reflect:!0},dirty:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}}}static get styles(){return a.iv`
      :host {
        vertical-align: top;
        display: inline-block;
        box-sizing: border-box;
        vertical-align: top;
        width: 200px;
        height: 30px;
        border-radius: 0px;
        font-size: var(--sc-font-size);
        line-height: var(--sc-font-size);
        font-family: var(--sc-font-family);
        color: white;
        line-height: 20px;
        /* white-space: pre; is important to keep the new lines
           cf. https://stackoverflow.com/a/33052216
        */
        white-space: pre;
        background-color: var(--sc-color-primary-1);
        padding: 5px 6px;
        outline: none;

        overflow-y: auto;
      }

      :host([disabled]) {
        opacity: 0.7;
      }

      :host([hidden]) {
        display: none
      }

      :host(:focus), :host(:focus-visible) {
        outline: none;
      }

      :host([editable]) {
        background-color: var(--sc-color-primary-3);
        border: 1px dotted var(--sc-color-primary-5);
      }

      :host([editable]:focus),
      :host([editable]:focus-visible) {
        border: 1px solid var(--sc-color-primary-5);
      }

      :host([editable][dirty]:focus),
      :host([editable][dirty]:focus-visible) {
        border: 1px solid var(--sc-color-secondary-3);
      }
    `}get value(){return this.textContent}set value(e){this._editable&&this.setAttribute("contenteditable","false"),this.textContent=e,this._editable&&this.setAttribute("contenteditable","true")}constructor(){super(),this.disabled=!1,this.editable=!1,this.dirty=!1,this._value=null,this._updateValue=this._updateValue.bind(this),this._onKeyDown=this._onKeyDown.bind(this),this._onKeyUp=this._onKeyUp.bind(this),this._preventContextMenu=this._preventContextMenu.bind(this)}render(){return a.dy`<slot></slot>`}firstUpdated(){this._value=this.textContent}updated(){this.editable?(this.setAttribute("editable",!0),this.disabled?(this.setAttribute("tabindex",-1),this.setAttribute("contenteditable","false")):(this.setAttribute("tabindex",this._tabindex),this.setAttribute("contenteditable","true"))):(this.setAttribute("tabindex",-1),this.removeAttribute("editable"),this.removeAttribute("contenteditable"))}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0,this.addEventListener("blur",this._updateValue),this.addEventListener("keydown",this._onKeyDown),this.addEventListener("keyup",this._onKeyUp),this.addEventListener("contextmenu",this._preventContextMenu)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("blur",this._updateValue),this.removeEventListener("keydown",this._onKeyDown),this.removeEventListener("keyup",this._onKeyUp),this.removeEventListener("contextmenu",this._preventContextMenu)}_onKeyDown(e){e.metaKey&&"s"===e.key&&(e.preventDefault(),this._updateValue(e,!0))}_onKeyUp(e){e.target.textContent!==this._value&&!1===this.dirty?this.dirty=!0:e.target.textContent===this._value&&!0===this.dirty&&(this.dirty=!1)}_updateValue(e,t=!1){if(e.preventDefault(),e.stopPropagation(),this.dirty||t){this._value=e.target.textContent,this.dirty=!1;const t=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this._value}});this.dispatchEvent(t)}}});class Ye extends u{static properties={active:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      width: 30px;
      height: 30px;
      vertical-align: top;
      box-sizing: border-box;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
      font-size: 0;
      line-height: 0;

      --sc-toggle-inactive-color: var(--sc-color-primary-4);
      --sc-toggle-active-color: var(--sc-color-primary-5);
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host([hidden]) {
      display: none
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    svg line {
      stroke-width: 10px;
      stroke: var(--sc-toggle-inactive-color);
    }

    svg.active line {
      stroke: var(--sc-toggle-active-color);
    }
  `;get value(){return this.active}set value(e){this.active=e}get midiType(){return"control"}set midiValue(e){this.disabled||(this.active=0!==e,this._dispatchEvent())}get midiValue(){return this.active?127:0}constructor(){super(),this.active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <svg
        class="${this.active?"active":""}"
        viewbox="0 0 100 100"
        @mousedown="${this._updateValue}"
        @touchend="${{handleEvent:this._updateValue.bind(this),passive:!1}}"
      >
        <line x1="${25}" y1="${25}" x2="${75}" y2="${75}" />
        <line x1="${25}" y1="${75}" x2="${75}" y2="${25}" />
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||"keydown"===e.type&&(this.active=!this.active,this._dispatchEvent())}_updateValue(e){e.preventDefault(),this.disabled||(this.focus(),this.active=!this.active,this._dispatchEvent())}_dispatchEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.active}});this.dispatchEvent(e)}}const He=h("ScToggle",Ye);void 0===customElements.get("sc-toggle")&&customElements.define("sc-toggle",He);let $e=0,Ve=0;class ze extends u{static properties={options:{type:Object},value:{type:String,reflect:!0},orientation:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      vertical-align: top;
      box-sizing: border-box;
      font-family: var(--sc-font-family);
      font-size: var(--sc-font-size);
      color: #fff;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-2);
      overflow: auto;
    }

    :host([orientation="horizontal"]) {
      height: 30px;
      width: auto;
      padding: 4px 7px 4px 7px;
    }

    :host([orientation="vertical"]) {
      width: 200px;
      height: auto;
      padding: 6px 7px 8px 7px;
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host([hidden]) {
      display: none
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-3);
    }

    label {
      vertical-align: middle;
      user-select: none;
      webkit-user-select: none;
      webkit-touch-callout: none;
    }

    :host([orientation="horizontal"]) label {
      display: inline-block;
      margin-right: 12px;
      height: 20px;
      line-height: 20px;
    }

    :host([orientation="vertical"]) label {
      display: block;
      height: 20px;
      line-height: 20px;
    }

    input[type="radio"] {
      vertical-align: middle;
      position: relative;
      top: -1px;
    }

    input[type="radio"]:focus {
      outline: none;
    }
  `;get value(){return this._value}set value(e){this._value=e,this.requestUpdate()}constructor(){super(),this.options=[],this.value=null,this.disabled=!1,this.orientation="vertical",this._name="sc-radio-"+$e++}render(){return z(this.options,(e=>"sc-radio-"+Ve++),((e,t)=>a.dy`
        <label>
          <input
            type="radio"
            value=${e}
            data-index=${t}
            name=${this._name}
            @change=${this._dispatchEvent}
            @input=${this._bypassEvent}
            ?checked=${e==this.value}
            ?disabled=${this.disabled&&!(e==this.value)}
          />
          ${e}
        </label>
      `))}updated(e){const t=this.disabled?-1:this._tabindex;this.shadowRoot.querySelectorAll("input").forEach((e=>{e.setAttribute("tabindex",t),e.disabled=this.disabled})),this.disabled&&this.blur()}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_bypassEvent(e){e.preventDefault(),e.stopPropagation()}_dispatchEvent(e){if(this.disabled)return;const t=parseInt(e.target.dataset.index);this._value=this.options[t];const n=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(n)}}void 0===customElements.get("sc-radio")&&customElements.define("sc-radio",ze);class qe extends u{static properties={active:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border: 1px solid var(--sc-color-primary-3);
      background-color: var(--sc-color-primary-2);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg {
      width: 100%;
      height: 100%;
      fill: #ffffff;
    }

    svg.active {
      background-color: var(--sc-color-primary-1);
      fill: var(--sc-color-secondary-3);
    }
  `;get value(){return this.active}set value(e){this.active=e}constructor(){super(),this.active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <svg
        class="${this.active?"active":""}"
        viewbox="0 0 20 20"
        @mousedown="${this._triggerChange}"
        @touchstart="${this._triggerChange}"
      >
        <circle cx="10" cy="10" r="5"></circle>
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||"keydown"===e.type&&(this.active=!this.active,this._dispatchChangeEvent())}_triggerChange(e){e.preventDefault(),this.disabled||(this.focus(),this.active=!this.active,this._dispatchChangeEvent())}_dispatchChangeEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.active}});this.dispatchEvent(e),this.requestUpdate()}}void 0===customElements.get("sc-record")&&customElements.define("sc-record",qe);class We extends u{static properties={duration:{type:Number,reflect:!0},min:{type:Number,reflect:!0},max:{type:Number,reflect:!0},colors:{type:Array},lineWidth:{type:Number,reflect:!0,attribute:"line-width"},minMax:{type:Boolean,attribute:"min-max",reflect:!0},_maxValue:{type:Number,state:!0},_minValue:{type:Number,state:!0}};static get styles(){return a.iv`
      :host {
        vertical-align: top;
        display: inline-block;
        width: 300px;
        height: 150px;
        box-sizing: border-box;
        background-color: white;
        color: var(--sc-color-primary-1);
        position: relative;
        border: 1px solid var(--sc-color-primary-2);
      }

      canvas {
        box-sizing: border-box;
        margin: 0;
        width: 100%;
        height: 100%;
      }

      .min, .max {
        display: block;
        width: 100%;
        height: 14px;
        line-height: 14px;
        font-size: 10px;
        font-family: var(--sc-font-family);
        position: absolute;
        right: 0px;
        text-align: right;
        padding-right: 2px;
        color: inherit;
      }

      .min {
        bottom: 0px;
      }

      .max {
        top: 0px;
      }
    `}set value(e){if(e.data=Array.isArray(e.data)?e.data:[e.data],this._frameStack.push(e),this.minMax)for(let t=0;t<e.data.length;t++)e.data[t]>this._maxValue&&(this._maxValue=e.data[t]),e.data[t]<this._minValue&&(this._minValue=e.data[t])}update(e){(e.has("duration")||e.has("min")||e.has("max"))&&this._resetCanvas(),super.update(e)}constructor(){super(),this.duration=1,this.colors=["#4682B4","#ffa500","#00e600","#ff0000","#800080","#224153"],this.lineWidth=1,this.minMax=!1,this.min=-1,this.max=1,this._maxValue=-1/0,this._minValue=1/0,this._frameStack=[],this._pixelIndex=null,this._lastFrame=null,this._canvas=null,this._ctx=null,this._cachedCanvas=null,this._cachedCtx=null,this._getYPosition=null,this._logicalWidth=null,this._logicalHeight=null,this._renderSignal=this._renderSignal.bind(this)}render(){return a.dy`
      <canvas></canvas>
      ${this.minMax?a.dy`
          <span class="max">${this._maxValue.toFixed(3)}</span>
          <span class="min">${this._minValue.toFixed(3)}</span>
          `:a.Ld}
    `}firstUpdated(){super.firstUpdated(),this._canvas=this.shadowRoot.querySelector("canvas"),this._ctx=this._canvas.getContext("2d"),this._cachedCanvas=document.createElement("canvas"),this._cachedCtx=this._cachedCanvas.getContext("2d")}connectedCallback(){super.connectedCallback(),this._frameStack.length=0,this._pixelIndex=null,this._resizeObserver=new ResizeObserver((e=>{const t=e[0],{width:n,height:i}=t.contentRect;this._logicalWidth=n*window.devicePixelRatio,this._logicalHeight=i*window.devicePixelRatio,this._canvas.width=this._logicalWidth,this._canvas.height=this._logicalHeight,this._cachedCanvas.width=this._logicalWidth,this._cachedCanvas.height=this._logicalHeight,this._resetCanvas()})),this._resizeObserver.observe(this),this.rAFId=window.requestAnimationFrame(this._renderSignal)}disconnectedCallback(){this._resizeObserver.disconnect(),window.cancelAnimationFrame(this.rAFId),this._resetCanvas(),super.disconnectedCallback()}_resetCanvas(){if(this._ctx&&this._cachedCtx){const e=(0-this._logicalHeight)/(this.max-this.min),t=this._logicalHeight-e*this.min;this._getYPosition=n=>e*n+t,this._lastFrame=null,this._frameStack.length=0,this._pixelIndex=null,this._ctx.clearRect(0,0,this._logicalWidth,this._logicalHeight),this._cachedCtx.clearRect(0,0,this._logicalWidth,this._logicalHeight)}}_renderSignal(){if(this._frameStack.length>0){let e=0,t=!1;const n=this.duration/this._logicalWidth;for(null===this._pixelIndex&&(this._pixelIndex=Math.floor(this._frameStack[0].time/n));this._frameStack.length>0;){e+=1;const i=this._pixelIndex*n,r=(this._pixelIndex+1)*n;let a=null;for(let e=0;e<this._frameStack.length;e++){const n=this._frameStack[e].time;n<i?e+1===this._frameStack.length&&(this._frameStack.length=0,t=!0):n>=i&&n<r&&(a=e)}if(t)break;if(null!==a){const t=this._frameStack[a];if(this._lastFrame){const n=this._logicalWidth,i=this._logicalHeight,r=n-e;this._ctx.clearRect(0,0,n,i),this._ctx.drawImage(this._cachedCanvas,e,0,r,i,0,0,r,i),this._ctx.lineWidth=this.lineWidth,this._ctx.lineCap="round";for(let e=0;e<t.data.length;e++){this._ctx.strokeStyle=this.colors[e];const i=this._getYPosition(this._lastFrame.data[e]),a=this._getYPosition(t.data[e]);this._ctx.beginPath(),this._ctx.moveTo(r,i),this._ctx.lineTo(n,a),this._ctx.stroke()}this._cachedCtx.clearRect(0,0,n,i),this._cachedCtx.drawImage(this._canvas,0,0,n,i)}this._lastFrame=t,e=0,this._frameStack.splice(0,a+1)}this._pixelIndex+=1}}this.rAFId=window.requestAnimationFrame(this._renderSignal)}}void 0===customElements.get("sc-signal")&&customElements.define("sc-signal",We);class Ke extends u{static properties={active:{type:Boolean,reflect:!0},value:{type:Boolean},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      width: 60px;
      height: 30px;
      vertical-align: top;
      box-sizing: border-box;
      background-color: var(--sc-color-primary-2);
      border: 1px solid var(--sc-color-primary-3);
      font-size: 0;
      line-height: 0;
      border-radius: 1px;

      --sc-switch-transition-time: 75ms;
      --sc-switch-toggle-color: white;
      --sc-switch-active-color: var(--sc-color-secondary-1);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    :host > svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 3px;
      border-radius: inherit;
      transition: var(--sc-switch-transition-time);
      position: relative;
    }

    :host > svg.active {
      background-color: var(--sc-switch-active-color);
    }

    svg rect {
      transition: var(--sc-switch-transition-time);
      fill: var(--sc-switch-toggle-color);
    }
  `;get value(){return this.active}set value(e){this.active=e}constructor(){super(),this.active=!1,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <svg
        class="${this.active?"active":""}"
        viewBox="0 0 10 10"
        preserveAspectRatio="none"
        @mousedown=${this._updateValue}
        @touchend=${this._updateValue}
      >
         <rect x="${this.active?5:0}" width="5" height="10" />
      </svg>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){this.disabled||"keydown"===e.type&&(this.active=!this.active,this._dispatchEvent())}_updateValue(e){e.preventDefault(),this.disabled||(this.focus(),this.active=!this.active,this._dispatchEvent())}_dispatchEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.active}});this.dispatchEvent(e)}}void 0===customElements.get("sc-switch")&&customElements.define("sc-switch",Ke);class Qe extends u{static properties={buttons:{type:Array},state:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      box-sizing: border-box;
      vertical-align: top;
      display: inline-flex;
      justify-content: space-between;
      width: auto;
      height: 30px;
      border-radius: 0;
      cursor: pointer;

      --sc-transport-background-color: var(--sc-color-primary-2);
      --sc-transport-active-background-color: var(--sc-color-primary-1);
      --sc-transport-active-play-fill: var(--sc-color-secondary-4);
      --sc-transport-active-pause-fill: var(--sc-color-secondary-1);
      --sc-transport-active-stop-fill: var(--sc-color-secondary-3);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
    }

    svg {
      box-sizing: border-box;
      border-radius: inherit;
      border: 1px solid var(--sc-color-primary-3);
      background-color: var(--sc-transport-background-color);
      fill:  #ffffff;
      height: 100%;
      width: auto;
      margin-right: 4px;
      outline: none;
    }

    :host(:focus) svg, :host(:focus-visible) svg {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    svg:last-child {
      margin-right: 0px;
    }

    svg.active {
      background-color: var(--sc-transport-active-background-color);
    }

    svg.play.active {
      fill: var(--sc-transport-active-play-fill);
    }

    svg.pause.active {
      fill: var(--sc-transport-active-pause-fill);
    }

    svg.stop.active {
      fill: var(--sc-transport-active-stop-fill);
    }
  `;get value(){return this.state}set value(e){this.state=e}constructor(){super(),this.buttons=["play","pause","stop"],this.state=null,this.disabled=!1,this._keyboard=new f(this,{filterCodes:["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      ${this.buttons.map((e=>{switch(e){case"play":return a.dy`
              <svg
                class="play ${"play"===this.state?"active":""}"
                viewbox="0 0 20 20"
                @mousedown=${e=>this._onChange(e,"play")}
                @touchstart=${e=>this._onChange(e,"play")}
                tabindex="-1"
              >
                <polygon class="play-shape" points="6, 5, 15, 10, 6, 15"></polygon>
              </svg>
            `;case"pause":return a.dy`
              <svg
                class="pause ${"pause"===this.state?"active":""}"
                viewbox="0 0 20 20"
                @mousedown=${e=>this._onChange(e,"pause")}
                @touchstart=${e=>this._onChange(e,"pause")}
                tabindex="-1"
              >
                <rect class="left" x="5" y="5" width="3" height="10"></rect>
                <rect class="right" x="12" y="5" width="3" height="10"></rect>
              </svg>
            `;case"stop":return a.dy`
              <svg
                class="stop ${"stop"===this.state?"active":""}"
                viewbox="0 0 20 20"
                @mousedown=${e=>this._onChange(e,"stop")}
                @touchstart=${e=>this._onChange(e,"stop")}
                tabindex="-1"
              >
                <rect class="stop-shape" x="6" y="6" width="8" height="8"></rect>
              </svg>
            `}}))}
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){if("keydown"===e.type){let t=this.buttons.indexOf(this.state);"ArrowUp"===e.code||"ArrowRight"===e.code||"Space"===e.code?t+=1:"ArrowDown"!==e.code&&"ArrowLeft"!==e.code||(t-=1),t<0?t=this.buttons.length-1:t>=this.buttons.length&&(t=0),this.state=this.buttons[t],this._dispatchEvent()}}_onChange(e,t){e.preventDefault(),e.stopPropagation(),this.disabled||(this.focus(),this.state!==t&&(this.state=t,this._dispatchEvent()))}_dispatchEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.state}});this.dispatchEvent(e)}}void 0===customElements.get("sc-transport")&&customElements.define("sc-transport",Qe);class je extends u{static properties={value:{type:Number,reflect:!0},disabled:{type:Boolean,reflect:!0}};static styles=a.iv`
    :host {
      display: inline-block;
      box-sizing: border-box;
      vertical-align: top;
      font-size: 0px;
      width: 50px;
      height: 30px;
      border: 1px solid var(--sc-color-primary-3);
      background-color: var(--sc-color-primary-2);
      font-size: 11px;
      color: #ffffff;
      font-family: var(--sc-font-family);
      cursor: pointer;

      --sc-tap-tempo-background-color: var(--sc-color-secondary-5);
    }

    :host([hidden]) {
      display: none
    }

    :host([disabled]) {
      opacity: 0.7;
      cursor: default;
    }

    :host(:focus), :host(:focus-visible) {
      outline: none;
      border: 1px solid var(--sc-color-primary-4);
    }

    div {
      box-sizing: border-box;
      text-align: center;
      border-radius: inherit;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      color: inherit;
    }

    div.active {
      background-color: var(--sc-tap-tempo-background-color);
    }
  `;constructor(){super(),this.value=60,this.disabled=!1,this._active=!1,this._timeoutId=null,this._lastTime=null,this._lastDifference=null,this._timeQueue=[],this._timer=null,this._maxQueueSize=6,this._timeout=2e3,this._keyboard=new f(this,{filterCodes:["Enter","Space"],callback:this._onKeyboardEvent.bind(this),deduplicateEvents:!0})}render(){return a.dy`
      <div
        class="${this._active?"active":""}"
        @mousedown="${this._onTap}"
        @touchstart="${this._onTap}"
      >
        <slot>tap</slot>
      </div>
    `}updated(e){if(e.has("disabled")){const e=this.disabled?-1:this._tabindex;this.setAttribute("tabindex",e),this.disabled&&this.blur()}}connectedCallback(){super.connectedCallback(),this._tabindex=this.getAttribute("tabindex")||0}_onKeyboardEvent(e){"keydown"===e.type&&this._onTap(e)}_onTap(e){if(e.preventDefault(),this.disabled)return;this.focus(),clearTimeout(this._timeoutId),this._active=!0,this.requestUpdate(),this._timeoutId=setTimeout((()=>{this._active=!1,this.requestUpdate()}),100);const t=D();if(this._lastTime){if(this._lastDifference=t-this._lastTime,Math.abs(this._lastDifference-this._timeQueue[this._timeQueue.length-1])>.2&&(this._timeQueue=[],this._lastTime=null),this._timeQueue.push(this._lastDifference),this._timeQueue.length){let e=0;for(let t=0;t<this._timeQueue.length;t++)e+=this._timeQueue[t];const t=1/(e/this._timeQueue.length)*60;this.value=t,this._dispatchEvent()}this._timeQueue.length>this._maxQueueSize&&this._timeQueue.shift()}this._lastTime=t,clearTimeout(this._timer),this._timer=setTimeout((()=>{this._timeQueue=[],this._lastTime=null}),this._timeout)}_dispatchEvent(){const e=new CustomEvent("change",{bubbles:!0,composed:!0,detail:{value:this.value}});this.dispatchEvent(e)}}void 0===customElements.get("sc-tap-tempo")&&customElements.define("sc-tap-tempo",je);var Xe=n(4670),Ze=(n(5913),n(439));const Je="sc-scheduling";window.SC_DEBUG="localhost"===window.location.hostname,document.body.classList.remove("light"),document.body.classList.add("dark");let et=null,tt=null;async function nt(e,t){let a=!1;for(let n in e){const i=e[n];for(let[e,n]of Object.entries(i))n===t&&(a=!0)}a||(t="home");let o=null;for(let n in e)for(let i in e[n])e[n][i]===t&&(o=i);document.title="home"===t?`${Je} | documentation`:`${o} | ${Je}`,(0,Xe.default)("");const s=document.querySelector("#main > nav");s.classList.remove("active");const l=[];for(let n in e){const a=e[n];if("intro"!==n){const e=i.dy`<p>${n}</p>`;l.push(e)}const o=r(Object.entries(a),(([n,r])=>i.dy`<a
        href="./${r}"
        class="${t===r?"selected":""}"
        @click=${n=>{if(n.preventDefault(),t===r)return;const i="home"===r?`${tt}/`:`${tt}/${r}`;history.pushState({page:r},"",i),nt(e,r)}}
      >${n}</a>`));l.push(o)}(0,i.sY)(l,s),et&&et.exit&&et.exit(),et=await n(7192)(`./${t}.js`),(0,i.sY)(et.template,document.querySelector("#main > section"));const c=document.querySelector(`#main > section ${t}`);c&&setTimeout((()=>c.focus()),0),et.enter&&et.enter()}!async function(){const e=window.location.pathname,t=e.startsWith(`/${Je}`);tt=t?`/${Je}`:"";const n=e.replace(new RegExp(`^${tt}/`),"");history.pushState({page:n},"",`${tt}/${n}`),window.addEventListener("popstate",(e=>{nt(Ze.pages,e.state.page)})),nt(Ze.pages,n),document.querySelector("#switch-mode").addEventListener("change",(()=>{const e=document.querySelector("#main > section");e.classList.toggle("dark"),e.classList.toggle("light")})),document.querySelector("#toggle-menu").addEventListener("input",(()=>{document.querySelector("#main > nav").classList.toggle("active")}))}()},439:(e,t,n)=>{"use strict";n.r(t),n.d(t,{pages:()=>i});const i={intro:{home:"home"},scheduling:{"Simple demo":"scheduling-simple-demo"}}},4670:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>r});const i=document.createElement("style");function r(e){i.innerText=e}i.type="text/css",document.head.appendChild(i)},1402:(e,t,n)=>{"use strict";function i(e){return"[object Function]"==Object.prototype.toString.call(e)||"[object AsyncFunction]"==Object.prototype.toString.call(e)}function r(e){return Number(e)===e}function a(e){return function(e){if("object"!=typeof e||null===e)return!1;const t=Object.getPrototypeOf(e);return!(null!==t&&t!==Object.prototype&&null!==Object.getPrototypeOf(t)||Symbol.toStringTag in e||Symbol.iterator in e)}(e)}function o(e){return 440*Math.pow(2,(e-69)/12)}n.d(t,{mf:()=>i,hj:()=>r,PO:()=>a,IF:()=>o}),new Function("try {return this===window;}catch(e){ return false;}")},8259:(e,t,n)=>{"use strict";var i;n.d(t,{Jb:()=>O,Ld:()=>A,YP:()=>R,_$LH:()=>$,dy:()=>N,sY:()=>z});const r=window,a=r.trustedTypes,o=a?a.createPolicy("lit-html",{createHTML:e=>e}):void 0,s="$lit$",l=`lit$${(Math.random()+"").slice(9)}$`,c="?"+l,d=`<${c}>`,u=document,_=()=>u.createComment(""),p=e=>null===e||"object"!=typeof e&&"function"!=typeof e,m=Array.isArray,g=e=>m(e)||"function"==typeof(null==e?void 0:e[Symbol.iterator]),h="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,E=/-->/g,S=/>/g,b=RegExp(`>|${h}(?:([^\\s"'>=/]+)(${h}*=${h}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),v=/'/g,T=/"/g,C=/^(?:script|style|textarea|title)$/i,y=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),N=y(1),R=y(2),O=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),I=new WeakMap,x=u.createTreeWalker(u,129,null,!1);function D(e,t){if(!Array.isArray(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==o?o.createHTML(t):t}const w=(e,t)=>{const n=e.length-1,i=[];let r,a=2===t?"<svg>":"",o=f;for(let t=0;t<n;t++){const n=e[t];let c,u,_=-1,p=0;for(;p<n.length&&(o.lastIndex=p,u=o.exec(n),null!==u);)p=o.lastIndex,o===f?"!--"===u[1]?o=E:void 0!==u[1]?o=S:void 0!==u[2]?(C.test(u[2])&&(r=RegExp("</"+u[2],"g")),o=b):void 0!==u[3]&&(o=b):o===b?">"===u[0]?(o=null!=r?r:f,_=-1):void 0===u[1]?_=-2:(_=o.lastIndex-u[2].length,c=u[1],o=void 0===u[3]?b:'"'===u[3]?T:v):o===T||o===v?o=b:o===E||o===S?o=f:(o=b,r=void 0);const m=o===b&&e[t+1].startsWith("/>")?" ":"";a+=o===f?n+d:_>=0?(i.push(c),n.slice(0,_)+s+n.slice(_)+l+m):n+l+(-2===_?(i.push(void 0),t):m)}return[D(e,a+(e[n]||"<?>")+(2===t?"</svg>":"")),i]};class M{constructor({strings:e,_$litType$:t},n){let i;this.parts=[];let r=0,o=0;const d=e.length-1,u=this.parts,[p,m]=w(e,t);if(this.el=M.createElement(p,n),x.currentNode=this.el.content,2===t){const e=this.el.content,t=e.firstChild;t.remove(),e.append(...t.childNodes)}for(;null!==(i=x.nextNode())&&u.length<d;){if(1===i.nodeType){if(i.hasAttributes()){const e=[];for(const t of i.getAttributeNames())if(t.endsWith(s)||t.startsWith(l)){const n=m[o++];if(e.push(t),void 0!==n){const e=i.getAttribute(n.toLowerCase()+s).split(l),t=/([.?@])?(.*)/.exec(n);u.push({type:1,index:r,name:t[2],strings:e,ctor:"."===t[1]?U:"?"===t[1]?G:"@"===t[1]?Y:F})}else u.push({type:6,index:r})}for(const t of e)i.removeAttribute(t)}if(C.test(i.tagName)){const e=i.textContent.split(l),t=e.length-1;if(t>0){i.textContent=a?a.emptyScript:"";for(let n=0;n<t;n++)i.append(e[n],_()),x.nextNode(),u.push({type:2,index:++r});i.append(e[t],_())}}}else if(8===i.nodeType)if(i.data===c)u.push({type:2,index:r});else{let e=-1;for(;-1!==(e=i.data.indexOf(l,e+1));)u.push({type:7,index:r}),e+=l.length-1}r++}}static createElement(e,t){const n=u.createElement("template");return n.innerHTML=e,n}}function L(e,t,n=e,i){var r,a,o,s;if(t===O)return t;let l=void 0!==i?null===(r=n._$Co)||void 0===r?void 0:r[i]:n._$Cl;const c=p(t)?void 0:t._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(a=null==l?void 0:l._$AO)||void 0===a||a.call(l,!1),void 0===c?l=void 0:(l=new c(e),l._$AT(e,n,i)),void 0!==i?(null!==(o=(s=n)._$Co)&&void 0!==o?o:s._$Co=[])[i]=l:n._$Cl=l),void 0!==l&&(t=L(e,l._$AS(e,t.values),l,i)),t}class k{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){var t;const{el:{content:n},parts:i}=this._$AD,r=(null!==(t=null==e?void 0:e.creationScope)&&void 0!==t?t:u).importNode(n,!0);x.currentNode=r;let a=x.nextNode(),o=0,s=0,l=i[0];for(;void 0!==l;){if(o===l.index){let t;2===l.type?t=new P(a,a.nextSibling,this,e):1===l.type?t=new l.ctor(a,l.name,l.strings,this,e):6===l.type&&(t=new H(a,this,e)),this._$AV.push(t),l=i[++s]}o!==(null==l?void 0:l.index)&&(a=x.nextNode(),o++)}return x.currentNode=u,r}v(e){let t=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class P{constructor(e,t,n,i){var r;this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=i,this._$Cp=null===(r=null==i?void 0:i.isConnected)||void 0===r||r}get _$AU(){var e,t;return null!==(t=null===(e=this._$AM)||void 0===e?void 0:e._$AU)&&void 0!==t?t:this._$Cp}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===(null==e?void 0:e.nodeType)&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=L(this,e,t),p(e)?e===A||null==e||""===e?(this._$AH!==A&&this._$AR(),this._$AH=A):e!==this._$AH&&e!==O&&this._(e):void 0!==e._$litType$?this.g(e):void 0!==e.nodeType?this.$(e):g(e)?this.T(e):this._(e)}k(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}$(e){this._$AH!==e&&(this._$AR(),this._$AH=this.k(e))}_(e){this._$AH!==A&&p(this._$AH)?this._$AA.nextSibling.data=e:this.$(u.createTextNode(e)),this._$AH=e}g(e){var t;const{values:n,_$litType$:i}=e,r="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=M.createElement(D(i.h,i.h[0]),this.options)),i);if((null===(t=this._$AH)||void 0===t?void 0:t._$AD)===r)this._$AH.v(n);else{const e=new k(r,this),t=e.u(this.options);e.v(n),this.$(t),this._$AH=e}}_$AC(e){let t=I.get(e.strings);return void 0===t&&I.set(e.strings,t=new M(e)),t}T(e){m(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,i=0;for(const r of e)i===t.length?t.push(n=new P(this.k(_()),this.k(_()),this,this.options)):n=t[i],n._$AI(r),i++;i<t.length&&(this._$AR(n&&n._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var n;for(null===(n=this._$AP)||void 0===n||n.call(this,!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){var t;void 0===this._$AM&&(this._$Cp=e,null===(t=this._$AP)||void 0===t||t.call(this,e))}}class F{constructor(e,t,n,i,r){this.type=1,this._$AH=A,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=A}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,n,i){const r=this.strings;let a=!1;if(void 0===r)e=L(this,e,t,0),a=!p(e)||e!==this._$AH&&e!==O,a&&(this._$AH=e);else{const i=e;let o,s;for(e=r[0],o=0;o<r.length-1;o++)s=L(this,i[n+o],t,o),s===O&&(s=this._$AH[o]),a||(a=!p(s)||s!==this._$AH[o]),s===A?e=A:e!==A&&(e+=(null!=s?s:"")+r[o+1]),this._$AH[o]=s}a&&!i&&this.j(e)}j(e){e===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=e?e:"")}}class U extends F{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===A?void 0:e}}const B=a?a.emptyScript:"";class G extends F{constructor(){super(...arguments),this.type=4}j(e){e&&e!==A?this.element.setAttribute(this.name,B):this.element.removeAttribute(this.name)}}class Y extends F{constructor(e,t,n,i,r){super(e,t,n,i,r),this.type=5}_$AI(e,t=this){var n;if((e=null!==(n=L(this,e,t,0))&&void 0!==n?n:A)===O)return;const i=this._$AH,r=e===A&&i!==A||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==A&&(i===A||r);r&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,n;"function"==typeof this._$AH?this._$AH.call(null!==(n=null===(t=this.options)||void 0===t?void 0:t.host)&&void 0!==n?n:this.element,e):this._$AH.handleEvent(e)}}class H{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){L(this,e)}}const $={O:s,P:l,A:c,C:1,M:w,L:k,R:g,D:L,I:P,V:F,H:G,N:Y,U,F:H},V=r.litHtmlPolyfillSupport;null==V||V(M,P),(null!==(i=r.litHtmlVersions)&&void 0!==i?i:r.litHtmlVersions=[]).push("2.8.0");const z=(e,t,n)=>{var i,r;const a=null!==(i=null==n?void 0:n.renderBefore)&&void 0!==i?i:t;let o=a._$litPart$;if(void 0===o){const e=null!==(r=null==n?void 0:n.renderBefore)&&void 0!==r?r:null;a._$litPart$=o=new P(t.insertBefore(_(),e),e,void 0,null!=n?n:{})}return o._$AI(e),o}},182:(e,t,n)=>{"use strict";n.d(t,{oi:()=>C,iv:()=>l,dy:()=>T.dy,Ld:()=>T.Ld,YP:()=>T.YP});const i=window,r=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),o=new WeakMap;class s{constructor(e,t,n){if(this._$cssResult$=!0,n!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(r&&void 0===e){const n=void 0!==t&&1===t.length;n&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&o.set(t,e))}return e}toString(){return this.cssText}}const l=(e,...t)=>{const n=1===e.length?e[0]:t.reduce(((t,n,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[i+1]),e[0]);return new s(n,e,a)},c=r?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,a))(t)})(e):e;var d;const u=window,_=u.trustedTypes,p=_?_.emptyScript:"",m=u.reactiveElementPolyfillSupport,g={toAttribute(e,t){switch(t){case Boolean:e=e?p:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=null!==e;break;case Number:n=null===e?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch(e){n=null}}return n}},h=(e,t)=>t!==e&&(t==t||e==e),f={attribute:!0,type:String,converter:g,reflect:!1,hasChanged:h},E="finalized";class S extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(e){var t;this.finalize(),(null!==(t=this.h)&&void 0!==t?t:this.h=[]).push(e)}static get observedAttributes(){this.finalize();const e=[];return this.elementProperties.forEach(((t,n)=>{const i=this._$Ep(n,t);void 0!==i&&(this._$Ev.set(i,n),e.push(i))})),e}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this.finalize(),this.elementProperties.set(e,t),!t.noAccessor&&!this.prototype.hasOwnProperty(e)){const n="symbol"==typeof e?Symbol():"__"+e,i=this.getPropertyDescriptor(e,n,t);void 0!==i&&Object.defineProperty(this.prototype,e,i)}}static getPropertyDescriptor(e,t,n){return{get(){return this[t]},set(i){const r=this[e];this[t]=i,this.requestUpdate(e,r,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)||f}static finalize(){if(this.hasOwnProperty(E))return!1;this[E]=!0;const e=Object.getPrototypeOf(this);if(e.finalize(),void 0!==e.h&&(this.h=[...e.h]),this.elementProperties=new Map(e.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const e=this.properties,t=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(const n of t)this.createProperty(n,e[n])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const e of n)t.unshift(c(e))}else void 0!==e&&t.push(c(e));return t}static _$Ep(e,t){const n=t.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof e?e.toLowerCase():void 0}_$Eu(){var e;this._$E_=new Promise((e=>this.enableUpdating=e)),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(e=this.constructor.h)||void 0===e||e.forEach((e=>e(this)))}addController(e){var t,n;(null!==(t=this._$ES)&&void 0!==t?t:this._$ES=[]).push(e),void 0!==this.renderRoot&&this.isConnected&&(null===(n=e.hostConnected)||void 0===n||n.call(e))}removeController(e){var t;null===(t=this._$ES)||void 0===t||t.splice(this._$ES.indexOf(e)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach(((e,t)=>{this.hasOwnProperty(t)&&(this._$Ei.set(t,this[t]),delete this[t])}))}createRenderRoot(){var e;const t=null!==(e=this.shadowRoot)&&void 0!==e?e:this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{r?e.adoptedStyleSheets=t.map((e=>e instanceof CSSStyleSheet?e:e.styleSheet)):t.forEach((t=>{const n=document.createElement("style"),r=i.litNonce;void 0!==r&&n.setAttribute("nonce",r),n.textContent=t.cssText,e.appendChild(n)}))})(t,this.constructor.elementStyles),t}connectedCallback(){var e;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(e=this._$ES)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostConnected)||void 0===t?void 0:t.call(e)}))}enableUpdating(e){}disconnectedCallback(){var e;null===(e=this._$ES)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostDisconnected)||void 0===t?void 0:t.call(e)}))}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$EO(e,t,n=f){var i;const r=this.constructor._$Ep(e,n);if(void 0!==r&&!0===n.reflect){const a=(void 0!==(null===(i=n.converter)||void 0===i?void 0:i.toAttribute)?n.converter:g).toAttribute(t,n.type);this._$El=e,null==a?this.removeAttribute(r):this.setAttribute(r,a),this._$El=null}}_$AK(e,t){var n;const i=this.constructor,r=i._$Ev.get(e);if(void 0!==r&&this._$El!==r){const e=i.getPropertyOptions(r),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==(null===(n=e.converter)||void 0===n?void 0:n.fromAttribute)?e.converter:g;this._$El=r,this[r]=a.fromAttribute(t,e.type),this._$El=null}}requestUpdate(e,t,n){let i=!0;void 0!==e&&(((n=n||this.constructor.getPropertyOptions(e)).hasChanged||h)(this[e],t)?(this._$AL.has(e)||this._$AL.set(e,t),!0===n.reflect&&this._$El!==e&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(e,n))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var e;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach(((e,t)=>this[t]=e)),this._$Ei=void 0);let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),null===(e=this._$ES)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostUpdate)||void 0===t?void 0:t.call(e)})),this.update(n)):this._$Ek()}catch(e){throw t=!1,this._$Ek(),e}t&&this._$AE(n)}willUpdate(e){}_$AE(e){var t;null===(t=this._$ES)||void 0===t||t.forEach((e=>{var t;return null===(t=e.hostUpdated)||void 0===t?void 0:t.call(e)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(e){return!0}update(e){void 0!==this._$EC&&(this._$EC.forEach(((e,t)=>this._$EO(t,this[t],e))),this._$EC=void 0),this._$Ek()}updated(e){}firstUpdated(e){}}S[E]=!0,S.elementProperties=new Map,S.elementStyles=[],S.shadowRootOptions={mode:"open"},null==m||m({ReactiveElement:S}),(null!==(d=u.reactiveElementVersions)&&void 0!==d?d:u.reactiveElementVersions=[]).push("1.6.3");var b,v,T=n(8259);class C extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,t;const n=super.createRenderRoot();return null!==(e=(t=this.renderOptions).renderBefore)&&void 0!==e||(t.renderBefore=n.firstChild),n}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=(0,T.sY)(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!1)}render(){return T.Jb}}C.finalized=!0,C._$litElement$=!0,null===(b=globalThis.litElementHydrateSupport)||void 0===b||b.call(globalThis,{LitElement:C});const y=globalThis.litElementPolyfillSupport;null==y||y({LitElement:C}),(null!==(v=globalThis.litElementVersions)&&void 0!==v?v:globalThis.litElementVersions=[]).push("3.3.3")},5913:(e,t,n)=>{"use strict";n.d(t,{b:()=>p}),n(6502);var i=n(1402);const r=e=>e,a=Symbol.for("sc-scheduling:queue-time"),o=Symbol.for("sc-scheduling:scheduler"),s=Symbol.for("sc-scheduling:compat-mode");function l(e,t,n){const i=e[t];e[t]=e[n],e[n]=i}const c=function(e,t){return e<t},d=function(e,t){return e>t},u=function(e,t){return e>t},_=function(e,t){return e<t},p=class{constructor(e,{period:t=.025,lookahead:n=.1,queueSize:o=1e3,currentTimeToAudioTimeFunction:s=r,maxEngineRecursion:p=100,verbose:m=!1}={}){if(!(0,i.mf)(e))throw new Error("[sc-scheduling] Invalid value for `getTimeFunction` in `new Scheduler(getTimeFunction)`, should be a function returning a time in seconds");this._queue=new class{constructor(e=1e3){this._currentLength=1,this._heap=new Array(e+1),this._reverse=null,this.reverse=!1}get time(){return this._currentLength>1?this._heap[1][a]:1/0}get head(){return this._heap[1]}set reverse(e){e!==this._reverse&&(this._reverse=e,!0===this._reverse?(this._isLower=c,this._isHigher=u):(this._isLower=d,this._isHigher=_),this._buildHeap())}_bubbleUp(e){let t=this._heap[e],n=e,i=Math.floor(n/2),r=this._heap[i];for(;r&&this._isHigher(t[a],r[a]);)l(this._heap,n,i),n=i,i=Math.floor(n/2),r=this._heap[i]}_bubbleDown(e){let t=this._heap[e],n=e,i=2*n,r=i+1,o=this._heap[i],s=this._heap[r];for(;o&&this._isLower(t[a],o[a])||s&&this._isLower(t[a],s[a]);){let e;e=s?this._isHigher(o[a],s[a])?i:r:i,l(this._heap,n,e),n=e,i=2*n,r=i+1,o=this._heap[i],s=this._heap[r]}}_buildHeap(){for(let e=Math.floor((this._currentLength-1)/2);e>0;e--)this._bubbleDown(e)}_sanitizeTime(e){return Number.isFinite(e)?e=function(e,t=1e-9){return Math.round(e/t)*t}(e):(Math.abs(e)!==1/0&&console.warn("PriorityQueue: entry",JSON.stringify(entry),`inserted with NaN time: "${e}" (overriden to Infinity). This probably shows an error in your implementation.`),e=this.reverse?-1/0:1/0),e}add(e,t){return t=this._sanitizeTime(t),e[a]=t,this._heap[this._currentLength]=e,this._bubbleUp(this._currentLength),this._currentLength+=1,this.time}move(e,t){const n=this._heap.indexOf(e);if(-1!==n){t=this._sanitizeTime(t),e[a]=t;const i=this._heap[Math.floor(n/2)];i&&this._isHigher(t,i[a])?this._bubbleUp(n):this._bubbleDown(n)}return this.time}remove(e){const t=this._heap.indexOf(e);if(-1!==t){const n=this._currentLength-1;if(t===n)this._heap[n]=void 0;else if(l(this._heap,t,n),this._heap[n]=void 0,1===t)this._bubbleDown(1);else{const e=this._heap[t],n=this._heap[Math.floor(t/2)];n&&this._isHigher(e[a],n[a])?this._bubbleUp(t):this._bubbleDown(t)}delete e[a],this._currentLength=n}return this.time}clear(){for(let e=1;e<this._currentLength;e++)delete this._heap[e][a];this._currentLength=1,this._heap=new Array(this._heap.length)}has(e){return this._heap.includes(e)}}(o),this._engines=new Set,this._getTimeFunction=e,this._period=-1/0,this._lookahead=1/0,this._currentTimeToAudioTimeFunction=s,this._maxEngineRecursion=p,this._verbose=m,this._currentTime=null,this._nextTime=1/0,this._timeoutId=null,this._engineTimeCounterMap=new Map,this.period=t,this.lookahead=n,this._tick=this._tick.bind(this)}get period(){return this._period}set period(e){if(e<0||e>=this.lookahead)throw new Error("[sc-scheduling] Invalid value for period, period must be strictly positive and lower than lookahead");this._period=e}get lookahead(){return this._lookahead}set lookahead(e){if(e<0||e<=this.period)throw new Error("[sc-scheduling] Invalid value for lookahead, lookahead must be strictly positive and greater than period");this._lookahead=e}get currentTime(){return this._currentTime||this._getTimeFunction()+this.lookahead}get audioTime(){return this._currentTimeToAudioTimeFunction(this.currentTime)}has(e){return e[s]&&(e=e[s]),this._engines.has(e)}defer(e,t){const n={advanceTime:(t,n,i)=>(setTimeout((()=>{e(t,n)}),Math.ceil(1e3*i)),null)};this.add(n,t)}add(e,t){if((0,i.mf)(e.advanceTime)&&(void 0===e[s]&&(e[s]=e.advanceTime.bind(e)),e=e[s]),!(0,i.mf)(e))throw delete e[o],new Error("[sc-scheduler] Invalid argument for scheduler.add(engine, time), engine should be a function");if(!(0,i.hj)(t))throw new Error("[sc-scheduler] Invalid time for scheduler.add(engine, time), time should be a number");if(void 0!==e[o])throw e[o]!==this?new Error("[sc-scheduler] Engine cannot be added to this scheduler, it has already been added to another scheduler"):new Error("[sc-scheduler] Engine has already been added to this scheduler");e[o]=this,this._engines.add(e),this._engineTimeCounterMap.set(e,{time:null,counter:0}),this._queue.add(e,t);const n=this._queue.time;this._resetTick(n,!0)}reset(e,t){if(e[s]&&(e=e[s]),void 0!==e[o]&&e[o]!==this)throw new Error("[sc-scheduler] Engine cannot be reset on this scheduler, it has been added to another scheduler");(0,i.hj)(t)?this._queue.move(e,t):this._remove(e);const n=this._queue.time;this._resetTick(n,!0)}remove(e){if(e[s]&&(e=e[s]),void 0!==e[o]&&e[o]!==this)throw new Error("[sc-scheduler] Engine cannot be removed from this scheduler, it has been added to another scheduler");this._remove(e);const t=this._queue.time;this._resetTick(t,!0)}clear(){for(let e of this._engines)delete e[o];this._queue.clear(),this._engines.clear(),this._engineTimeCounterMap.clear(),this._resetTick(1/0,!1)}_remove(e){delete e[o],this._queue.remove(e),this._engines.delete(e),this._engineTimeCounterMap.delete(e)}_tick(){const e=this._getTimeFunction();let t=this._queue.time;for(this._timeoutId=null;t<=e+this.lookahead;){this._currentTime=t;const n=this._currentTimeToAudioTimeFunction(t),r=t-e,a=this._queue.head,o=this._engineTimeCounterMap.get(a);let s=a(t,n,r);s===o.time?(o.counter+=1,o.counter>=this._maxEngineRecursion&&(console.warn(`[sc-scheduling] maxEngineRecursion (${this._maxEngineRecursion}) for the same engine at the same time: ${s} has been reached. This is generally due to a implementation issue, thus the engine has been discarded. If you know what you are doing, you should consider increasing the maxEngineRecursion option.`),s=1/0)):(o.time=s,o.counter=1),(0,i.hj)(s)?this._queue.move(a,s):this._remove(a),t=this._queue.time}this._currentTime=null,this._resetTick(t,!1)}_resetTick(e,t){const n=this._nextTime;if(this._nextTime=e,clearTimeout(this._timeoutId),this._nextTime!==1/0){this._verbose&&n===1/0&&console.log("[sc-scheduling] > scheduler start");const e=this._getTimeFunction(),i=this._nextTime-e,r=t?.001:this.period,a=Math.max(i-this.lookahead,r);this._timeoutId=setTimeout(this._tick,Math.ceil(1e3*a))}else n!==1/0&&this._verbose&&console.log("[sc-scheduling] > scheduler stop")}}}},i={};function r(e){var t=i[e];if(void 0!==t)return t.exports;var a=i[e]={exports:{}};return n[e].call(a.exports,a,a.exports,r),a.exports}r.m=n,r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.f={},r.e=e=>Promise.all(Object.keys(r.f).reduce(((t,n)=>(r.f[n](e,t),t)),[])),r.u=e=>e+".bundle.js",r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),e={},t="@ircam/sc-components-doc:",r.l=(n,i,a,o)=>{if(e[n])e[n].push(i);else{var s,l;if(void 0!==a)for(var c=document.getElementsByTagName("script"),d=0;d<c.length;d++){var u=c[d];if(u.getAttribute("src")==n||u.getAttribute("data-webpack")==t+a){s=u;break}}s||(l=!0,(s=document.createElement("script")).charset="utf-8",s.timeout=120,r.nc&&s.setAttribute("nonce",r.nc),s.setAttribute("data-webpack",t+a),s.src=n),e[n]=[i];var _=(t,i)=>{s.onerror=s.onload=null,clearTimeout(p);var r=e[n];if(delete e[n],s.parentNode&&s.parentNode.removeChild(s),r&&r.forEach((e=>e(i))),t)return t(i)},p=setTimeout(_.bind(null,void 0,{type:"timeout",target:s}),12e4);s.onerror=_.bind(null,s.onerror),s.onload=_.bind(null,s.onload),l&&document.head.appendChild(s)}},r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e;r.g.importScripts&&(e=r.g.location+"");var t=r.g.document;if(!e&&t&&(t.currentScript&&(e=t.currentScript.src),!e)){var n=t.getElementsByTagName("script");if(n.length)for(var i=n.length-1;i>-1&&!e;)e=n[i--].src}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),r.p=e})(),(()=>{var e={179:0};r.f.j=(t,n)=>{var i=r.o(e,t)?e[t]:void 0;if(0!==i)if(i)n.push(i[2]);else{var a=new Promise(((n,r)=>i=e[t]=[n,r]));n.push(i[2]=a);var o=r.p+r.u(t),s=new Error;r.l(o,(n=>{if(r.o(e,t)&&(0!==(i=e[t])&&(e[t]=void 0),i)){var a=n&&("load"===n.type?"missing":n.type),o=n&&n.target&&n.target.src;s.message="Loading chunk "+t+" failed.\n("+a+": "+o+")",s.name="ChunkLoadError",s.type=a,s.request=o,i[1](s)}}),"chunk-"+t,t)}};var t=(t,n)=>{var i,a,[o,s,l]=n,c=0;if(o.some((t=>0!==e[t]))){for(i in s)r.o(s,i)&&(r.m[i]=s[i]);l&&l(r)}for(t&&t(n);c<o.length;c++)a=o[c],r.o(e,a)&&e[a]&&e[a][0](),e[a]=0},n=self.webpackChunk_ircam_sc_components_doc=self.webpackChunk_ircam_sc_components_doc||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),r(980)})();