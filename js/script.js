const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const modeDeg = document.getElementById('modeDeg');
  const modeRad = document.getElementById('modeRad');
  const modeInv = document.getElementById('modeInv');
  const degToggle = document.getElementById('degToggle');
  const radToggle = document.getElementById('radToggle');
  const invToggle = document.getElementById('invToggle');

  let expression = '';
  let isDeg = true;
  let isInv = false;
  let justEvaluated = false;

  function factorial(n){
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function toRad(x){ return isDeg ? x * Math.PI / 180 : x; }
  function fromRad(x){ return isDeg ? x * 180 / Math.PI : x; }

  function applyFn(name, x){
    switch(name){
      case 'sin': return isInv ? fromRad(Math.asin(x)) : Math.sin(toRad(x));
      case 'cos': return isInv ? fromRad(Math.acos(x)) : Math.cos(toRad(x));
      case 'tan': return isInv ? fromRad(Math.atan(x)) : Math.tan(toRad(x));
      case 'log': return isInv ? Math.pow(10, x) : Math.log10(x);
      case 'ln':  return isInv ? Math.exp(x) : Math.log(x);
      case 'sqrt':return isInv ? x*x : Math.sqrt(x);
      default: return x;
    }
  }

  function updateModeDisplay(){
    modeDeg.classList.toggle('active', isDeg);
    modeRad.classList.toggle('active', !isDeg);
    modeInv.classList.toggle('active', isInv);
    degToggle.classList.toggle('on', isDeg);
    radToggle.classList.toggle('on', !isDeg);
    invToggle.classList.toggle('on', isInv);
  }

  function render(){
    exprEl.textContent = expression || '\u00A0';
  }

  function tokenizeAndEval(raw){
    // Replace constants
    let s = raw.replace(/π/g, 'PI_').replace(/\be\b/g, 'E_');

    // Handle factorial: number!  -> factorial(number)
    s = s.replace(/(\d+(\.\d+)?)!/g, 'FACT($1)');

    // Handle power: a^b -> Math.pow(a,b) is tricky with plain eval;
    // use a preprocessing pass converting ^ to **
    s = s.replace(/\^/g, '**');

    // Handle functions like sin(, cos(, log(, ln(, sqrt(
    s = s.replace(/sin\(/g, 'FN_sin(');
    s = s.replace(/cos\(/g, 'FN_cos(');
    s = s.replace(/tan\(/g, 'FN_tan(');
    s = s.replace(/log\(/g, 'FN_log(');
    s = s.replace(/ln\(/g, 'FN_ln(');
    s = s.replace(/√\(/g, 'FN_sqrt(');
    s = s.replace(/√(\d+(\.\d+)?)/g, 'FN_sqrt($1)');

    s = s.replace(/PI_/g, 'Math.PI');
    s = s.replace(/E_/g, 'Math.E');

    const FN_sin = x => applyFn('sin', x);
    const FN_cos = x => applyFn('cos', x);
    const FN_tan = x => applyFn('tan', x);
    const FN_log = x => applyFn('log', x);
    const FN_ln  = x => applyFn('ln', x);
    const FN_sqrt= x => applyFn('sqrt', x);
    const FACT   = x => factorial(x);

    // eslint-disable-next-line no-new-func
    const fn = new Function('FN_sin','FN_cos','FN_tan','FN_log','FN_ln','FN_sqrt','FACT','Math',
      `return (${s});`);
    return fn(FN_sin, FN_cos, FN_tan, FN_log, FN_ln, FN_sqrt, FACT, Math);
  }

  function press(value){
    if (justEvaluated && /[0-9.]/.test(value)) {
      expression = '';
    }
    justEvaluated = false;
    expression += value;
    render();
  }

  document.querySelectorAll('[data-op]').forEach(btn=>{
    btn.addEventListener('click', ()=> press(btn.dataset.op));
  });

  document.querySelectorAll('[data-const]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const c = btn.dataset.const === 'pi' ? 'π' : 'e';
      press(c);
    });
  });

  document.querySelectorAll('[data-fn]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = btn.dataset.fn;
      if (f === 'inv'){
        isInv = !isInv;
        updateModeDisplay();
        return;
      }
      if (f === 'sqrt'){ press('√('); return; }
      press(f + '(');
    });
  });

  document.querySelector('[data-action="clear"]').addEventListener('click', ()=>{
    expression = '';
    resultEl.textContent = '0';
    render();
  });

  document.querySelector('[data-action="back"]').addEventListener('click', ()=>{
    expression = expression.slice(0, -1);
    render();
  });

  document.querySelector('[data-action="equals"]').addEventListener('click', ()=>{
    if (!expression) return;
    try{
      const val = tokenizeAndEval(expression);
      if (val === undefined || val === null || Number.isNaN(val) || !Number.isFinite(val)){
        resultEl.textContent = 'ERRO';
      } else {
        const rounded = Math.round(val * 1e10) / 1e10;
        resultEl.textContent = String(rounded);
      }
      justEvaluated = true;
    }catch(e){
      resultEl.textContent = 'ERRO';
    }
  });

  degToggle.addEventListener('click', ()=>{ isDeg = true; updateModeDisplay(); });
  radToggle.addEventListener('click', ()=>{ isDeg = false; updateModeDisplay(); });
  invToggle.addEventListener('click', ()=>{ isInv = !isInv; updateModeDisplay(); });

  // Keyboard support
  window.addEventListener('keydown', (e)=>{
    if (/[0-9.+\-*/()]/.test(e.key)){ press(e.key); }
    else if (e.key === 'Enter'){ document.querySelector('[data-action="equals"]').click(); }
    else if (e.key === 'Backspace'){ document.querySelector('[data-action="back"]').click(); }
    else if (e.key === 'Escape'){ document.querySelector('[data-action="clear"]').click(); }
  });

  updateModeDisplay();
  render();
