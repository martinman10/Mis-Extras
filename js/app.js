// ============================================================
//  HORAX · Mis extras
//  Versión personal (una sola persona). Los datos se guardan en este dispositivo.
// ============================================================
const STORAGE_KEY = 'hxyo_data_v1';
const MODE_KEY = 'hxyo_mode';
const THEME_KEY = 'hxyo_theme';
const INSTALL_KEY = 'hxyo_install_dismissed';
const CIERRE_DIA = 25; // el período cierra el 25: va del 26 del mes anterior al 25, y se cobra el mes siguiente al cierre

const DEFAULT_SETTINGS = {
    name: '', theme: '#1E5AA8',
    rate: 0,        // valor de cada hora extra
    base: 0,        // sueldo base
    nightRate: 0,   // valor de cada hora nocturna
    weekendRate: 0, // valor de cada hora de fin de semana
    goal: 40,       // objetivo de horas por período
    min: 30,        // mínimo de horas por período
    workStart: ''   // 'AAAA-MM': primer mes de cobro (el aguinaldo no cuenta meses anteriores)
};
const FROZEN_FIELDS = ['rate', 'base', 'nightRate', 'weekendRate'];

// ============================================================
//  APARIENCIA (color + claro/oscuro)
// ============================================================
const THEME_DEFAULT = '#1E5AA8';
const THEME_COLORS = [
    { hex: '#1E5AA8', name: 'Azul' },
    { hex: '#1E3A5F', name: 'Azul marino' },
    { hex: '#2F6B4F', name: 'Verde bosque' },
    { hex: '#3F4A59', name: 'Grafito' },
    { hex: '#0F6B73', name: 'Petróleo' },
    { hex: '#8C2F39', name: 'Bordó' }
];
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(c) { return '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function mixRgb(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
function relLum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function contrastRatio(l1, l2) { return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
function onColorFor(hex) { return contrastRatio(relLum(hexToRgb(hex)), 1) >= 4.0 ? '#FFFFFF' : '#1B2330'; }

const DARK_CARD = [24, 28, 36];
function getModePref() { try { return localStorage.getItem(MODE_KEY) || 'auto'; } catch (_) { return 'auto'; } }
function isDarkNow() {
    const m = getModePref();
    if (m === 'dark') return true;
    if (m === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
let lastThemeHex = THEME_DEFAULT;
function applyAppearance() {
    document.documentElement.setAttribute('data-theme', isDarkNow() ? 'dark' : 'light');
    applyTheme(lastThemeHex);
}
function setModePref(m) {
    try { localStorage.setItem(MODE_KEY, m); } catch (_) {}
    applyAppearance();
    renderModeSeg();
}
function renderModeSeg() {
    const seg = document.getElementById('modeSeg');
    if (!seg) return;
    const cur = getModePref();
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.mode === cur));
}
try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (getModePref() === 'auto') applyAppearance(); });
} catch (_) {}

function applyTheme(hex) {
    const found = THEME_COLORS.find(c => c.hex.toLowerCase() === String(hex || '').toLowerCase());
    hex = found ? found.hex : THEME_DEFAULT;
    lastThemeHex = hex;
    const dark = isDarkNow();
    const rgb = hexToRgb(hex);
    const BLACK = [0, 0, 0], WHITE = [255, 255, 255];
    let ink = rgb, bg;
    if (dark) {
        const cardLum = relLum(DARK_CARD);
        for (let i = 1; i <= 20 && contrastRatio(relLum(ink), cardLum) < 4.5; i++) ink = mixRgb(rgb, WHITE, i * 0.05);
        bg = mixRgb(DARK_CARD, rgb, 0.22);
    } else {
        for (let i = 1; i <= 20 && contrastRatio(relLum(ink), 1) < 4.2; i++) ink = mixRgb(rgb, BLACK, i * 0.05);
        bg = mixRgb(rgb, WHITE, relLum(rgb) > 0.5 ? 0.6 : 0.88);
    }
    const st = document.documentElement.style;
    st.setProperty('--primary', hex);
    st.setProperty('--primary-rgb', rgb.join(', '));
    st.setProperty('--primary-dark', rgbToHex(mixRgb(rgb, BLACK, 0.15)));
    st.setProperty('--primary-light', rgbToHex(mixRgb(rgb, WHITE, 0.2)));
    st.setProperty('--primary-bg', rgbToHex(bg));
    st.setProperty('--primary-ink', rgbToHex(ink));
    st.setProperty('--primary-ink-light', rgbToHex(mixRgb(ink, WHITE, 0.25)));
    st.setProperty('--on-primary', onColorFor(hex));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0F1217' : hex);
    try { localStorage.setItem(THEME_KEY, hex); } catch (_) {}
}
try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (_) {}
applyAppearance();

// ============================================================
//  UTILIDADES
// ============================================================
const $ = id => document.getElementById(id);

function hoyMVD() {
    try {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const get = t => Number(parts.find(p => p.type === t).value);
        return { year: get('year'), month: get('month') - 1, day: get('day') };
    } catch (_) {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
}
function hoyDate() { const h = hoyMVD(); return new Date(h.year, h.month, h.day); }
function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseDate(ds) { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); }
function todayStr() { return formatDate(hoyDate()); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function monthName(m) { return capitalize(new Date(2000, m, 1).toLocaleDateString('es-ES', { month: 'long' })); }
function fmtDayMonth(d) { return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', ''); }
function formatDateDisplay(ds) { return parseDate(ds).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); }
function weekdayShort(ds) { return parseDate(ds).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''); }
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function entryHours(e) { const d = timeToMin(e.end) - timeToMin(e.start); return (d < 0 ? d + 1440 : d) / 60; } // fin menor que inicio = termina al día siguiente
function endedAt(e) { const [h, m] = e.end.split(':').map(Number), d = parseDate(e.date); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (e.end < e.start ? 1 : 0), h, m) <= new Date(); }
function fmtHours(h) { return String(Math.round(h * 100) / 100).replace('.', ','); }
function fmtMoney(n) {
    n = Math.round(n * 100) / 100;
    let s;
    try { s = Math.abs(n).toLocaleString('es-UY', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }); } catch (_) { s = String(Math.abs(n)); }
    return (n < 0 ? '−$ ' : '$ ') + s;
}
// "30.842" y "30842" valen lo mismo; "35,99" y "35.99" también
function parseNum(str) {
    let s = String(str == null ? '' : str).trim().replace(/\s/g, '').replace(/^\$/, '');
    if (s === '') return null;
    const t = s.replace(/[x×]/gi, '*');
    if (/^-?\d+([.,]\d+)?([*+\/-]\d+([.,]\d+)?)+$/.test(t)) { try { const v = Function('return ' + t.replace(/,/g, '.'))(); return isFinite(v) ? Math.round(v * 100) / 100 : NaN; } catch (_) { return NaN; } }
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    else if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const n = Number(s);
    return isFinite(n) ? n : NaN;
}
function numToInput(n) { return (n == null || n === 0) ? '' : String(n).replace('.', ','); }

let toastTimeout = null;
function showToast(msg, ms = 2400) {
    const el = $('toast');
    if (!el) return;
    el.classList.remove('has-action');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), ms);
}

function showConfirm({ title = '¿Estás seguro?', message = '', okText = 'Confirmar', cancelText = 'Cancelar', danger = false, warn = false } = {}) {
    return new Promise(resolve => {
        const modal = $('confirmModal');
        $('confirmTitle').textContent = title;
        $('confirmMessage').textContent = message;
        const icon = $('confirmIcon');
        icon.classList.toggle('danger', danger);
        icon.innerHTML = danger ? '<i class="fas fa-trash-alt"></i>' : '<i class="fas fa-triangle-exclamation"></i>';
        const okBtn = $('confirmOkBtn'), cancelBtn = $('confirmCancelBtn');
        okBtn.textContent = okText; cancelBtn.textContent = cancelText;
        okBtn.classList.toggle('btn-danger', danger);
        okBtn.classList.toggle('btn-warn', warn);
        modal.style.display = 'flex';
        function cleanup(result) {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlay(ev) { if (ev.target.id === 'confirmModal') cleanup(false); }
        function onKey(ev) { if (ev.key === 'Escape') cleanup(false); }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
    });
}

// ============================================================
//  DATOS (se guardan en este dispositivo)
//  data = { settings, entries: [{id,date,start,end,done,comment}],
//           periods: { 'AAAA-MM': { goal, min, night, weekend, rate, base, nightRate, weekendRate,
//                                    expenses: [{id,name,amount,paid}], incomes: [{id,name,amount}] } } }
// ============================================================
let data = loadData();

function emptyData() { return { settings: { ...DEFAULT_SETTINGS }, entries: [], periods: {}, people: [] }; }
function normalizeData(raw) {
    const d = emptyData();
    if (!raw || typeof raw !== 'object') return d;
    d.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
    d.people = Array.isArray(raw.people) ? raw.people.map((x, i) => ({ id: x.id || i + 1, name: String(x.name || ''), amount: Number(x.amount) || 0 })) : [];
    d.entries = Array.isArray(raw.entries) ? raw.entries.filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && /^\d{2}:\d{2}$/.test(e.start) && /^\d{2}:\d{2}$/.test(e.end)).map((e, i) => ({
        id: Number.isFinite(e.id) ? e.id : i + 1, date: e.date, start: e.start, end: e.end, done: !!e.done, comment: String(e.comment || '')
    })) : [];
    const seen = new Set();
    d.entries.forEach(e => { while (seen.has(e.id)) e.id++; seen.add(e.id); });
    if (raw.periods && typeof raw.periods === 'object') {
        for (const [k, p] of Object.entries(raw.periods)) {
            if (!/^\d{4}-\d{2}$/.test(k) || !p || typeof p !== 'object') continue;
            const q = { ...p };
            q.expenses = Array.isArray(p.expenses) ? p.expenses.map((x, i) => ({ id: x.id || i + 1, name: String(x.name || ''), amount: Number(x.amount) || 0, paid: !!x.paid, due: Math.min(31, Math.max(0, parseInt(x.due, 10) || 0)) })) : [];
            q.incomes = Array.isArray(p.incomes) ? p.incomes.map((x, i) => ({ id: x.id || i + 1, name: String(x.name || ''), amount: Number(x.amount) || 0, received: !!x.received })) : [];
            d.periods[k] = q;
        }
    }
    return d;
}
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return normalizeData(JSON.parse(raw));
    } catch (e) { console.error('No se pudo leer lo guardado', e); }
    return emptyData();
}
function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); localStorage.setItem('hxyo_cloud_ts', String(Date.now())); }
    catch (e) { console.error(e); showToast('No se pudo guardar en este dispositivo'); }
    cloudQueuePush();
}
function nextId(list) { return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1; }

// ============================================================
//  PERÍODOS: del 26 al 25. Se identifican por el mes en que se cobran.
//  Ej.: "2026-12" = extras del 26/10 al 25/11, a cobrar en diciembre.
// ============================================================
function periodKeyOf(ds) {
    const [y, m, d] = ds.split('-').map(Number);
    const idx = y * 12 + (m - 1) + (d > CIERRE_DIA ? 1 : 0) + 1;
    return `${Math.floor(idx / 12)}-${String(idx % 12 + 1).padStart(2, '0')}`;
}
function parseKey(key) { const [y, m] = key.split('-').map(Number); return { year: y, month: m - 1 }; }
function shiftKey(key, delta) {
    const { year, month } = parseKey(key);
    const idx = year * 12 + month + delta;
    return `${Math.floor(idx / 12)}-${String(idx % 12 + 1).padStart(2, '0')}`;
}
function periodRange(key) {
    const { year, month } = parseKey(key);
    const startDate = new Date(year, month - 2, CIERRE_DIA + 1);
    const endDate = new Date(year, month - 1, CIERRE_DIA);
    return { startDate, endDate, start: formatDate(startDate), end: formatDate(endDate) };
}
function currentKey() { return periodKeyOf(todayStr()); }
function getPeriod(key) { return data.periods[key] || { expenses: [], incomes: [] }; }
function ensurePeriod(key) {
    if (!data.periods[key]) data.periods[key] = { expenses: [], incomes: [] };
    const p = data.periods[key];
    if (!p.expenses) p.expenses = [];
    if (!p.incomes) p.incomes = [];
    return p;
}
function byDateTime(a, b) { return (a.date + a.start).localeCompare(b.date + b.start); }
function sumBy(list, fn) { return list.reduce((s, x) => s + fn(x), 0); }

// ============================================================
//  AGUINALDO (Uruguay): dos medios aguinaldos por año.
//  Junio: remuneraciones de dic–may, se paga hasta el 30/6.
//  Diciembre: remuneraciones de jun–nov, se paga hasta el 20/12.
//  Medio aguinaldo = suma de lo ganado en el semestre ÷ 12.
//  Acá: los 6 períodos que se cobran de ene–jun (o jul–dic), cada uno = base + extras hechas + nocturnas + finde.
// ============================================================
const AGUINALDO_DUE = { 5: { day: 30, text: '30 de junio' }, 11: { day: 20, text: '20 de diciembre' } };
function periodTotal(key) {
    const p = getPeriod(key), s = data.settings, r = periodRange(key);
    const eff = f => (p[f] > 0 ? p[f] : s[f]);
    const hDone = sumBy(data.entries.filter(e => e.done && e.date >= r.start && e.date <= r.end), entryHours);
    if (p.cobroReal > 0) return p.cobroReal; // se trabaja solo con el líquido que cobrás
    return eff('base') + hDone * eff('rate') + (p.night || 0) * eff('nightRate') + (p.weekend || 0) * eff('weekendRate');
}
function aguinaldoInfo(key) {
    const { year, month } = parseKey(key);
    const due = AGUINALDO_DUE[month];
    if (!due) return null;
    const ws = data.settings.workStart || '';
    const keys = [-5, -4, -3, -2, -1, 0].map(d => shiftKey(key, d));
    const sum = sumBy(keys, k => (ws && k < ws) ? 0 : periodTotal(k));
    const dueDate = new Date(year, month, due.day);
    const manual = (getPeriod(key).incomes || []).some(x => /aguinaldo/i.test(x.name));
    return { key, amount: Math.round(sum / 12 * 100) / 100, sum, keys, dueDate, dueText: due.text, manual,
        daysLeft: Math.round((dueDate - hoyDate()) / 86400000) };
}
function nextAguinaldoKey(fromKey) {
    for (let d = 0; d <= 6; d++) { const k = shiftKey(fromKey, d); if (AGUINALDO_DUE[parseKey(k).month]) return k; }
    return null;
}
function daysText(n) { return n === 0 ? 'hoy' : n === 1 ? 'mañana' : n > 0 ? `en ${n} días` : `hace ${-n} ${n === -1 ? 'día' : 'días'}`; }

function calc(key) {
    const p = getPeriod(key), s = data.settings;
    const eff = f => (p[f] > 0 ? p[f] : s[f]); // 0 en un período = sin cargar → vale lo de Ajustes
    const r = periodRange(key);
    const list = data.entries.filter(e => e.date >= r.start && e.date <= r.end).sort(byDateTime);
    const hoursAll = sumBy(list, entryHours);
    const hoursDone = sumBy(list.filter(e => e.done), entryHours);
    const rate = eff('rate'), base = eff('base');
    const extras = hoursDone * rate;
    const extrasPending = (hoursAll - hoursDone) * rate;
    const night = p.night || 0, weekend = p.weekend || 0;
    const nightPay = night * eff('nightRate'), weekendPay = weekend * eff('weekendRate');
    const total = base + extras + nightPay + weekendPay;
    const devol = p.devol || 0, cobroReal = p.cobroReal > 0 ? p.cobroReal : 0, cobro = (cobroReal || total) + devol; // como COBRE + DEVOLUCIONES del Excel
    const goal = p.goal != null ? p.goal : s.goal;
    const min = p.min != null ? p.min : s.min;
    const expenses = p.expenses || [], incomes = p.incomes || [];
    const ag = aguinaldoInfo(key), agAmount = ag && !ag.manual ? ag.amount : 0;
    const expTotal = sumBy(expenses, x => x.amount), incTotal = sumBy(incomes, x => x.amount) + agAmount;
    const advance = sumBy(expenses.filter(x => /adelanto/i.test(x.name)), x => x.amount);
    return {
        key, range: r, list, hoursAll, hoursDone, hoursPending: hoursAll - hoursDone,
        rate, base, extras, extrasPending, night, weekend, nightPay, weekendPay, total, cobro, cobroReal, devol,
        goal, min, remaining: Math.max(0, goal - hoursAll), remainingMin: Math.max(0, min - hoursAll),
        expenses, incomes, expTotal, incTotal, ag, agAmount, advance, net: total - advance,
        left: cobro + incTotal - expTotal, salaryReceived: !!p.salaryReceived,
        haveNow: (p.salaryReceived ? cobro : 0) + sumBy(incomes.filter(x => x.received), x => x.amount) - sumBy(expenses.filter(x => x.paid), x => x.amount),
        expPending: sumBy(expenses.filter(x => !x.paid), x => x.amount)
    };
}

// ============================================================
//  EXTRAS: alta, edición, baja
// ============================================================
function overlapping(date, start, end, exceptId) {
    const a = timeToMin(start); let b = timeToMin(end); if (b < a) b += 1440;
    return data.entries.some(e => {
        if (e.id === exceptId || e.date !== date) return false;
        const c = timeToMin(e.start); let d = timeToMin(e.end); if (d < c) d += 1440;
        return c < b && a < d;
    });
}
function addEntry(date, start, end, comment, done) {
    data.entries.push({ id: nextId(data.entries), date, start, end, done: !!done, comment: (comment || '').trim() });
    saveData(); renderAll();
}
function toggleDone(id) {
    const e = data.entries.find(x => x.id === id);
    if (e) { e.done = !e.done; saveData(); renderAll(); }
}
function deleteEntry(id) {
    snapshot();
    data.entries = data.entries.filter(e => e.id !== id);
    saveData(); renderAll(); showUndoToast('Extra eliminada');
}
async function confirmDeleteEntry(id) {
    const ok = await showConfirm({ title: '¿Eliminar esta extra?', message: 'Después podés deshacerlo.', okText: 'Eliminar', danger: true });
    if (ok) deleteEntry(id);
}

let editingEntryId = null;
function openEditModal(id) {
    const e = data.entries.find(x => x.id === id);
    if (!e) return;
    editingEntryId = id;
    $('editDate').value = e.date; $('editStart').value = e.start; $('editEnd').value = e.end;
    $('editComment').value = e.comment || '';
    $('editModal').style.display = 'flex';
}
function closeEditModal() { editingEntryId = null; $('editModal').style.display = 'none'; }
async function saveEditFromModal() {
    const e = data.entries.find(x => x.id === editingEntryId);
    if (!e) return;
    const date = $('editDate').value, start = $('editStart').value, end = $('editEnd').value;
    if (!date || !start || !end) { showToast('Completá fecha y horario'); return; }
    if (start === end) { showToast('El inicio y el final no pueden ser iguales'); return; }
    if (overlapping(date, start, end, e.id)) {
        const ok = await showConfirm({ title: 'Se pisa con otra extra', message: 'Ya tenés una extra en ese horario. ¿Guardar igual?', okText: 'Guardar igual', warn: true });
        if (!ok) return;
    }
    e.date = date; e.start = start; e.end = end; e.comment = $('editComment').value.trim();
    selectedDate = date;
    saveData(); closeEditModal(); renderAll(); showToast('Extra actualizada');
}

// ============================================================
//  CALENDARIO
// ============================================================
let currentYear = hoyMVD().year;
let currentMonth = hoyMVD().month;
let selectedDate = todayStr();
let currentTab = 'tabCalendar';

function rateFor(ds) { const p = getPeriod(periodKeyOf(ds)); return p.rate > 0 ? p.rate : data.settings.rate; }
function entriesOn(ds) { return data.entries.filter(e => e.date === ds).sort(byDateTime); }
function dayStatus(ds) {
    const l = entriesOn(ds);
    if (!l.length) return 'none';
    return l.every(e => e.done) ? 'done' : 'pending';
}

function renderCalendar() {
    const grid = $('calendarGrid');
    $('monthLabel').innerHTML = `${monthName(currentMonth)} <small>${currentYear}</small>`;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();
    const today = todayStr();
    const withOT = new Set(data.entries.map(e => e.date));
    const sp = periodRange(periodKeyOf(selectedDate || today));
    const cellCls = (ds, extra) => {
        let c = 'day-cell' + (extra || '');
        c += (ds >= sp.start && ds <= sp.end) ? ' in-cycle' : ' out-cycle';
        if (ds === sp.start) c += ' p-start';
        if (ds === sp.end) c += ' p-end';
        if (withOT.has(ds)) { c += ' has-overtime ' + dayStatus(ds); }
        if (ds === today) c += ' today';
        if (ds === selectedDate) c += ' selected';
        return c;
    };
    let html = '';
    for (const n of ['L', 'M', 'M', 'J', 'V', 'S', 'D']) html += `<div class="day-name">${n}</div>`;
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = startOffset - 1; i >= 0; i--) {
        const day = daysInPrev - i, ds = formatDate(new Date(currentYear, currentMonth - 1, day));
        html += `<button class="${cellCls(ds, ' other-month')}" data-date="${ds}">${day}</button>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = formatDate(new Date(currentYear, currentMonth, d));
        html += `<button class="${cellCls(ds)}" data-date="${ds}"><span class="day-number">${d}</span></button>`;
    }
    const remaining = (7 - ((startOffset + daysInMonth) % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const ds = formatDate(new Date(currentYear, currentMonth + 1, d));
        html += `<button class="${cellCls(ds, ' other-month')}" data-date="${ds}">${d}</button>`;
    }
    grid.innerHTML = html;

    // El mes en pantalla cae en parte en dos períodos: se avisa cuál es el que corre hoy
    const cur = sp, isCur = periodKeyOf(selectedDate || today) === currentKey();
    const toClose = Math.round((cur.endDate - hoyDate()) / 86400000);
    $('calLegend').innerHTML = `<span class="lg"><i class="lg-dot pending"></i>Pendiente</span><span class="lg"><i class="lg-dot done"></i>Hecha</span>`
        + `<span class="lg"><i class="lg-dot cyc"></i>Período del ${fmtDayMonth(cur.startDate)} al ${fmtDayMonth(cur.endDate)}${isCur && toClose >= 0 ? ' · cierra ' + daysText(toClose) : ''}</span>`;
    const isThisMonth = currentYear === hoyMVD().year && currentMonth === hoyMVD().month;
    $('todayBarCal').style.display = isThisMonth ? 'none' : 'flex';
    renderDayDetail(selectedDate);
}

function renderDayDetail(ds) {
    const content = $('dayDetailContent');
    if (!ds) {
        $('detailDayName').textContent = 'Seleccioná un día'; $('detailDateBadge').textContent = '—'; content.innerHTML = '';
        return;
    }
    $('detailDayName').textContent = capitalize(parseDate(ds).toLocaleDateString('es-ES', { weekday: 'long' }));
    $('detailDateBadge').textContent = formatDateDisplay(ds);
    const list = entriesOn(ds);
    if (!list.length) {
        content.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><p>Sin extras este día</p></div>`;
        return;
    }
    content.innerHTML = list.map(e => {
        const h = entryHours(e);
        return `<div class="ot-item ${e.done ? 'done' : ''}" data-id="${e.id}">
            <div class="ot-check ${e.done ? 'checked' : ''}" data-act="toggle" data-id="${e.id}">${e.done ? '<i class="fas fa-check"></i>' : ''}</div>
            <div class="ot-info">
                <div class="ot-person">${e.start} – ${e.end}</div>
                <div class="ot-time">${fmtHours(h)} h${rateFor(e.date) ? ' · ' + fmtMoney(h * rateFor(e.date)) : ''}</div>
                ${e.comment ? `<div class="ot-comment"><i class="fas fa-comment-dots"></i> ${escapeHtml(e.comment)}</div>` : ''}
            </div>
            <button class="ot-edit" data-act="edit" data-id="${e.id}" aria-label="Editar"><i class="fas fa-pen"></i></button>
            <button class="ot-edit" data-act="dup" data-id="${e.id}" aria-label="Duplicar"><i class="fas fa-copy"></i></button>
            <button class="ot-delete" data-act="delete" data-id="${e.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </div>`;
    }).join('');
}

function handleEntryAction(act, id) {
    if (act === 'dup') { const e = data.entries.find(x => x.id === id); if (e) { switchTab('tabAdd'); $('addStart').value = e.start; $('addEnd').value = e.end; $('addComment').value = e.comment || ''; updateHoursPreview(); showToast('Elegí la fecha y guardá'); } return; }
    if (act === 'toggle') toggleDone(id);
    else if (act === 'edit') openEditModal(id);
    else if (act === 'delete') confirmDeleteEntry(id);
}

// ============================================================
//  NAVEGACIÓN DE PERÍODO (Resumen y Plata comparten el mismo)
// ============================================================
let periodKey = currentKey();

function renderPeriodNav() {
    const { year, month } = parseKey(periodKey);
    const r = periodRange(periodKey);
    const html = `<button data-pshift="-1" aria-label="Período anterior"><i class="fas fa-chevron-left"></i></button>
        <span class="month-label range">${fmtDayMonth(r.startDate)} → ${fmtDayMonth(r.endDate)}<small>se cobra en ${monthName(month).toLowerCase()} ${year}</small></span>
        <button data-pshift="1" aria-label="Período siguiente"><i class="fas fa-chevron-right"></i></button>`;
    $('navSummary').innerHTML = html; $('navMoney').innerHTML = html;
    const cmp = periodKey === currentKey() ? 0 : (periodKey < currentKey() ? -1 : 1);
    const left = Math.round((r.endDate - hoyDate()) / 86400000);
    const sub = cmp === 0 ? `Período en curso · cierra el ${fmtDayMonth(r.endDate)} (${left === 0 ? 'hoy' : left === 1 ? 'mañana' : 'faltan ' + left + ' días'})`
        : cmp < 0 ? 'Período cerrado' : 'Todavía no empieza';
    $('subSummary').textContent = sub; $('subMoney').textContent = sub;
    const away = periodKey !== currentKey();
    $('todayBarSum').style.display = away ? 'flex' : 'none';
    $('todayBarMoney').style.display = away ? 'flex' : 'none';
}

// ============================================================
//  RESUMEN
// ============================================================
function renderSummary() {
    renderPeriodNav();
    const c = calc(periodKey);
    const box = $('summaryContainer');
    const noValues = !c.rate && !c.base;

    // --- cuánto se cobra
    let lines = '';
    lines += `<div class="hero-line"><span>Sueldo base</span><b>${fmtMoney(c.base)}</b></div>`;
    lines += `<div class="hero-line"><span>Extras hechas (${fmtHours(c.hoursDone)} h)</span><b>${fmtMoney(c.extras)}</b></div>`;
    if (c.night) lines += `<div class="hero-line"><span>Nocturnas (${fmtHours(c.night)} h)</span><b>${fmtMoney(c.nightPay)}</b></div>`;
    if (c.weekend) lines += `<div class="hero-line"><span>Fin de semana (${fmtHours(c.weekend)} h)</span><b>${fmtMoney(c.weekendPay)}</b></div>`;
    if (c.hoursPending > 0 && c.rate) lines += `<div class="hero-line"><span>Extras por hacer (${fmtHours(c.hoursPending)} h)</span><b>+ ${fmtMoney(c.extrasPending)}</b></div>`;
    if (c.advance > 0) lines += `<div class="hero-line"><span>Subtotal antes del adelanto</span><b>${fmtMoney(c.total)}</b></div><div class="hero-line strong"><span>− Adelanto que ya cobraste</span><b>− ${fmtMoney(c.advance)}</b></div>`;
    const hero = `<div class="hero-card">
        <div class="hero-label">${c.advance > 0 ? 'Total del mes · ya sin el adelanto' : 'Total del mes'}</div>
        <div class="hero-amount">${fmtMoney(c.advance > 0 ? c.net : c.total)}</div>
        <div class="hero-lines">${lines}</div>
        ${noValues ? `<div class="hero-hint"><i class="fas fa-circle-info"></i> Cargá tu valor hora y sueldo base en Ajustes (tocá tu perfil, arriba a la izquierda).</div>` : ''}
    </div>`;

    // --- horas
    const scale = Math.max(c.goal, c.hoursAll, c.min, 1);
    const pct = h => Math.min(100, (h / scale) * 100);
    const minOk = c.hoursAll >= c.min, goalOk = c.hoursAll >= c.goal;
    const dias3 = Math.ceil(c.remaining / 3), dias6 = Math.ceil(c.remaining / 6);
    const hoursCard = `<div class="card">
        <div class="card-head"><h3>Horas del período</h3><button class="mini-btn" data-act="period-settings"><i class="fas fa-sliders"></i> Ajustar mes</button></div>
        <div class="prog-top"><div class="prog-big">${fmtHours(c.hoursAll)} <small>de ${fmtHours(c.goal)} h</small></div></div>
        <div class="prog-bar">
            <div class="prog-seg pend" style="width:${pct(c.hoursAll)}%"></div>
            <div class="prog-seg done" style="width:${pct(c.hoursDone)}%"></div>
            ${c.min > 0 ? `<div class="prog-mark" style="left:calc(${pct(c.min)}% - 1px)" title="Mínimo"></div>` : ''}
        </div>
        <div class="prog-legend">
            <span class="lg"><i class="lg-dot done"></i>${fmtHours(c.hoursDone)} h hechas</span>
            <span class="lg"><i class="lg-dot pend"></i>${fmtHours(c.hoursPending)} h por hacer</span>
            <span class="lg"><i class="lg-dot min"></i>Mínimo</span>
        </div>
        <div class="goal-rows">
            <div class="goal-row"><span>Mínimo · ${fmtHours(c.min)} h${c.rate ? ` <small>(${fmtMoney(c.min * c.rate)})</small>` : ''}</span><span class="pill ${minOk ? 'ok' : 'go'}">${minOk ? 'COMPLETO' : 'FALTAN ' + fmtHours(c.remainingMin) + ' H'}</span></div>
            <div class="goal-row"><span>Objetivo · ${fmtHours(c.goal)} h${c.rate ? ` <small>(${fmtMoney(c.goal * c.rate)})</small>` : ''}</span><span class="pill ${goalOk ? 'ok' : 'go'}">${goalOk ? 'COMPLETO' : 'EN PROGRESO'}</span></div>
        </div>
        ${c.remaining > 0 ? `<div class="faltan">Para llegar al objetivo faltan <b>${fmtHours(c.remaining)} h</b>: son <b>${dias3}</b> ${dias3 === 1 ? 'día' : 'días'} de 3 h o <b>${dias6}</b> ${dias6 === 1 ? 'día' : 'días'} de 6 h.</div>`
            : `<div class="faltan">¡Objetivo cumplido! Ya pasaste las ${fmtHours(c.goal)} h.</div>`}
    </div>`;

    // --- lista de extras
    let listHtml;
    if (!c.list.length) {
        listHtml = `<div class="empty-state"><i class="fas fa-calendar-plus"></i><p>No hay extras en este período</p><p class="empty-hint">Agregalas desde la pestaña “Agregar”.</p></div>`;
    } else {
        listHtml = c.list.map(e => {
            const h = entryHours(e);
            const d = parseDate(e.date);
            return `<div class="sum-detail-item ${e.done ? 'done' : ''}">
                <div class="sd-day"><b>${d.getDate()}</b><small>${weekdayShort(e.date)}</small></div>
                <div class="sd-info"><span class="sd-time">${e.start} – ${e.end}</span><span class="sd-note">${e.comment ? escapeHtml(e.comment) : capitalize(d.toLocaleDateString('es-ES', { month: 'long' }))}</span></div>
                <div class="sd-right"><span class="sd-h">${fmtHours(h)} h</span>${c.rate ? `<span class="sd-money">${fmtMoney(h * c.rate)}</span>` : ''}</div>
                <button class="sd-btn sd-check ${e.done ? 'checked' : ''}" data-act="toggle" data-id="${e.id}" aria-label="${e.done ? 'Marcar como pendiente' : 'Marcar como hecha'}"><i class="fas fa-check"></i></button>
                <button class="sd-btn sd-edit" data-act="edit" data-id="${e.id}" aria-label="Editar"><i class="fas fa-pen"></i></button>
                <button class="sd-btn sd-delete" data-act="delete" data-id="${e.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        }).join('');
    }
    const listCard = `<div class="card extras-list-card">
        <div class="card-head"><h3>Extras (${c.list.length})</h3><span class="card-aside">${fmtHours(c.hoursAll)} h</span></div>
        ${listHtml}
        ${c.hoursPending > 0 ? `<button type="button" class="sum-markall" data-act="mark-all"><i class="fas fa-check-double"></i> Marcar todas como hechas</button>` : ''}
    </div>`;

    box.innerHTML = hero + hoursCard + listCard
        + `<div class="export-row"><button class="btn-secondary" data-act="export-pdf"><i class="fas fa-file-pdf"></i> Compartir PDF</button><button class="btn-secondary" data-act="export-csv"><i class="fas fa-file-excel"></i> Bajar Excel</button></div>
           <div class="summary-footer"></div>`;
}

async function markAllDone() {
    const c = calc(periodKey);
    const pend = c.list.filter(e => !e.done);
    if (!pend.length) return;
    const ok = await showConfirm({ title: '¿Marcar todas como hechas?', message: `Se marcan ${pend.length} ${pend.length === 1 ? 'extra' : 'extras'} de este período.`, okText: 'Marcar todas', warn: true });
    if (!ok) return;
    snapshot();
    pend.forEach(e => { e.done = true; });
    saveData(); renderAll(); showUndoToast('Listo, quedaron como hechas');
}

// ============================================================
//  AJUSTAR PERÍODO (objetivo, mínimo, nocturnas, fin de semana)
// ============================================================
function openPeriodModal() {
    const c = calc(periodKey), { year, month } = parseKey(periodKey);
    $('periodModalTitle').textContent = `Ajustar ${monthName(month).toLowerCase()} ${year}`;
    $('perGoal').value = numToInput(c.goal); $('perMin').value = numToInput(c.min);
    $('perNight').value = numToInput(c.night); $('perWeekend').value = numToInput(c.weekend);
    $('perCobro').value = numToInput(c.cobroReal); $('perDevol').value = numToInput(c.devol);
    $('periodModal').style.display = 'flex';
}
function closePeriodModal() { $('periodModal').style.display = 'none'; }
function savePeriodModal() {
    const goal = parseNum($('perGoal').value), min = parseNum($('perMin').value);
    const night = parseNum($('perNight').value), weekend = parseNum($('perWeekend').value);
    const cobroReal = parseNum($('perCobro').value), devol = parseNum($('perDevol').value);
    if ([goal, min, night, weekend, cobroReal, devol].some(v => Number.isNaN(v) || (v != null && v < 0))) { showToast('Revisá los números'); return; }
    const p = ensurePeriod(periodKey);
    p.goal = goal == null ? data.settings.goal : goal;
    p.min = min == null ? data.settings.min : min;
    p.night = night || 0; p.weekend = weekend || 0; p.cobroReal = cobroReal || 0; p.devol = devol || 0; delete p.haberes;
    saveData(); closePeriodModal(); renderAll(); showToast('Mes actualizado');
}

// ============================================================
//  PLATA: gastos e ingresos del período
// ============================================================
let moneyMoreOpen = false;
function renderMoney() {
    renderPeriodNav();
    const c = calc(periodKey);
    const box = $('moneyContainer');
    const item = (x, kind) => `<div class="fin-item ${kind === 'exp' && x.paid ? 'paid' : ''}">
        ${kind === 'exp' ? `<button class="sd-btn sd-check ${x.paid ? 'checked' : ''}" data-act="pay" data-id="${x.id}" aria-label="${x.paid ? 'Marcar como no pagado' : 'Marcar como pagado'}"><i class="fas fa-check"></i></button>` : `<button class="sd-btn sd-check ${x.received ? 'checked' : ''}" data-act="recv" data-id="${x.id}" aria-label="Marcar como cobrado"><i class="fas fa-check"></i></button>`}
        <span class="fin-name">${escapeHtml(x.name || 'Sin nombre')}${kind === 'exp' && x.due ? ` <small class="due ${dueState(x)}">vence el ${x.due}</small>` : ''}</span>
        <span class="fin-amt">${fmtMoney(x.amount)}</span>
        <button class="sd-btn sd-edit" data-act="item-edit" data-kind="${kind}" data-id="${x.id}" aria-label="Editar"><i class="fas fa-pen"></i></button>
        <button class="sd-btn sd-delete" data-act="item-del" data-kind="${kind}" data-id="${x.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
    </div>`;

    const money = c.cobro + sumBy(c.incomes.filter(x => x.received), x => x.amount), paidAmt = c.expTotal - c.expPending;
    const pct = money > 0 ? paidAmt / money : 0, barCol = paidAmt === 0 ? '#9aa3af' : pct > 0.6 ? '#e06666' : pct >= 0.4 ? '#2b5c8f' : '#b6d7a8'; // mismos colores que CONSUMO del Excel
    let left = `<div class="card">
        <div class="card-head"><h3>Me quedan</h3><span class="card-aside">${c.left < 0 ? 'Te falta plata' : 'Después de pagar todo'}</span></div>
        <div class="fin-big ${c.left < 0 ? 'neg' : ''}">${fmtMoney(c.left)}</div>
        <div class="fin-lines">
            <div class="fin-line"><span>Sueldo${c.devol ? ' + devoluciones' : ''}</span><b>${fmtMoney(c.cobro)}</b></div>
            <div class="fin-line"><span>Ingresos</span><b>+ ${fmtMoney(c.incTotal)}</b></div>
            <div class="fin-line"><span>Gastos</span><b>− ${fmtMoney(c.expTotal)}</b></div>
        </div>
        <div class="fin-lines soft">
            <div class="fin-line"><span>Falta pagar</span><b>${fmtMoney(c.expPending)}</b></div>
            <div class="fin-line"><span>Tengo ahora</span><b>${fmtMoney(c.haveNow)}</b></div>
        </div>
        <div class="fin-actions"><button class="mini-btn ${c.salaryReceived ? 'primary' : ''}" data-act="salary-toggle"><i class="fas fa-check"></i> ${c.salaryReceived ? 'Sueldo cobrado' : 'Ya cobré el sueldo'}</button> <button class="mini-btn" data-act="period-settings"><i class="fas fa-pen"></i> Ajustar cobro</button></div>
    </div>`;

    const agCard = (() => {
        const fmtMes = k => monthName(parseKey(k).month).toLowerCase();
        const ag = c.ag || aguinaldoInfo(nextAguinaldoKey(periodKey));
        if (!ag) return '';
        const here = !!c.ag;
        const manualAmt = here && ag.manual ? sumBy(c.incomes.filter(x => /aguinaldo/i.test(x.name)), x => x.amount) : null;
        const note = here && ag.manual ? `Se usa el que cargaste. La app estima ${fmtMoney(ag.amount)} (diferencia ${fmtMoney((manualAmt || 0) - ag.amount)}).`
            : `Suma de los 6 cobros de ${fmtMes(ag.keys[0])} a ${fmtMes(ag.keys[5])} (${fmtMoney(ag.sum)}) ÷ 12. Es una estimación con lo que tenés cargado.`;
        return `<div class="card">
            <div class="card-head"><h3>${here ? 'Aguinaldo' : 'Próximo aguinaldo'}</h3><span class="card-aside">${ag.dueText}</span></div>
            <div class="fin-big">${fmtMoney(manualAmt != null ? manualAmt : ag.amount)}</div>
            <div class="fin-eq">${note}</div>
            <div class="fin-sub"><span>Fecha límite</span><span>${fmtDayMonth(ag.dueDate)} ${ag.dueDate.getFullYear()}</span></div>
            <div class="fin-sub"><span>${ag.daysLeft >= 0 ? 'Faltan' : 'Pasó hace'}</span><span>${Math.abs(ag.daysLeft)} ${Math.abs(ag.daysLeft) === 1 ? 'día' : 'días'}</span></div>
            ${here ? '' : `<div class="fin-sub"><span>Entra en el período de</span><span>${fmtMes(ag.key)}</span></div>`}
        </div>`;
    })();

    const exp = `<div class="card">
        <div class="card-head"><h3>Gastos</h3><button class="mini-btn primary" data-act="item-add" data-kind="exp"><i class="fas fa-plus"></i> Agregar</button></div>
        ${c.expenses.length ? [...c.expenses].sort((a, b) => (a.paid - b.paid) || ((a.due || 99) - (b.due || 99))).map(x => item(x, 'exp')).join('') : `<div class="fin-empty">Todavía no cargaste gastos en este período.</div>`}
        ${c.expenses.length ? `<div class="fin-total"><span>Total gastos</span><span>${fmtMoney(c.expTotal)}</span></div>` : ''}
        <div class="fin-actions"><button class="mini-btn" data-act="copy-prev"><i class="fas fa-copy"></i> Copiar gastos del período anterior</button></div>
    </div>`;

    const inc = `<div class="card">
        <div class="card-head"><h3>Ingresos</h3><button class="mini-btn primary" data-act="item-add" data-kind="inc"><i class="fas fa-plus"></i> Agregar</button></div>
        ${c.agAmount ? `<div class="fin-item"><span class="fin-name">Aguinaldo <small>(automático)</small></span><span class="fin-amt">${fmtMoney(c.agAmount)}</span></div>` : ''}
        ${c.incomes.length ? c.incomes.filter(x => x.amount > 0).map(x => item(x, 'inc')).join('') + (c.incomes.some(x => !(x.amount > 0)) ? `<div class="fin-actions">${c.incomes.filter(x => !(x.amount > 0)).map(x => `<button class="mini-btn" data-act="item-edit" data-kind="inc" data-id="${x.id}">${escapeHtml(x.name || 'Sin nombre')} · $0</button>`).join('')}</div>` : '') : (c.agAmount ? '' : `<div class="fin-empty">Sin otros ingresos en este período.</div>`)}
        ${c.incomes.length || c.agAmount ? `<div class="fin-total"><span>Total ingresos</span><span>${fmtMoney(c.incTotal)}</span></div>` : ''}
    </div>`;

    const pnet = sumBy(data.people, x => x.amount);
    const ppl = `<div class="card">
        <div class="card-head"><h3>Cuentas con personas</h3><button class="mini-btn primary" data-act="item-add" data-kind="ppl"><i class="fas fa-plus"></i> Agregar</button></div>
        ${data.people.length ? data.people.map(x => `<div class="fin-item"><span class="fin-name">${escapeHtml(x.name || 'Sin nombre')} <small>${x.amount < 0 ? 'se lo debo' : 'me debe'}</small></span><span class="fin-amt">${fmtMoney(Math.abs(x.amount))}</span>
            <button class="sd-btn sd-edit" data-act="item-edit" data-kind="ppl" data-id="${x.id}" aria-label="Editar"><i class="fas fa-pen"></i></button>
            <button class="sd-btn sd-delete" data-act="item-del" data-kind="ppl" data-id="${x.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button></div>`).join('') : `<div class="fin-empty">Nadie te debe ni le debés. Ej: Pilar · 16593</div>`}
        ${data.people.length ? `<div class="fin-total"><span>${pnet < 0 ? 'En total debés' : 'En total te deben'}</span><span>${fmtMoney(Math.abs(pnet))}</span></div>` : ''}
    </div>`;
    const more = `<details class="more-details" id="moreDetails" ${moneyMoreOpen ? 'open' : ''}><summary>Más detalle <small>cuotas, aguinaldo, cuentas con personas</small></summary>
        ${cuotasCard(c)}${agCard}${ppl}
        <div class="fin-actions"><button class="mini-btn" data-act="load-receipts"><i class="fas fa-file-invoice-dollar"></i> Cargar recibos 2026</button></div></details>`;
    box.innerHTML = left + exp + inc + more + `<div class="summary-footer"></div>`;
    const md = $('moreDetails'); if (md) md.addEventListener('toggle', () => { moneyMoreOpen = md.open; });
}

let editingItem = null; // { kind, id|null }
function openItemModal(kind, id) {
    const p = getPeriod(periodKey);
    const list = kind === 'ppl' ? data.people : kind === 'exp' ? p.expenses : p.incomes;
    const it = id != null ? (list || []).find(x => x.id === id) : null;
    editingItem = { kind, id: it ? it.id : null };
    $('itemModalTitle').textContent = (it ? 'Editar ' : 'Agregar ') + (kind === 'exp' ? 'gasto' : kind === 'ppl' ? 'cuenta con una persona' : 'ingreso');
    $('itemAmount').placeholder = kind === 'ppl' ? 'Positivo: me debe · Negativo: le debo' : '0';
    $('itemName').value = it ? it.name : '';
    $('itemAmount').value = it ? numToInput(it.amount) : '';
    $('itemDue').value = it && it.due ? it.due : ''; $('itemDueGroup').style.display = kind === 'exp' ? '' : 'none';
    $('itemError').style.display = 'none';
    // sugerencias con los nombres que ya usaste
    const names = new Set();
    Object.values(data.periods).forEach(pp => (kind === 'exp' ? pp.expenses : pp.incomes).forEach(x => x.name && names.add(x.name.replace(/\s*\d+\s+de\s+\d+\s*$/i, '').trim())));
    $('itemNames').innerHTML = Array.from(names).sort((a, b) => a.localeCompare(b, 'es')).map(n => `<option value="${escapeHtml(n)}">`).join('');
    $('itemModal').style.display = 'flex';
    setTimeout(() => $('itemName').focus(), 120);
}
function closeItemModal() { editingItem = null; $('itemModal').style.display = 'none'; }
async function saveItemModal() {
    if (!editingItem) return;
    const name = $('itemName').value.trim();
    const amount = parseNum($('itemAmount').value);
    const err = $('itemError');
    if (!name) { err.textContent = 'Poné de qué se trata.'; err.style.display = 'block'; return; }
    if (amount == null || Number.isNaN(amount) || (amount < 0 && editingItem.kind !== 'ppl')) { err.textContent = 'Escribí un valor válido (por ejemplo 1500).'; err.style.display = 'block'; return; }
    const p = ensurePeriod(periodKey);
    const list = editingItem.kind === 'ppl' ? data.people : editingItem.kind === 'exp' ? p.expenses : p.incomes;
    const due = Math.min(31, Math.max(0, parseInt($('itemDue').value, 10) || 0));
    if (editingItem.id != null) {
        const it = list.find(x => x.id === editingItem.id);
        if (it) { it.name = name; it.amount = amount; if (editingItem.kind === 'exp') it.due = due; }
    } else {
        const it = { id: nextId(list), name, amount };
        if (editingItem.kind === 'exp') { it.paid = false; it.due = due; }
        list.push(it);
    }
    const isAdv = editingItem.kind === 'inc' && editingItem.id == null && /adelanto/i.test(name) && amount > 0;
    saveData(); closeItemModal(); renderAll(); showToast('Guardado');
    if (isAdv) await chainAdvance(amount);
}
async function deleteItem(kind, id) {
    const ok = await showConfirm({ title: kind === 'exp' ? '¿Eliminar este gasto?' : kind === 'ppl' ? '¿Eliminar esta cuenta?' : '¿Eliminar este ingreso?', message: 'Después podés deshacerlo.', okText: 'Eliminar', danger: true });
    if (!ok) return;
    snapshot();
    const p = ensurePeriod(periodKey);
    if (kind === 'ppl') data.people = data.people.filter(x => x.id !== id);
    else if (kind === 'exp') p.expenses = p.expenses.filter(x => x.id !== id);
    else p.incomes = p.incomes.filter(x => x.id !== id);
    saveData(); renderAll(); showUndoToast('Eliminado');
}
function toggleReceived(id) {
    const x = ensurePeriod(periodKey).incomes.find(y => y.id === id);
    if (x) { x.received = !x.received; saveData(); renderAll(); }
}
function toggleSalary() { const p = ensurePeriod(periodKey); p.salaryReceived = !p.salaryReceived; saveData(); renderAll(); }
function togglePaid(id) {
    const x = ensurePeriod(periodKey).expenses.find(y => y.id === id);
    if (x) { x.paid = !x.paid; saveData(); renderAll(); }
}

// "CELU 16 de 18" → "CELU 17 de 18"; si ya era la última cuota, no se copia
function dueState(x) {
    if (!x.due || x.paid) return '';
    const { year, month } = parseKey(periodKey), d = new Date(year, month, Math.min(x.due, new Date(year, month + 1, 0).getDate())), t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((d - t) / 864e5); return diff < 0 ? 'late' : diff <= 3 ? 'soon' : '';
}
function cuotasCard(c) {
    const rows = [];
    c.expenses.forEach(x => { const m = (x.name || '').match(/^(.*?)(\d+)\s+de\s+(\d+)\s*$/i); if (m) rows.push({ name: m[1].trim() || x.name, cur: +m[2], tot: +m[3], amt: x.amount, left: +m[3] - +m[2] }); });
    if (!rows.length) return '';
    const { year, month } = parseKey(c.key), debt = rows.reduce((s, r) => s + r.left * r.amt, 0), free = {};
    rows.forEach(r => { free[r.left] = (free[r.left] || 0) + r.amt; });
    let acc = 0;
    const frees = Object.keys(free).map(Number).sort((a, b) => a - b).map(k => { acc += free[k]; const d = new Date(year, month + k + 1, 1); return `<div class="fin-sub"><span>Desde ${monthName(d.getMonth()).toLowerCase()} ${d.getFullYear()} liberás</span><span>+ ${fmtMoney(acc)} por mes</span></div>`; }).join('');
    return `<div class="card"><div class="card-head"><h3>Cuotas</h3><span class="card-aside">${rows.length} activas</span></div>
        ${rows.map(r => `<div class="fin-sub"><span>${escapeHtml(r.name)} ${r.cur}/${r.tot} · ${r.left ? 'faltan ' + r.left : 'es la última'}</span><span>${fmtMoney(r.left * r.amt)}</span></div>`).join('')}
        <div class="fin-total"><span>Falta en cuotas después de este mes</span><span>${fmtMoney(debt)}</span></div>${frees}</div>`;
}
// Recibos de sueldo 2026: el líquido de cada mes va en el período del mes siguiente (cuando se cobra)
const RECIBOS_2026 = { '2026-02': 35278.25, '2026-03': 49103.26, '2026-04': 38108.35, '2026-05': 41884.01, '2026-06': 25977.75, '2026-07': 33571.66, '2026-08': 31793.57, '2026-09': 31869.37, '2026-10': 28946.38, '2026-11': 33067.27 };
const RECIBOS_EXTRA = [{ key: '2026-06', name: 'Aguinaldo', amount: 22099.18 }, { key: '2026-09', name: 'Licencia', amount: 12199.55 }];
function applyReceipts() {
    let n = 0;
    for (const [k, v] of Object.entries(RECIBOS_2026)) {
        const p = ensurePeriod(k);
        if (!(p.cobroReal > 0)) { p.cobroReal = v; n++; }
        if (k <= '2026-10' && p.salaryReceived === undefined) p.salaryReceived = true;
    }
    for (const x of RECIBOS_EXTRA) {
        const p = ensurePeriod(x.key);
        if (!p.incomes.some(i => i.name === x.name)) p.incomes.push({ id: nextId(p.incomes), name: x.name, amount: x.amount, received: true });
    }
    return n;
}
async function loadReceipts() {
    const ok = await showConfirm({ title: '¿Cargar los recibos de 2026?', message: 'Pone el líquido de cada recibo como cobro real (febrero a noviembre) y suma el aguinaldo y la licencia como ingresos. No pisa lo que ya cargaste.', okText: 'Cargar' });
    if (!ok) return;
    snapshot();
    const n = applyReceipts();
    saveData(); renderAll(); showUndoToast(`Recibos cargados: ${n}`);
}
async function chainAdvance(amount) {
    const nk = shiftKey(periodKey, 1);
    const ok = await showConfirm({ title: '¿Descontarlo del próximo cobro?', message: `Se agrega un gasto "ADELANTO ${fmtMoney(amount)}" en el período que se cobra en ${monthName(parseKey(nk).month).toLowerCase()}, para que se descuente.`, okText: 'Agregar', cancelText: 'No' });
    if (!ok) return;
    const np = ensurePeriod(nk); np.expenses.push({ id: nextId(np.expenses), name: 'ADELANTO', amount, paid: false, due: 0 });
    saveData(); renderAll(); showToast('Descuento agregado al próximo período');
}
function nextInstallment(name) {
    const m = name.match(/^(.*?)(\d+)\s+de\s+(\d+)\s*$/i);
    if (!m) return name;
    const cur = parseInt(m[2], 10), tot = parseInt(m[3], 10);
    if (cur >= tot) return null;
    return `${m[1]}${cur + 1} de ${tot}`;
}
async function copyPrevExpenses() {
    const prev = getPeriod(shiftKey(periodKey, -1));
    if (!prev.expenses || !prev.expenses.length) { showToast('El período anterior no tiene gastos'); return; }
    const p = ensurePeriod(periodKey);
    if (p.expenses.length) {
        const ok = await showConfirm({ title: '¿Copiar igual?', message: 'Este período ya tiene gastos. Se agregan los del período anterior a los que ya hay.', okText: 'Copiar', warn: true });
        if (!ok) return;
    }
    snapshot();
    let n = 0, skipped = 0;
    for (const x of prev.expenses) {
        if (/adelanto/i.test(x.name)) { skipped++; continue; }
        const name = nextInstallment(x.name);
        if (name === null) { skipped++; continue; }
        p.expenses.push({ id: nextId(p.expenses), name, amount: x.amount, paid: false, due: x.due || 0 });
        n++;
    }
    saveData(); renderAll();
    showUndoToast(`Copiados ${n} ${n === 1 ? 'gasto' : 'gastos'}${skipped ? ` (${skipped} no se copian: cuotas terminadas o adelantos)` : ''}`);
}

// ============================================================
//  AGREGAR
// ============================================================
let addDone = false, addDoneManual = false;
function syncAddDone() {
    if (!addDoneManual) addDone = ($('addDate').value || todayStr()) <= todayStr();
    const sw = $('addDoneToggle');
    sw.classList.toggle('on', addDone);
    sw.setAttribute('aria-checked', addDone ? 'true' : 'false');
}
function updateHoursPreview() {
    const s = $('addStart').value, e = $('addEnd').value, el = $('hoursPreview');
    if (!s || !e) { el.innerHTML = ''; return; }
    if (s === e) { el.innerHTML = '<span style="color:#EF4444;">El inicio y el final no pueden ser iguales</span>'; return; }
    const h = entryHours({ start: s, end: e });
    const key = periodKeyOf($('addDate').value || todayStr());
    const rate = calc(key).rate;
    el.innerHTML = `Son <b>${fmtHours(h)} h</b>${rate ? ` · <b>${fmtMoney(h * rate)}</b>` : ''} <span style="color:var(--text-light)">(período de ${monthName(parseKey(key).month).toLowerCase()})</span>${e < s ? ' · <b>termina al día siguiente</b>' : ''}`;
}
function renderShiftChips() {
    const counts = new Map();
    data.entries.forEach(e => { const k = e.start + '|' + e.end; counts.set(k, (counts.get(k) || 0) + 1); });
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const box = $('shiftChips');
    box.style.display = top.length ? 'flex' : 'none';
    box.innerHTML = top.map(([k]) => { const [s, e] = k.split('|'); return `<button type="button" class="person-chip" data-start="${s}" data-end="${e}">${s} – ${e}</button>`; }).join('');
}
async function submitAdd() {
    const date = $('addDate').value, start = $('addStart').value, end = $('addEnd').value;
    if (!date || !start || !end) { showToast('Completá fecha y horario'); return; }
    if (start === end) { showToast('El inicio y el final no pueden ser iguales'); return; }
    if (overlapping(date, start, end)) {
        const ok = await showConfirm({ title: 'Se pisa con otra extra', message: 'Ya tenés una extra en ese horario. ¿Guardar igual?', okText: 'Guardar igual', warn: true });
        if (!ok) return;
    }
    const rep = parseInt($('addRepeat').value, 10) || 0, dates = [date];
    if (rep) { const last = periodRange(periodKeyOf(date)).endDate; let d = parseDate(date); for (;;) { d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + rep); if (d > last) break; dates.push(formatDate(d)); } }
    if (dates.length > 1) {
        const hh = entryHours({ start, end }), clash = dates.slice(1).filter(ds => overlapping(ds, start, end)).length;
        const ok = await showConfirm({ title: `Se crean ${dates.length} extras`, message: `Del ${fmtDayMonth(parseDate(dates[0]))} al ${fmtDayMonth(parseDate(dates[dates.length - 1]))}: ${fmtHours(hh)} h cada una, ${fmtHours(hh * dates.length)} h en total (${fmtMoney(hh * dates.length * rateFor(date))}). Las repetidas quedan pendientes.${clash ? ` ${clash} se pisan con otras extras.` : ''}`, okText: 'Crear todas', warn: true });
        if (!ok) return;
    }
    const cm = $('addComment').value.trim();
    dates.forEach((ds, i) => data.entries.push({ id: nextId(data.entries), date: ds, start, end, done: i === 0 && !!addDone, comment: cm }));
    saveData(); renderAll(); $('addRepeat').value = '0';
    $('addComment').value = '';
    addDoneManual = false;
    const d = parseDate(date);
    currentYear = d.getFullYear(); currentMonth = d.getMonth(); selectedDate = date;
    periodKey = periodKeyOf(date);
    showToast(dates.length > 1 ? `${dates.length} extras agregadas` : `Extra agregada · ${fmtHours(entryHours({ start, end }))} h`);
    switchTab('tabCalendar');
}

// ============================================================
//  EXPORTAR / COPIA DE SEGURIDAD
// ============================================================
function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
async function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    try {
        const file = new File([blob], filename, { type: mime });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
            await navigator.share({ files: [file], title: filename });
            return;
        }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportCsv() {
    const c = calc(periodKey), { year, month } = parseKey(periodKey);
    const num = n => String(Math.round(n * 100) / 100).replace('.', ',');
    const rows = [['Fecha', 'Desde', 'Hasta', 'Horas', 'Valor $', 'Hecha', 'Comentario']];
    c.list.forEach(e => rows.push([e.date, e.start, e.end, num(entryHours(e)), num(entryHours(e) * c.rate), e.done ? 'Sí' : 'No', e.comment]));
    rows.push([]);
    rows.push(['Horas hechas', '', '', num(c.hoursDone), num(c.extras)]);
    rows.push(['Horas por hacer', '', '', num(c.hoursPending), num(c.extrasPending)]);
    rows.push(['Sueldo base', '', '', '', num(c.base)]);
    rows.push(['Total del mes', '', '', '', num(c.total)]);
    if (c.advance) rows.push(['Total − adelanto', '', '', '', num(c.net)]);
    rows.push([]);
    rows.push(['Gastos', '', '', '', '']);
    c.expenses.forEach(x => rows.push([x.name, '', '', '', num(x.amount), x.paid ? 'Pagado' : '']));
    rows.push(['Total gastos', '', '', '', num(c.expTotal)]);
    rows.push(['Ingresos', '', '', '', '']);
    c.incomes.forEach(x => rows.push([x.name, '', '', '', num(x.amount)]));
    if (c.agAmount) rows.push(['Aguinaldo (automático)', '', '', '', num(c.agAmount)]);
    rows.push(['Total ingresos', '', '', '', num(c.incTotal)]);
    rows.push(['Me quedan', '', '', '', num(c.left)]);
    const csv = '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
    downloadFile(`extras-${year}-${String(month + 1).padStart(2, '0')}.csv`, csv, 'text/csv;charset=utf-8');
}
// ============================================================
//  EXPORTAR (Excel y PDF): mismo formato que la planilla — encabezado y primera columna celestes, celdas grises, bordes negros
// ============================================================
const EXP_BLUE = 'A7C4E4', EXP_GRAY = 'F3F3F3';
function expDM(d) { return `${+d.slice(8)}/${+d.slice(5, 7)}`; }
function r2(n) { return Math.round(n * 100) / 100; }
function exportBlocks(c) {
    const b = [];
    b.push({ head: ['DIA', 'DESDE', 'HASTA', 'CANTIDAD'], kinds: ['t', 't', 't', 'h'],
        rows: c.list.map(e => [expDM(e.date), e.start, e.end, r2(entryHours(e))]),
        foot: [['TOTAL', '', '', r2(c.hoursAll)], ['HECHAS', '', '', r2(c.hoursDone)], ['POR HACER', '', '', r2(c.hoursPending)]] });
    const cobro = [['Sueldo base', r2(c.base)], [`Extras hechas (${fmtHours(c.hoursDone)} h)`, r2(c.extras)]];
    if (c.night) cobro.push([`Nocturnas (${fmtHours(c.night)} h)`, r2(c.nightPay)]);
    if (c.weekend) cobro.push([`Fin de semana (${fmtHours(c.weekend)} h)`, r2(c.weekendPay)]);
    const cf = [['TOTAL DEL MES', r2(c.total)]];
    if (c.advance > 0) cf.push(['TOTAL − ADELANTO', r2(c.net)]);
    if (c.cobroReal) cf.push(['COBRO REAL', r2(c.cobroReal + c.devol)]);
    b.push({ head: ['A COBRAR', 'VALOR EN $'], kinds: ['t', 'm'], rows: cobro, foot: cf });
    if (c.expenses.length) b.push({ head: ['GASTOS', 'VALOR EN $', '¿ESTÁ PAGO?'], kinds: ['t', 'm', 't'],
        rows: c.expenses.map(x => [x.name || 'Sin nombre', r2(x.amount), x.paid ? 'SÍ' : 'NO']),
        foot: [['TOTAL', r2(c.expTotal), ''], ['DEBO PAGAR', r2(c.expPending), '']] });
    const inc = c.incomes.map(x => [x.name || 'Sin nombre', r2(x.amount), x.received ? 'SÍ' : 'NO']);
    if (c.agAmount) inc.push(['Aguinaldo (automático)', r2(c.agAmount), 'NO']);
    if (inc.length) b.push({ head: ['INGRESOS', 'VALOR EN $', '¿ESTÁ?'], kinds: ['t', 'm', 't'], rows: inc, foot: [['TOTAL', r2(c.incTotal), '']] });
    b.push({ head: ['ME QUEDAN', 'VALOR EN $'], kinds: ['t', 'm'], rows: [], foot: [['ME QUEDAN', r2(c.left)]], onlyFoot: true });
    return b;
}
let exljsPromise = null;
function loadExcelJs() {
    if (window.ExcelJS) return Promise.resolve(true);
    if (!exljsPromise) exljsPromise = loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js').then(ok => { if (!ok) exljsPromise = null; return ok; });
    return exljsPromise;
}
async function exportXlsx() {
    const c = calc(periodKey), { year, month } = parseKey(periodKey), r = c.range;
    if (!(await loadExcelJs())) { showToast('Sin conexión: se baja en formato simple (CSV)'); exportCsv(); return; }
    const wb = new window.ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${monthName(month)} ${year}`.slice(0, 31), { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }];
    const thin = { style: 'thin', color: { argb: 'FF000000' } }, border = { top: thin, left: thin, bottom: thin, right: thin };
    const fill = rgb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rgb } });
    const t = ws.addRow([`A COBRAR EN ${monthName(month).toUpperCase()} ${year}`]); t.font = { bold: true, size: 14 };
    const sub = ws.addRow([`Extras del ${fmtDayMonth(r.startDate)} al ${fmtDayMonth(r.endDate)}${data.settings.name ? ' · ' + data.settings.name : ''}`]); sub.font = { color: { argb: 'FF666666' }, size: 10 };
    ws.addRow([]);
    const style = (cell, blue, kind) => {
        cell.fill = fill(blue ? EXP_BLUE : EXP_GRAY); cell.border = border; cell.font = { bold: true, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (kind === 'm' && typeof cell.value === 'number') cell.numFmt = '"$" #,##0.00';
        else if (kind === 'h' && typeof cell.value === 'number') cell.numFmt = '0.##';
    };
    exportBlocks(c).forEach(bl => {
        if (!bl.onlyFoot) { const hr = ws.addRow(bl.head); hr.height = 22; hr.eachCell(cell => style(cell, true, 't')); }
        bl.rows.forEach(row => { const rr = ws.addRow(row); rr.height = 20; rr.eachCell({ includeEmpty: true }, (cell, i) => { if (i <= bl.head.length) style(cell, i === 1, bl.kinds[i - 1]); }); });
        bl.foot.forEach(row => { const rr = ws.addRow(row); rr.height = 20; rr.eachCell({ includeEmpty: true }, (cell, i) => { if (i <= bl.head.length) style(cell, i === 1, bl.kinds[i - 1]); }); });
        ws.addRow([]);
    });
    const buf = await wb.xlsx.writeBuffer();
    await downloadFile(`extras-${year}-${String(month + 1).padStart(2, '0')}.xlsx`, new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast('Excel listo');
}
function backupNow() {
    const payload = { app: 'horax-mis-extras', version: 1, exportedAt: new Date().toISOString(), data };
    downloadFile(`mis-extras-copia-${todayStr()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}
async function restoreFromFile(file) {
    if (!file) return;
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch (_) { showToast('Ese archivo no se puede leer'); return; }
    const raw = parsed && parsed.data ? parsed.data : parsed;
    if (!raw || !Array.isArray(raw.entries)) { showToast('Ese archivo no parece una copia de Mis extras'); return; }
    const incoming = normalizeData(raw);
    const ok = await showConfirm({
        title: '¿Cargar esta copia?',
        message: `Trae ${incoming.entries.length} extras. Reemplaza todo lo que hay ahora en este dispositivo (${data.entries.length} extras).`,
        okText: 'Cargar copia', warn: true
    });
    if (!ok) return;
    snapshot();
    data = incoming;
    saveData();
    applyTheme(data.settings.theme);
    periodKey = currentKey();
    applyProfileToHeader();
    closeSettings(true);
    renderAll();
    showUndoToast('Copia cargada');
}
async function wipeAll() {
    const ok = await showConfirm({ title: '¿Borrar todo?', message: 'Se borran todas las extras, gastos, ingresos y ajustes de este dispositivo.' + (cloud.user ? ' La copia en la nube también se borra.' : '') + ' Si te arrepentís, tenés unos segundos para deshacer.', okText: 'Borrar todo', danger: true });
    if (!ok) return;
    snapshot();
    data = emptyData();
    saveData();
    applyTheme(THEME_DEFAULT);
    periodKey = currentKey();
    applyProfileToHeader();
    closeSettings(true);
    renderAll();
    showUndoToast('Todo borrado');
}

// ============================================================
//  AJUSTES
// ============================================================
let pendingTheme = THEME_DEFAULT;
function renderThemeSwatches() {
    const box = $('themeSwatches');
    box.innerHTML = THEME_COLORS.map(c => {
        const sel = c.hex.toLowerCase() === pendingTheme.toLowerCase();
        return `<button type="button" class="theme-swatch ${sel ? 'sel' : ''}" data-hex="${c.hex}" style="background:${c.hex};" title="${c.name}" aria-label="${c.name}" aria-pressed="${sel}">${sel ? `<i class="fas fa-check" style="color:${onColorFor(c.hex)};"></i>` : ''}</button>`;
    }).join('');
}
function applyProfileToHeader() {
    const s = data.settings;
    applyTheme(s.theme);
    const name = (s.name || '').trim();
    $('headerTitle').textContent = name || 'Mis extras';
    $('headerSubtitle').textContent = name ? 'HORAX · mis extras' : 'HORAX · lo mío';
    const ini = name ? name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
    $('profileIcon').innerHTML = ini ? escapeHtml(ini) : '<i class="fas fa-clock"></i>';
}
function openSettings() {
    const s = data.settings;
    $('setName').value = s.name || '';
    $('setRate').value = numToInput(s.rate); $('setBase').value = numToInput(s.base);
    $('setNight').value = numToInput(s.nightRate); $('setWeekend').value = numToInput(s.weekendRate);
    $('setGoal').value = numToInput(s.goal); $('setMin').value = numToInput(s.min);
    $('setWorkStart').value = s.workStart || '';
    pendingTheme = s.theme || THEME_DEFAULT;
    renderThemeSwatches(); renderModeSeg(); updateSettingsAvatar(); renderCloud();
    $('settingsError').style.display = 'none';
    $('settingsBody').scrollTop = 0;
    $('settingsModal').style.display = 'flex';
}
function closeSettings(force) {
    $('settingsModal').style.display = 'none';
    applyTheme(data.settings.theme); // deshace la vista previa si no se guardó
}
function updateSettingsAvatar() {
    const n = $('setName').value.trim();
    const ini = n ? n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
    $('profileAvatar').innerHTML = ini ? escapeHtml(ini) : '<i class="fas fa-clock"></i>';
}
function saveSettings() {
    const err = $('settingsError');
    const vals = {
        rate: parseNum($('setRate').value), base: parseNum($('setBase').value),
        nightRate: parseNum($('setNight').value), weekendRate: parseNum($('setWeekend').value),
        goal: parseNum($('setGoal').value), min: parseNum($('setMin').value)
    };
    if (Object.values(vals).some(v => Number.isNaN(v) || (v != null && v < 0))) {
        err.textContent = 'Revisá los números: tienen que ser valores como 333 o 35,99.';
        err.style.display = 'block'; return;
    }
    const s = data.settings;
    const next = {
        rate: vals.rate || 0, base: vals.base || 0, nightRate: vals.nightRate || 0, weekendRate: vals.weekendRate || 0,
        goal: vals.goal == null ? DEFAULT_SETTINGS.goal : vals.goal, min: vals.min == null ? DEFAULT_SETTINGS.min : vals.min
    };
    // los períodos anteriores al actual conservan los valores que tenían antes del cambio
    const changed = FROZEN_FIELDS.filter(f => (s[f] || 0) > 0 && (s[f] || 0) !== next[f]); // solo si ya había un valor cargado
    if (changed.length) {
        const cur = currentKey();
        const keys = new Set(Object.keys(data.periods));
        data.entries.forEach(e => keys.add(periodKeyOf(e.date)));
        keys.forEach(k => {
            if (k >= cur) return;
            const p = ensurePeriod(k);
            changed.forEach(f => { if (p[f] == null) p[f] = s[f] || 0; });
        });
    }
    ['goal', 'min'].forEach(f => {
        if (s[f] !== next[f]) {
            const cur = currentKey();
            const keys = new Set(Object.keys(data.periods));
            data.entries.forEach(e => keys.add(periodKeyOf(e.date)));
            keys.forEach(k => { if (k < cur) { const p = ensurePeriod(k); if (p[f] == null) p[f] = s[f]; } });
        }
    });
    Object.assign(s, next);
    s.name = $('setName').value.trim();
    s.workStart = /^\d{4}-\d{2}$/.test($('setWorkStart').value) ? $('setWorkStart').value : '';
    s.theme = pendingTheme;
    saveData();
    applyProfileToHeader();
    $('settingsModal').style.display = 'none';
    renderAll();
    showToast('Ajustes guardados');
}

// ============================================================
//  DESHACER (guarda una foto de todo antes de una acción grande)
// ============================================================
let undoSnap = null;
function snapshot() { try { undoSnap = JSON.stringify(data); } catch (_) { undoSnap = null; } }
function showUndoToast(msg, ms = 6000) {
    const el = $('toast'); if (!el) return;
    el.innerHTML = `<span>${escapeHtml(msg)}</span><button type="button" class="toast-undo" id="toastUndo">Deshacer</button>`;
    el.classList.add('show', 'has-action');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { el.classList.remove('show', 'has-action'); undoSnap = null; }, ms);
}
function undoLast() {
    if (!undoSnap) return;
    data = normalizeData(JSON.parse(undoSnap)); undoSnap = null;
    saveData(); applyTheme(data.settings.theme); applyProfileToHeader(); renderAll();
    showToast('Deshecho');
}

// ============================================================
//  PDF DEL PERÍODO (se arma en el celu y se comparte con el menú del sistema)
// ============================================================
let h2pPromise = null;
function loadScript(src) {
    return new Promise(res => {
        const s = document.createElement('script'); s.src = src; s.async = true;
        s.onload = () => res(true); s.onerror = () => { s.remove(); res(false); };
        document.head.appendChild(s);
    });
}
async function loadHtml2pdf() {
    if (window.html2pdf) return true;
    if (!h2pPromise) h2pPromise = loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js').then(ok => { if (!ok) h2pPromise = null; return ok; });
    return h2pPromise;
}
function pdfHtml(c) {
    const { year, month } = parseKey(c.key), r = c.range;
    const cell = (v, kind, blue) => `<td style="border:1px solid #000;padding:7px 6px;text-align:center;font-weight:700;font-size:13px;background:#${blue ? EXP_BLUE : EXP_GRAY};">${typeof v === 'number' ? (kind === 'm' ? fmtMoney(v) : fmtHours(v)) : escapeHtml(String(v))}</td>`;
    const head = h => `<tr>${h.map(x => `<th style="border:1px solid #000;padding:8px 6px;text-align:center;font-weight:800;font-size:14px;background:#${EXP_BLUE};">${escapeHtml(x)}</th>`).join('')}</tr>`;
    const body = (rows, bl) => rows.map(row => `<tr style="page-break-inside:avoid;">${row.slice(0, bl.head.length).map((v, i) => cell(v, bl.kinds[i], i === 0)).join('')}</tr>`).join('');
    const tables = exportBlocks(c).map(bl => `<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-top:18px;page-break-inside:auto;">${bl.onlyFoot ? '' : head(bl.head)}${body(bl.rows, bl)}${body(bl.foot, bl)}</table>`).join('');
    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:6px;">
        <div style="font-size:20px;font-weight:800;">A COBRAR EN ${monthName(month).toUpperCase()} ${year}</div>
        <div style="font-size:12px;color:#666;margin-top:3px;">Extras del ${fmtDayMonth(r.startDate)} al ${fmtDayMonth(r.endDate)}${data.settings.name ? ' · ' + escapeHtml(data.settings.name) : ''}</div>
        ${tables}
        <p style="margin-top:20px;font-size:10px;color:#999;">Generado el ${new Date().toLocaleDateString('es-UY')} con Mis extras.</p></div>`;
}
async function exportPdf() {
    const c = calc(periodKey), { year, month } = parseKey(periodKey);
    showToast('Armando el PDF…', 6000);
    if (!(await loadHtml2pdf())) { showToast('No se pudo cargar el generador de PDF. Revisá la conexión.', 3500); return; }
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:0;top:0;width:700px;background:#fff;z-index:-1;';
    wrap.innerHTML = pdfHtml(c); document.body.appendChild(wrap);
    try {
        const blob = await window.html2pdf().set({
            margin: 10, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] }
        }).from(wrap.firstElementChild).outputPdf('blob');
        await downloadFile(`extras-${year}-${String(month + 1).padStart(2, '0')}.pdf`, blob, 'application/pdf');
        showToast('PDF listo');
    } catch (e) { console.error(e); showToast('No se pudo armar el PDF'); }
    finally { wrap.remove(); }
}

// ============================================================
//  COPIA EN LA NUBE (opcional): Google + Firestore. Un documento por persona: extras/{uid}
//  Sin configurar (firebase-config.js vacío) la app funciona igual, solo en este dispositivo.
// ============================================================
const CLOUD_TS_KEY = 'hxyo_cloud_ts';        // cuándo cambió por última vez lo de este dispositivo
const CLOUD_SYNCED_KEY = 'hxyo_cloud_synced'; // versión de la nube con la que quedó igual la última vez
const FB_VER = '10.13.2';
const cloud = { ready: false, user: null, db: null, auth: null, status: 'ok', timer: null, busy: false };
const lsNum = k => Number(localStorage.getItem(k)) || 0;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
function cloudConfigured() { const c = window.MIS_EXTRAS_FIREBASE; return !!(c && c.apiKey && c.projectId && c.appId); }
function hasLocalData() { const s = data.settings; return data.entries.length > 0 || Object.keys(data.periods).length > 0 || s.rate > 0 || s.base > 0; }
function cloudRef() { return cloud.db.collection('extras').doc(cloud.user.uid); }
function cloudStatus(s) { cloud.status = s; renderCloud(); }
function renderCloud() {
    const t = $('cloudTitle'); if (!t) return;
    const sub = $('cloudSub'), hint = $('cloudHint');
    if (!cloudConfigured()) { t.textContent = 'Copia en la nube'; sub.textContent = 'Falta configurar Firebase (archivo firebase-config.js).'; hint.textContent = ''; return; }
    if (!cloud.user) { t.textContent = 'Entrar con Google'; sub.textContent = cloud.ready ? 'Guarda tus datos y los pasa de un celu a otro.' : 'Cargando… (necesita internet)'; hint.textContent = 'Sin entrar, todo sigue funcionando solo en este dispositivo.'; return; }
    const st = { ok: 'al día', syncing: 'sincronizando…', offline: 'sin conexión, se sube cuando vuelva', error: 'no se pudo sincronizar' }[cloud.status] || '';
    t.textContent = 'Nube activada'; sub.textContent = `${cloud.user.email} · ${st}`;
    hint.textContent = 'Se guarda sola cada vez que cambiás algo. Tocá para cerrar sesión.';
}
async function cloudInit() {
    renderCloud();
    if (!cloudConfigured()) return;
    try {
        for (const f of ['app', 'auth', 'firestore']) if (!(await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${f}-compat.js`))) throw new Error('sin internet');
        firebase.initializeApp(window.MIS_EXTRAS_FIREBASE);
        cloud.auth = firebase.auth(); cloud.db = firebase.firestore(); cloud.ready = true;
        cloud.auth.onAuthStateChanged(u => { cloud.user = u; renderCloud(); if (u) cloudCheck(); });
    } catch (e) { console.warn('Nube no disponible', e); }
    renderCloud();
}
async function cloudButton() {
    if (!cloudConfigured()) { showToast('Primero hay que configurar Firebase', 3000); return; }
    if (!cloud.ready) { showToast('Todavía cargando, probá en un momento'); return; }
    if (!cloud.user) {
        const p = new firebase.auth.GoogleAuthProvider();
        try { await cloud.auth.signInWithPopup(p); }
        catch (e) {
            if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { try { await cloud.auth.signInWithRedirect(p); } catch (_) {} }
            else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') showToast('No se pudo entrar: ' + (e.code || 'error'), 3500);
        }
        return;
    }
    const ok = await showConfirm({ title: '¿Cerrar sesión?', message: 'Tus datos siguen en este celu y en la nube. Dejan de sincronizarse hasta que vuelvas a entrar.', okText: 'Cerrar sesión', cancelText: 'Volver', warn: true });
    if (ok) { await cloud.auth.signOut(); renderCloud(); }
}
async function cloudPushNow(prevJson) {
    let ts = lsNum(CLOUD_TS_KEY); if (!ts) { ts = Date.now(); localStorage.setItem(CLOUD_TS_KEY, String(ts)); }
    cloudStatus('syncing');
    const doc = { json: JSON.stringify(data), ts, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (prevJson) doc.prev = prevJson; // si pisás lo que había en la nube, queda la versión anterior guardada
    await withTimeout(cloudRef().set(doc), 10000);
    localStorage.setItem(CLOUD_SYNCED_KEY, String(ts));
    cloudStatus('ok');
}
function cloudQueuePush() {
    if (!cloud.user || !cloud.db) return;
    clearTimeout(cloud.timer);
    cloud.timer = setTimeout(async () => {
        if (cloud.busy) { cloudQueuePush(); return; }
        cloud.busy = true;
        try { await cloudPushNow(); } catch (e) { cloudStatus(navigator.onLine ? 'error' : 'offline'); }
        finally { cloud.busy = false; }
    }, 1500);
}
function cloudApply(c) {
    data = normalizeData(JSON.parse(c.json));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(CLOUD_TS_KEY, String(c.ts)); localStorage.setItem(CLOUD_SYNCED_KEY, String(c.ts));
    applyTheme(data.settings.theme); periodKey = currentKey(); applyProfileToHeader(); renderAll();
}
async function cloudCheck() {
    if (!cloud.user || !cloud.db || cloud.busy) return;
    cloud.busy = true; cloudStatus('syncing');
    try {
        const snap = await withTimeout(cloudRef().get({ source: 'server' }), 10000);
        const ts = lsNum(CLOUD_TS_KEY), sy = lsNum(CLOUD_SYNCED_KEY);
        const dirty = ts > sy || (sy === 0 && hasLocalData());
        if (!snap.exists) { if (hasLocalData()) await cloudPushNow(); else cloudStatus('ok'); return; }
        const c = snap.data();
        if (c.ts === sy) { if (dirty) await cloudPushNow(); else cloudStatus('ok'); return; } // la nube no cambió
        if (!dirty) { cloudApply(c); cloudStatus('ok'); showToast('Datos al día desde la nube'); return; } // solo cambió la nube
        const useCloud = await showConfirm({ title: 'Hay datos distintos en la nube', message: 'Este celu y la nube tienen cambios distintos. ¿Cuáles dejo? Los otros se reemplazan (la versión anterior de la nube queda guardada).', okText: 'Usar los de la nube', cancelText: 'Usar los de este celu', warn: true });
        if (useCloud) { snapshot(); cloudApply(c); showUndoToast('Datos cargados desde la nube'); }
        else await cloudPushNow(c.json);
        cloudStatus('ok');
    } catch (e) { cloudStatus(navigator.onLine ? 'error' : 'offline'); }
    finally { cloud.busy = false; }
}

// ============================================================
//  INSTALAR LA APP
// ============================================================
let installOS = 'ios';
let deferredInstall = null;
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function detectPlatform() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
}
const INSTALL_STEPS = {
    ios: {
        steps: ['Abrí esta página en <b>Safari</b>.', 'Tocá el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).', 'Bajá en el menú y tocá <b>Agregar a pantalla de inicio</b>.', 'Tocá <b>Agregar</b>. Listo: queda un ícono en tu celu.'],
        note: 'En iPhone solo se puede instalar desde Safari, no desde Chrome.'
    },
    android: {
        steps: ['Abrí esta página en <b>Chrome</b>.', 'Tocá los <b>tres puntitos</b> de arriba a la derecha.', 'Tocá <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.', 'Confirmá con <b>Instalar</b>.'],
        note: 'Si ves el botón “Instalar ahora”, podés usarlo directamente.'
    },
    desktop: {
        steps: ['Abrí esta página en <b>Chrome</b> o <b>Edge</b>.', 'Buscá el ícono de instalar a la derecha de la barra de direcciones.', 'Hacé clic en <b>Instalar</b>.'],
        note: 'También sirve guardarla como favorito y usarla desde el navegador.'
    }
};
function renderInstall() {
    document.querySelectorAll('#installTabs .install-tab').forEach(b => b.classList.toggle('active', b.dataset.os === installOS));
    const info = INSTALL_STEPS[installOS];
    $('installSteps').innerHTML = info.steps.map(s => `<li>${s}</li>`).join('');
    $('installNote').textContent = info.note;
    $('installNowBtn').style.display = deferredInstall ? 'flex' : 'none';
}
function openInstallModal() {
    installOS = detectPlatform();
    renderInstall();
    $('installModal').style.display = 'flex';
}
function closeInstallModal() { $('installModal').style.display = 'none'; }
function maybeShowInstallBanner() {
    if (isStandalone()) return;
    try { if (localStorage.getItem(INSTALL_KEY)) return; } catch (_) {}
    setTimeout(() => { if (!isStandalone()) $('installBanner').style.display = 'flex'; }, 2500);
}
function dismissInstallBanner() {
    $('installBanner').style.display = 'none';
    try { localStorage.setItem(INSTALL_KEY, '1'); } catch (_) {}
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => { deferredInstall = null; dismissInstallBanner(); closeInstallModal(); });

// ============================================================
//  PANTALLAS Y EVENTOS
// ============================================================
function updateBadge() {
    const pend = calc(currentKey()).list.filter(e => !e.done && endedAt(e)).length; // solo las que ya terminaron y falta confirmar
    const b = $('summaryBadge');
    b.textContent = pend;
    b.style.display = pend > 0 ? 'flex' : 'none';
}
function renderAll() {
    renderCalendar();
    renderSummary();
    renderMoney();
    renderShiftChips();
    updateHoursPreview();
    updateBadge();
}
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    $(tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
    currentTab = tabId;
    if (tabId === 'tabAdd') {
        $('addDate').value = selectedDate || todayStr();
        addDoneManual = false; syncAddDone(); updateHoursPreview(); renderShiftChips();
    }
    renderAll();
    $('mainContent').scrollTop = 0;
}

function init() {
    applyProfileToHeader();

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // Calendario
    $('prevMonth').addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
    $('nextMonth').addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
    $('todayBarCal').addEventListener('click', () => { const h = hoyMVD(); currentYear = h.year; currentMonth = h.month; selectedDate = todayStr(); renderCalendar(); });
    $('calendarGrid').addEventListener('click', ev => {
        const cell = ev.target.closest('.day-cell');
        if (!cell || !cell.dataset.date) return;
        selectedDate = cell.dataset.date;
        if (cell.classList.contains('other-month')) { const d = parseDate(selectedDate); currentYear = d.getFullYear(); currentMonth = d.getMonth(); }
        renderCalendar();
    });
    $('dayAddBtn').addEventListener('click', () => switchTab('tabAdd'));
    $('dayDetailContent').addEventListener('click', ev => {
        const el = ev.target.closest('[data-act]');
        if (el) handleEntryAction(el.dataset.act, parseInt(el.dataset.id, 10));
    });

    // Período (Resumen / Plata)
    document.addEventListener('click', ev => {
        const b = ev.target.closest('[data-pshift]');
        if (b) { periodKey = shiftKey(periodKey, parseInt(b.dataset.pshift, 10)); renderSummary(); renderMoney(); }
    });
    const backToNow = () => { periodKey = currentKey(); renderSummary(); renderMoney(); };
    $('todayBarSum').addEventListener('click', backToNow);
    $('todayBarMoney').addEventListener('click', backToNow);

    // Resumen
    $('summaryContainer').addEventListener('click', ev => {
        const el = ev.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        if (act === 'mark-all') markAllDone();
        else if (act === 'period-settings') openPeriodModal();
        else if (act === 'export-csv') exportXlsx();
        else if (act === 'export-pdf') exportPdf();
        else handleEntryAction(act, parseInt(el.dataset.id, 10));
    });
    $('periodCancelBtn').addEventListener('click', closePeriodModal);
    $('periodSaveBtn').addEventListener('click', savePeriodModal);
    $('periodModal').addEventListener('click', ev => { if (ev.target.id === 'periodModal') closePeriodModal(); });

    // Plata
    $('moneyContainer').addEventListener('click', ev => {
        const el = ev.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act, id = parseInt(el.dataset.id, 10);
        if (act === 'item-add') openItemModal(el.dataset.kind, null);
        else if (act === 'item-edit') openItemModal(el.dataset.kind, id);
        else if (act === 'item-del') deleteItem(el.dataset.kind, id);
        else if (act === 'pay') togglePaid(id);
        else if (act === 'recv') toggleReceived(id);
        else if (act === 'salary-toggle') toggleSalary();
        else if (act === 'copy-prev') copyPrevExpenses();
        else if (act === 'period-settings') openPeriodModal();
        else if (act === 'load-receipts') loadReceipts();
    });
    $('itemCancelBtn').addEventListener('click', closeItemModal);
    $('itemSaveBtn').addEventListener('click', saveItemModal);
    $('itemModal').addEventListener('click', ev => { if (ev.target.id === 'itemModal') closeItemModal(); });
    ['itemName', 'itemAmount'].forEach(id => $(id).addEventListener('keydown', ev => { if (ev.key === 'Enter') saveItemModal(); }));

    // Agregar
    ['addDate', 'addStart', 'addEnd'].forEach(id => $(id).addEventListener('input', () => { syncAddDone(); updateHoursPreview(); }));
    $('addDoneToggle').addEventListener('click', () => { addDoneManual = true; addDone = !addDone; syncAddDone(); });
    $('shiftChips').addEventListener('click', ev => {
        const b = ev.target.closest('[data-start]');
        if (!b) return;
        $('addStart').value = b.dataset.start; $('addEnd').value = b.dataset.end; updateHoursPreview();
    });
    $('addSubmitBtn').addEventListener('click', submitAdd);

    // Editar extra
    $('editCancelBtn').addEventListener('click', closeEditModal);
    $('editSaveBtn').addEventListener('click', saveEditFromModal);
    $('editModal').addEventListener('click', ev => { if (ev.target.id === 'editModal') closeEditModal(); });

    // Ajustes
    $('profileChip').addEventListener('click', openSettings);
    $('profileChip').addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openSettings(); } });
    $('settingsCancelBtn').addEventListener('click', () => closeSettings());
    $('settingsSaveBtn').addEventListener('click', saveSettings);
    $('settingsModal').addEventListener('click', ev => { if (ev.target.id === 'settingsModal') closeSettings(); });
    $('setName').addEventListener('input', updateSettingsAvatar);
    $('themeSwatches').addEventListener('click', ev => {
        const b = ev.target.closest('.theme-swatch');
        if (!b) return;
        pendingTheme = b.dataset.hex; applyTheme(pendingTheme); renderThemeSwatches();
    });
    $('modeSeg').addEventListener('click', ev => { const b = ev.target.closest('[data-mode]'); if (b) setModePref(b.dataset.mode); });
    $('backupBtn').addEventListener('click', backupNow);
    $('restoreBtn').addEventListener('click', () => $('restoreFile').click());
    $('restoreFile').addEventListener('change', ev => { restoreFromFile(ev.target.files[0]); ev.target.value = ''; });
    $('wipeBtn').addEventListener('click', wipeAll);

    // Deshacer + nube
    $('toast').addEventListener('click', ev => { if (ev.target.closest('#toastUndo')) undoLast(); else if (ev.target.closest('#toastReload')) location.reload(); });
    if ('serviceWorker' in navigator) { const had = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => { if (!had) return; const el = $('toast'); el.innerHTML = '<span>Hay una versión nueva</span><button type="button" class="toast-undo" id="toastReload">Actualizar</button>'; el.classList.add('show', 'has-action'); clearTimeout(toastTimeout); }); }
    $('cloudBtn').addEventListener('click', cloudButton);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cloudCheck(); });
    window.addEventListener('online', cloudCheck);
    cloudInit();

    // Instalar
    $('openInstallHelpBtn').addEventListener('click', () => { closeSettings(); openInstallModal(); });
    $('installBannerBtn').addEventListener('click', () => { dismissInstallBanner(); openInstallModal(); });
    $('installBannerClose').addEventListener('click', dismissInstallBanner);
    $('installCloseBtn').addEventListener('click', closeInstallModal);
    $('installDoneBtn').addEventListener('click', closeInstallModal);
    $('installModal').addEventListener('click', ev => { if (ev.target.id === 'installModal') closeInstallModal(); });
    $('installTabs').addEventListener('click', ev => { const b = ev.target.closest('[data-os]'); if (b) { installOS = b.dataset.os; renderInstall(); } });
    $('installNowBtn').addEventListener('click', async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        try { await deferredInstall.userChoice; } catch (_) {}
        deferredInstall = null; renderInstall();
    });

    // Pedir a Chrome/Safari que no borre los datos de la app
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}

    // Atajos del manifest (#add, #calendar, #summary, #money)
    const hashTab = { '#add': 'tabAdd', '#calendar': 'tabCalendar', '#summary': 'tabSummary', '#money': 'tabMoney' }[location.hash];
    try { if (!localStorage.getItem('hxyo_receipts_v1')) { const n = applyReceipts(); localStorage.setItem('hxyo_receipts_v1', '1'); if (n) { saveData(); setTimeout(() => showToast(`Recibos 2026 cargados (${n})`), 700); } } } catch (_) {}
    renderAll();
    if (hashTab) switchTab(hashTab);
    maybeShowInstallBanner();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
