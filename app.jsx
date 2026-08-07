const { useState, useEffect } = React;

const INK = '#1C2541';
const CHROME = '#141B34';
const PAPER = '#FCFBF8';
const LINE = '#D9D4C5';
const STAMP = '#B23A2F';
const GREEN = '#2F6E4F';
const MUTED = '#6B7280';

const FIREBASE_NOT_CONFIGURED = firebaseConfig.apiKey === 'GANTI_DENGAN_API_KEY';

function fmtRupiah(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function terbilang(n) {
  n = Math.floor(Math.abs(n));
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return satuan[n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 !== 0 ? " " + terbilang(n % 10) : "");
  if (n < 200) return "seratus" + (n - 100 !== 0 ? " " + terbilang(n - 100) : "");
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
  if (n < 2000) return "seribu" + (n - 1000 !== 0 ? " " + terbilang(n - 1000) : "");
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " juta" + (n % 1000000 !== 0 ? " " + terbilang(n % 1000000) : "");
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 !== 0 ? " " + terbilang(n % 1000000000) : "");
  return "angka terlalu besar";
}
function terbilangRupiah(n) {
  if (!n) return "nol rupiah";
  const t = terbilang(n).trim().replace(/\s+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1) + " rupiah";
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2));

function emptyDraft() {
  return {
    id: null,
    type: 'invoice',
    number: '',
    date: todayISO(),
    dueDate: '',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    items: [{ id: uid(), desc: '', qty: 1, price: 0 }],
    amount: 0,
    kwitansiFor: '',
    taxPercent: 0,
    discount: 0,
    notes: '',
    status: 'unpaid',
  };
}
function emptyProfile() {
  return { name: '', address: '', phone: '', email: '', logo: '', bankName: '', bankAccount: '', bankHolder: '' };
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-3" style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 11, marginTop: 4, color: MUTED }}>{hint}</span>}
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${LINE}`,
  outline: 'none', fontSize: 14, background: '#fff', color: INK, boxSizing: 'border-box',
};

function App() {
  const [tab, setTab] = useState('form');
  const [profile, setProfile] = useState(emptyProfile());
  const [invoices, setInvoices] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (FIREBASE_NOT_CONFIGURED) { setReady(true); return; }
    try { await firebase.auth().signInAnonymously(); } catch (e) { console.error('Auth gagal — cek apakah Anonymous sign-in sudah diaktifkan di Firebase Console', e); }
    let p = emptyProfile(), inv = [];
    try {
      const doc = await db.collection('settings').doc('profile').get();
      if (doc.exists) p = { ...emptyProfile(), ...doc.data() };
    } catch (e) { console.error(e); }
    try {
      const snap = await db.collection('invoices').orderBy('savedAt', 'desc').get();
      inv = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error(e); }
    setProfile(p);
    setInvoices(inv);
    const d = emptyDraft();
    d.number = genNumber(d.type, d.date, inv);
    setDraft(d);
    setReady(true);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function persistProfile(p) {
    setProfile(p);
    try { await db.collection('settings').doc('profile').set(p); }
    catch (e) { showToast('Gagal menyimpan profil ke Firebase'); }
  }

  function genNumber(type, date, list) {
    const ym = (date || todayISO()).slice(0, 7).replace('-', '');
    const prefix = type === 'invoice' ? 'INV' : 'KWT';
    const count = list.filter(i => i.type === type && i.number && i.number.startsWith(`${prefix}-${ym}`)).length;
    return `${prefix}-${ym}-${String(count + 1).padStart(3, '0')}`;
  }

  function startNew(type) {
    const d = emptyDraft();
    d.type = type || 'invoice';
    d.number = genNumber(d.type, d.date, invoices);
    setDraft(d);
    setTab('form');
  }
  function loadForEdit(inv) { setDraft(JSON.parse(JSON.stringify(inv))); setTab('form'); }
  function patch(p) { setDraft(prev => ({ ...prev, ...p })); }

  function setType(t) {
    if (!draft.id) patch({ type: t, number: genNumber(t, draft.date, invoices) });
    else patch({ type: t });
  }

  function updateItem(id, field, value) {
    setDraft(prev => ({ ...prev, items: prev.items.map(it => it.id === id ? { ...it, [field]: value } : it) }));
  }
  function addItem() { setDraft(prev => ({ ...prev, items: [...prev.items, { id: uid(), desc: '', qty: 1, price: 0 }] })); }
  function removeItem(id) { setDraft(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) })); }

  function computeTotals(d) {
    if (d.type === 'kwitansi') return { subtotal: Number(d.amount) || 0, tax: 0, total: Number(d.amount) || 0 };
    const subtotal = d.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const tax = subtotal * ((Number(d.taxPercent) || 0) / 100);
    const total = Math.max(0, subtotal - (Number(d.discount) || 0) + tax);
    return { subtotal, tax, total };
  }

  async function handleSave() {
    if (FIREBASE_NOT_CONFIGURED) return showToast('Firebase belum dikonfigurasi — cek firebase-config.js');
    if (!draft.number.trim()) return showToast('Nomor dokumen belum diisi');
    if (!draft.clientName.trim()) return showToast(draft.type === 'kwitansi' ? 'Nama penerima/pembayar belum diisi' : 'Nama klien belum diisi');
    const id = draft.id || db.collection('invoices').doc().id;
    const record = { ...draft, id, savedAt: new Date().toISOString() };
    try {
      await db.collection('invoices').doc(id).set(record);
      setInvoices(prev => {
        const exists = prev.some(i => i.id === id);
        return exists ? prev.map(i => i.id === id ? record : i) : [record, ...prev];
      });
      setDraft(record);
      showToast('Tersimpan ke Firebase');
    } catch (e) { console.error(e); showToast('Gagal menyimpan — cek koneksi/konfigurasi Firebase'); }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus dokumen ini dari riwayat?')) return;
    try {
      await db.collection('invoices').doc(id).delete();
      setInvoices(prev => prev.filter(i => i.id !== id));
      if (draft.id === id) startNew('invoice');
    } catch (e) { showToast('Gagal menghapus'); }
  }

  async function toggleStatus(inv) {
    const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
    try {
      await db.collection('invoices').doc(inv.id).update({ status: newStatus });
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i));
      if (draft.id === inv.id) patch({ status: newStatus });
    } catch (e) { showToast('Gagal mengubah status'); }
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) return showToast('Logo terlalu besar (maks ±500KB)');
    const reader = new FileReader();
    reader.onload = () => persistProfile({ ...profile, logo: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const totals = computeTotals(draft);
  const filteredHistory = invoices
    .filter(i => historyFilter === 'all' || i.type === historyFilter)
    .filter(i => !search.trim() || (i.clientName + i.number).toLowerCase().includes(search.toLowerCase()));

  if (!ready) return <div style={{ padding: 40, color: MUTED }}>Memuat...</div>;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: INK, minHeight: '100%', background: '#F1EFEA' }}>
      <style>{`
        .doc-serif { font-family: 'Fraunces', Georgia, serif; }
        .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
        input:focus, textarea:focus, select:focus { border-color: ${INK} !important; box-shadow: 0 0 0 2px ${INK}22; }
        .perforation { background-image: radial-gradient(circle, #F1EFEA 3px, transparent 3.2px); background-size: 16px 16px; background-position: -8px -8px; height: 10px; }
        .ledger { background-image: repeating-linear-gradient(to bottom, transparent, transparent 26px, ${LINE}66 27px); }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {FIREBASE_NOT_CONFIGURED && (
        <div style={{ background: STAMP, color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: 13 }}>
          Firebase belum dikonfigurasi. Isi kredensial project kamu di <code>firebase-config.js</code>, lalu deploy ulang. Lihat README.md.
        </div>
      )}

      <div className="no-print" style={{ background: CHROME, color: '#EFEDE6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="doc-serif" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>Buku Kwitansi</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['form', 'Buat Baru'], ['history', 'Riwayat'], ['profile', 'Profil Usaha']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: tab === key ? '#EFEDE6' : 'transparent', color: tab === key ? CHROME : '#C9C6BC',
                }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="no-print" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, zIndex: 50, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>

        {tab === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '1fr 1fr' : '1fr', gap: 20 }}>

            {/* FORM */}
            <div className="no-print" style={{ background: '#fff', borderRadius: 10, padding: 20, border: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[['invoice', 'Invoice'], ['kwitansi', 'Kwitansi']].map(([key, label]) => (
                  <button key={key} onClick={() => setType(key)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${draft.type === key ? INK : LINE}`, background: draft.type === key ? INK : '#fff', color: draft.type === key ? '#fff' : INK }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Nomor Dokumen">
                    <input style={inputStyle} className="font-mono" value={draft.number} onChange={e => patch({ number: e.target.value })} />
                  </Field>
                </div>
                <div>
                  <Field label=" ">
                    <button onClick={() => patch({ number: genNumber(draft.type, draft.date, invoices) })}
                      style={{ padding: '8px 10px', borderRadius: 6, border: `1px solid ${LINE}`, background: '#F7F5F0', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Auto</button>
                  </Field>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><Field label="Tanggal"><input type="date" style={inputStyle} value={draft.date} onChange={e => patch({ date: e.target.value })} /></Field></div>
                {draft.type === 'invoice' && (
                  <div style={{ flex: 1 }}><Field label="Jatuh Tempo"><input type="date" style={inputStyle} value={draft.dueDate} onChange={e => patch({ dueDate: e.target.value })} /></Field></div>
                )}
              </div>

              <Field label={draft.type === 'kwitansi' ? 'Diterima Dari' : 'Nama Klien'}>
                <input style={inputStyle} value={draft.clientName} onChange={e => patch({ clientName: e.target.value })} placeholder="Nama perorangan / perusahaan" />
              </Field>
              <Field label="Alamat (opsional)">
                <textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={draft.clientAddress} onChange={e => patch({ clientAddress: e.target.value })} />
              </Field>
              <Field label="Telepon (opsional)">
                <input style={inputStyle} value={draft.clientPhone} onChange={e => patch({ clientPhone: e.target.value })} />
              </Field>

              {draft.type === 'invoice' ? (
                <React.Fragment>
                  <div style={{ marginTop: 6, marginBottom: 8, fontSize: 13, fontWeight: 700 }}>Rincian Item</div>
                  {draft.items.map((it) => (
                    <div key={it.id} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                      <input style={{ ...inputStyle, flex: 3 }} placeholder="Deskripsi" value={it.desc} onChange={e => updateItem(it.id, 'desc', e.target.value)} />
                      <input type="number" style={{ ...inputStyle, flex: 1 }} placeholder="Qty" value={it.qty} onChange={e => updateItem(it.id, 'qty', e.target.value)} />
                      <input type="number" style={{ ...inputStyle, flex: 1.4 }} placeholder="Harga" value={it.price} onChange={e => updateItem(it.id, 'price', e.target.value)} />
                      <button onClick={() => removeItem(it.id)} disabled={draft.items.length === 1}
                        style={{ border: 'none', background: 'none', color: draft.items.length === 1 ? '#ccc' : STAMP, cursor: draft.items.length === 1 ? 'default' : 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                    </div>
                  ))}
                  <button onClick={addItem} style={{ fontSize: 12, color: INK, background: 'none', border: `1px dashed ${LINE}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', marginBottom: 12 }}>+ Tambah item</button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}><Field label="Diskon (Rp)"><input type="number" style={inputStyle} value={draft.discount} onChange={e => patch({ discount: e.target.value })} /></Field></div>
                    <div style={{ flex: 1 }}><Field label="Pajak (%)"><input type="number" style={inputStyle} value={draft.taxPercent} onChange={e => patch({ taxPercent: e.target.value })} /></Field></div>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Field label="Jumlah (Rp)">
                    <input type="number" style={inputStyle} value={draft.amount} onChange={e => patch({ amount: e.target.value })} />
                  </Field>
                  <Field label="Untuk Pembayaran">
                    <input style={inputStyle} value={draft.kwitansiFor} onChange={e => patch({ kwitansiFor: e.target.value })} placeholder="mis. Jasa desain logo" />
                  </Field>
                </React.Fragment>
              )}

              <Field label="Catatan (opsional)">
                <textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={draft.notes} onChange={e => patch({ notes: e.target.value })} />
              </Field>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.status === 'paid'} onChange={e => patch({ status: e.target.checked ? 'paid' : 'unpaid' })} />
                Tandai lunas
              </label>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={handleSave} style={{ flex: 1, padding: '10px 0', borderRadius: 7, background: INK, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Simpan</button>
                <button onClick={() => window.print()} style={{ flex: 1, padding: '10px 0', borderRadius: 7, background: '#fff', color: INK, border: `1.5px solid ${INK}`, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cetak / PDF</button>
                <button onClick={() => startNew(draft.type)} style={{ padding: '10px 14px', borderRadius: 7, background: '#F7F5F0', color: MUTED, border: `1px solid ${LINE}`, fontSize: 13, cursor: 'pointer' }}>Baru</button>
              </div>
            </div>

            {/* PREVIEW */}
            <div>
              <div id="print-area" style={{ background: PAPER, borderRadius: 10, border: `1px solid ${LINE}`, boxShadow: '0 6px 24px rgba(28,37,65,0.08)', overflow: 'hidden', position: 'relative' }}>
                <div className="perforation no-print" />
                <div className="ledger" style={{ padding: '28px 30px 34px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {profile.logo && <img src={profile.logo} alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6 }} />}
                      <div>
                        <div className="doc-serif" style={{ fontSize: 18, fontWeight: 700 }}>{profile.name || 'Nama Usaha Anda'}</div>
                        <div style={{ fontSize: 11.5, color: MUTED, maxWidth: 220 }}>{profile.address}</div>
                        <div style={{ fontSize: 11.5, color: MUTED }}>{[profile.phone, profile.email].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="doc-serif" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.03em' }}>{draft.type === 'invoice' ? 'INVOICE' : 'KWITANSI'}</div>
                      <div className="font-mono" style={{ fontSize: 12, color: MUTED }}>{draft.number}</div>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>Tanggal: {draft.date}</div>
                      {draft.type === 'invoice' && draft.dueDate && <div style={{ fontSize: 11.5, color: MUTED }}>Jatuh tempo: {draft.dueDate}</div>}
                    </div>
                  </div>

                  {draft.status === 'paid' && (
                    <div style={{ position: 'absolute', top: 86, right: 34, border: `3px solid ${STAMP}`, color: STAMP, padding: '5px 14px', borderRadius: 8, transform: 'rotate(-10deg)', fontWeight: 800, fontSize: 20, letterSpacing: 3, opacity: 0.85 }} className="doc-serif">
                      LUNAS
                    </div>
                  )}

                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 4 }}>{draft.type === 'kwitansi' ? 'Diterima dari' : 'Kepada'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{draft.clientName || '—'}</div>
                  {draft.clientAddress && <div style={{ fontSize: 12, color: MUTED }}>{draft.clientAddress}</div>}
                  {draft.clientPhone && <div style={{ fontSize: 12, color: MUTED }}>{draft.clientPhone}</div>}

                  {draft.type === 'invoice' ? (
                    <React.Fragment>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ borderBottom: `1.5px solid ${INK}` }}>
                            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Deskripsi</th>
                            <th style={{ textAlign: 'right', padding: '6px 4px', width: 50 }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '6px 4px', width: 100 }}>Harga</th>
                            <th style={{ textAlign: 'right', padding: '6px 4px', width: 110 }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.items.filter(it => it.desc || it.qty || it.price).map(it => (
                            <tr key={it.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                              <td style={{ padding: '6px 4px' }}>{it.desc || '—'}</td>
                              <td style={{ textAlign: 'right', padding: '6px 4px' }}>{it.qty}</td>
                              <td className="font-mono" style={{ textAlign: 'right', padding: '6px 4px' }}>{fmtRupiah(it.price)}</td>
                              <td className="font-mono" style={{ textAlign: 'right', padding: '6px 4px' }}>{fmtRupiah((Number(it.qty) || 0) * (Number(it.price) || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: 10, marginLeft: 'auto', width: 220, fontSize: 12.5 }}>
                        <Row label="Subtotal" value={fmtRupiah(totals.subtotal)} />
                        {Number(draft.discount) > 0 && <Row label="Diskon" value={'- ' + fmtRupiah(draft.discount)} />}
                        {Number(draft.taxPercent) > 0 && <Row label={`Pajak (${draft.taxPercent}%)`} value={fmtRupiah(totals.tax)} />}
                        <Row label="Total" value={fmtRupiah(totals.total)} bold />
                      </div>
                    </React.Fragment>
                  ) : (
                    <div style={{ marginTop: 18, fontSize: 13, lineHeight: 1.7 }}>
                      <p>Telah terima dari <strong>{draft.clientName || '—'}</strong> sejumlah:</p>
                      <div className="doc-serif" style={{ fontSize: 20, fontWeight: 700, margin: '6px 0' }}>{fmtRupiah(totals.total)}</div>
                      <p style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTED, borderBottom: `1px dotted ${LINE}`, paddingBottom: 6 }}>
                        Terbilang: {terbilangRupiah(totals.total)}
                      </p>
                      <p style={{ marginTop: 8 }}>Untuk pembayaran: <strong>{draft.kwitansiFor || '—'}</strong></p>
                    </div>
                  )}

                  {draft.notes && <div style={{ marginTop: 16, fontSize: 11.5, color: MUTED, borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>Catatan: {draft.notes}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30 }}>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      {profile.bankName && <div>Transfer: {profile.bankName} {profile.bankAccount} a.n {profile.bankHolder}</div>}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: MUTED }}>
                      <div style={{ height: 50 }} />
                      <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 4, width: 130 }}>{profile.name || 'Tanda tangan'}</div>
                    </div>
                  </div>
                </div>
                <div className="perforation no-print" style={{ transform: 'rotate(180deg)' }} />
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="no-print">
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input placeholder="Cari nomor / nama klien..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 260 }} />
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }}>
                <option value="all">Semua tipe</option>
                <option value="invoice">Invoice</option>
                <option value="kwitansi">Kwitansi</option>
              </select>
              <button onClick={() => startNew('invoice')} style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 7, background: INK, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Buat Baru</button>
            </div>

            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: MUTED, background: '#fff', borderRadius: 10, border: `1px dashed ${LINE}` }}>
                Belum ada dokumen. Buat invoice atau kwitansi pertama kamu.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filteredHistory.map(inv => {
                  const t = computeTotals(inv);
                  return (
                    <div key={inv.id} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: inv.type === 'invoice' ? INK : STAMP, border: `1px solid ${inv.type === 'invoice' ? INK : STAMP}`, borderRadius: 4, padding: '2px 6px' }}>
                        {inv.type === 'invoice' ? 'Invoice' : 'Kwitansi'}
                      </span>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div className="font-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{inv.number}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{inv.clientName} · {inv.date}</div>
                      </div>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: 14, minWidth: 100, textAlign: 'right' }}>{fmtRupiah(t.total)}</div>
                      <button onClick={() => toggleStatus(inv)} style={{
                        fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: inv.status === 'paid' ? `${GREEN}22` : `${MUTED}22`, color: inv.status === 'paid' ? GREEN : MUTED,
                      }}>{inv.status === 'paid' ? 'Lunas' : 'Belum lunas'}</button>
                      <button onClick={() => loadForEdit(inv)} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: `1px solid ${LINE}`, background: '#fff', cursor: 'pointer' }}>Buka</button>
                      <button onClick={() => handleDelete(inv.id)} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: 'none', background: 'none', color: STAMP, cursor: 'pointer' }}>Hapus</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="no-print" style={{ background: '#fff', borderRadius: 10, padding: 22, border: `1px solid ${LINE}`, maxWidth: 480 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Profil Usaha</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 8, border: `1px dashed ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#F7F5F0' }}>
                {profile.logo ? <img src={profile.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 10, color: MUTED }}>Logo</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, padding: '7px 12px', borderRadius: 6, border: `1px solid ${LINE}`, cursor: 'pointer', display: 'inline-block' }}>
                  Upload logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
                {profile.logo && <button onClick={() => persistProfile({ ...profile, logo: '' })} style={{ marginLeft: 8, fontSize: 12, color: STAMP, background: 'none', border: 'none', cursor: 'pointer' }}>Hapus</button>}
              </div>
            </div>
            <Field label="Nama Usaha"><input style={inputStyle} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <Field label="Alamat"><textarea style={{ ...inputStyle, minHeight: 50 }} value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <Field label="Telepon"><input style={inputStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <Field label="Email"><input style={inputStyle} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 10, marginBottom: 6 }}>Rekening Transfer (opsional)</div>
            <Field label="Nama Bank"><input style={inputStyle} value={profile.bankName} onChange={e => setProfile({ ...profile, bankName: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <Field label="Nomor Rekening"><input style={inputStyle} value={profile.bankAccount} onChange={e => setProfile({ ...profile, bankAccount: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <Field label="Atas Nama"><input style={inputStyle} value={profile.bankHolder} onChange={e => setProfile({ ...profile, bankHolder: e.target.value })} onBlur={() => persistProfile(profile)} /></Field>
            <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>Perubahan tersimpan otomatis saat kolom ditinggalkan (klik di luar kolom).</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: bold ? 800 : 400, borderTop: bold ? `1.5px solid ${INK}` : 'none', marginTop: bold ? 4 : 0, paddingTop: bold ? 6 : 3 }}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  window.__appMounted = true;
} catch (e) {
  console.error(e);
  document.getElementById('root').innerHTML =
    '<div style="padding:24px;font-family:sans-serif;color:#B23A2F">Gagal memuat aplikasi.<br>Buka Console (F12) untuk detail error.</div>';
}
