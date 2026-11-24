import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck,
  Utensils,
  Bell,
  Users,
  Building2,
  FileText,
  BookOpen,
  KeyRound,
  LogOut,
  Download,
  Stethoscope,
  Send,
  Monitor,
  Smartphone,
  Search,
  Lock,
  Unlock,
  RefreshCw,
  UserPlus,
  ChevronRight,
  Database,
} from 'lucide-react';

const SUPABASE_URL = 'https://erdguekuecvnolkwkzhq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_U5lmbPuR110KbZoJwHDqNw_AvxuoGLP';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'Da programmare';
  const dt = parseDate(dateStr);
  if (!dt || Number.isNaN(dt.getTime())) return 'Da programmare';
  return dt.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function addMonths(dateStr: string | null | undefined, months: number) {
  const dt = parseDate(dateStr);
  if (!dt) return null;
  const copy = new Date(dt.getFullYear(), dt.getMonth() + months, dt.getDate());
  const y = copy.getFullYear();
  const m = String(copy.getMonth() + 1).padStart(2, '0');
  const d = String(copy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysUntil(dateStr: string | null | undefined) {
  const dt = parseDate(dateStr);
  if (!dt) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = dt.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getDeadlineStatus(dateStr: string | null | undefined) {
  if (!dateStr) {
    return {
      code: 'pending',
      label: 'Da effettuare',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      days: null,
    };
  }
  const diff = daysUntil(dateStr) ?? 0;
  if (diff < 0) {
    return {
      code: 'expired',
      label: `Scaduto da ${Math.abs(diff)} gg`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      days: diff,
    };
  }
  if (diff <= 60) {
    return {
      code: 'expiring',
      label: `Scade tra ${diff} gg`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      days: diff,
    };
  }
  return {
    code: 'valid',
    label: `Valido (${diff} gg)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    days: diff,
  };
}

function triggerTextDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function App() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [handouts, setHandouts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  // Autenticazione
  const [session, setSession] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigazione Back-Office Ente
  const [enteTab, setEnteTab] = useState('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);

  // Navigazione Portale Cliente
  const [clientTab, setClientTab] = useState('home');
  const [clientViewMode, setClientViewMode] = useState<'desktop' | 'mobile'>(
    'desktop'
  );
  const [clientWorkerFilter, setClientWorkerFilter] = useState('all');
  const [handoutAreaFilter, setHandoutAreaFilter] = useState('all');

  // Modali / Form
  const [renewTarget, setRenewTarget] = useState<any>(null);
  const [renewDate, setRenewDate] = useState(todayISO());

  const [medicalTarget, setMedicalTarget] = useState<any>(null);
  const [medicalDate, setMedicalDate] = useState(todayISO());
  const [medicalOutcome, setMedicalOutcome] = useState(
    'Idoneo senza prescrizioni'
  );

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('DVR Sicurezza');
  const [newDocVersion, setNewDocVersion] = useState('Rev. 05 (2026)');
  const [newDocNotes, setNewDocNotes] = useState('');

  const [newHandoutTitle, setNewHandoutTitle] = useState('');
  const [newHandoutArea, setNewHandoutArea] = useState('Autocontrollo HACCP');
  const [newHandoutCourseTag, setNewHandoutCourseTag] =
    useState('HACCP Base 6h');
  const [newHandoutPages, setNewHandoutPages] = useState('24');
  const [newHandoutSummary, setNewHandoutSummary] = useState('');

  const [newCompName, setNewCompName] = useState('');
  const [newCompVat, setNewCompVat] = useState('');
  const [newCompUser, setNewCompUser] = useState('');
  const [newCompPass, setNewCompPass] = useState('');

  // Form Comunicazione Cliente
  const [reqType, setReqType] = useState('NUOVO_ASSUNTO');
  const [reqWorkerName, setReqWorkerName] = useState('');
  const [reqFiscalCode, setReqFiscalCode] = useState('');
  const [reqRoles, setReqRoles] = useState<string[]>(['Dipendente']);
  const [reqNotes, setReqNotes] = useState('');
  const [reqFeedback, setReqFeedback] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    setDbError('');
    try {
      const [azRes, lavRes, attRes, docRes, dispRes, reqRes] =
        await Promise.all([
          supabase
            .from('aziende')
            .select('*')
            .order('created_at', { ascending: true }),
          supabase
            .from('lavoratori')
            .select('*')
            .order('created_at', { ascending: true }),
          supabase
            .from('attestati_lavoratori')
            .select('*')
            .order('created_at', { ascending: true }),
          supabase
            .from('documenti_aziendali')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('dispense')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('segnalazioni_clienti')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

      if (azRes.error) throw azRes.error;
      if (lavRes.error) throw lavRes.error;
      if (attRes.error) throw attRes.error;
      if (docRes.error) throw docRes.error;
      if (dispRes.error) throw dispRes.error;
      if (reqRes.error) throw reqRes.error;

      const mappedCompanies = (azRes.data || []).map((a: any) => ({
        id: a.id,
        name: a.ragione_sociale,
        sector: a.settore || 'Attività Commerciale',
        vat: a.partita_iva || '',
        ateco: a.codice_ateco || '',
        address: a.indirizzo || '',
        contactPerson: a.referente_nome || '',
        email: a.referente_email || '',
        phone: a.referente_telefono || '',
        username: a.username_portale,
        password: a.password_portale,
        appActive: a.accesso_attivo,
        medicoCompetente: {
          doctorName: a.medico_competente_nome || 'Da nominare',
          appointmentDate: a.medico_competente_data_nomina,
          protocolNumber: a.medico_competente_protocollo || '-',
          notes: a.medico_competente_note || '',
        },
      }));

      const allAttestati = attRes.data || [];
      const mappedWorkers = (lavRes.data || []).map((l: any) => ({
        id: l.id,
        companyId: l.azienda_id,
        fullName: l.nome_completo,
        fiscalCode: l.codice_fiscale || '',
        roles: l.ruoli || ['Dipendente'],
        hireDate: l.data_assunzione,
        lastMedicalVisit: l.ultima_visita_medica,
        medicalValidityMonths: l.validita_visita_mesi || 12,
        medicalOutcome: l.esito_visita_medica || 'Idoneo',
        courses: allAttestati
          .filter((att: any) => att.lavoratore_id === l.id)
          .map((att: any) => ({
            id: att.id,
            title: att.titolo_corso,
            area: att.area,
            hours: att.ore,
            issueDate: att.data_rilascio,
            validityMonths: att.validita_mesi,
            certificateCode: att.codice_attestato,
          })),
      }));

      const mappedDocs = (docRes.data || []).map((d: any) => ({
        id: d.id,
        companyId: d.azienda_id,
        title: d.titolo,
        category: d.categoria,
        uploadDate: d.data_caricamento,
        version: d.revisione || 'Rev. 01',
        notes: d.note || '',
      }));

      const mappedHandouts = (dispRes.data || []).map((h: any) => ({
        id: h.id,
        companyId: h.azienda_id,
        title: h.titolo,
        area: h.area,
        courseTag: h.tag_corso || 'Dispensa',
        pages: h.numero_pagine || 20,
        updatedAt: h.data_aggiornamento,
        summary: h.riepilogo || '',
      }));

      const mappedRequests = (reqRes.data || []).map((r: any) => ({
        id: r.id,
        companyId: r.azienda_id,
        type: r.tipo,
        createdAt: r.created_at,
        status: r.stato,
        workerName: r.nome_lavoratore || 'Segnalazione',
        fiscalCode: r.codice_fiscale || '',
        proposedRoles: r.ruoli_proposti || ['Dipendente'],
        notes: r.note || '',
      }));

      setCompanies(mappedCompanies);
      setWorkers(mappedWorkers);
      setDocuments(mappedDocs);
      setHandouts(mappedHandouts);
      setRequests(mappedRequests);

      if (mappedCompanies.length > 0) {
        setSelectedCompanyId((prev) => prev || mappedCompanies[0].id);
      }
    } catch (err: any) {
      setDbError(
        err?.message ||
          "Errore di connessione a Supabase. Verifica di aver disattivato RLS nell'Editor SQL."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUsername.trim();
    const p = loginPassword.trim();
    if (u === 'admin.ente' && p === 'FormaSafe2026!') {
      setSession({ role: 'ente', name: 'Direzione Ente di Formazione' });
      setLoginError('');
      return;
    }
    const foundComp = companies.find(
      (c) => c.username === u && c.password === p
    );
    if (foundComp) {
      if (!foundComp.appActive) {
        setLoginError(
          "Accesso sospeso per questa azienda. Contatta l'ente di formazione."
        );
        return;
      }
      setSession({
        role: 'client',
        companyId: foundComp.id,
        name: foundComp.name,
      });
      setSelectedCompanyId(foundComp.id);
      setLoginError('');
      return;
    }
    setLoginError('Nome utente o password non validi.');
  };

  const quickLogin = (role: 'ente' | 'client', compId?: string) => {
    if (role === 'ente') {
      setSession({ role: 'ente', name: 'Direzione Ente di Formazione' });
      setLoginError('');
    } else {
      const comp = companies.find((c) => c.id === compId) || companies[0];
      if (!comp) return;
      setSession({ role: 'client', companyId: comp.id, name: comp.name });
      setSelectedCompanyId(comp.id);
      setLoginError('');
    }
  };

  // Calcolo scadenze e alert
  const computedAlerts = useMemo(() => {
    const list: any[] = [];

    workers.forEach((w) => {
      const comp = companies.find((c) => c.id === w.companyId);
      const compName = comp ? comp.name : 'Azienda';

      const medExpiry = w.lastMedicalVisit
        ? addMonths(w.lastMedicalVisit, w.medicalValidityMonths || 12)
        : null;
      const medStatus = getDeadlineStatus(medExpiry);
      if (medStatus.code !== 'valid') {
        list.push({
          id: `alert-med-${w.id}`,
          kind: 'medical',
          companyId: w.companyId,
          companyName: compName,
          workerId: w.id,
          workerName: w.fullName,
          title: `Visita Medica Annuale — ${w.fullName}`,
          detail: medExpiry
            ? `Scadenza: ${formatDate(medExpiry)} (${medStatus.label})`
            : 'Visita medica preventiva da effettuare',
          severity: medStatus.code,
        });
      }

      w.courses.forEach((c: any) => {
        const courseExpiry = c.issueDate
          ? addMonths(c.issueDate, c.validityMonths)
          : null;
        const cStatus = getDeadlineStatus(courseExpiry);
        if (cStatus.code !== 'valid') {
          list.push({
            id: `alert-course-${w.id}-${c.id}`,
            kind: 'course',
            companyId: w.companyId,
            companyName: compName,
            workerId: w.id,
            workerName: w.fullName,
            title: `${c.title} — ${w.fullName}`,
            detail: courseExpiry
              ? `Scadenza attestato: ${formatDate(courseExpiry)} (${
                  cStatus.label
                })`
              : 'Corso da frequentare / programmare',
            severity: cStatus.code,
          });
        }
      });
    });

    requests
      .filter((r) => r.status !== 'Completata')
      .forEach((r) => {
        const comp = companies.find((c) => c.id === r.companyId);
        list.push({
          id: `alert-req-${r.id}`,
          kind: 'request',
          requestId: r.id,
          companyId: r.companyId,
          companyName: comp ? comp.name : 'Azienda',
          title:
            r.type === 'NUOVO_ASSUNTO'
              ? `Nuovo Assunto segnalato: ${r.workerName}`
              : `Segnalazione Cliente (${r.type})`,
          detail: r.notes || `Inviata il ${formatDate(r.createdAt)}`,
          severity: 'request',
        });
      });

    return list;
  }, [workers, companies, requests]);

  const unreadAlertsCount = computedAlerts.filter(
    (a) => !readAlertIds.includes(a.id)
  ).length;

  const markAlertRead = (id: string) => {
    if (!readAlertIds.includes(id)) {
      setReadAlertIds([...readAlertIds, id]);
    }
  };

  const markAllAlertsRead = () => {
    setReadAlertIds(computedAlerts.map((a) => a.id));
  };

  // Salvataggio reale su Supabase: Rinnovo Corso
  const confirmRenewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget || !renewDate) return;
    setSaving(true);
    const code =
      renewTarget.certificateCode ||
      `ATT-${renewDate.replaceAll('-', '')}-${Math.floor(
        100 + Math.random() * 900
      )}`;

    const { error } = await supabase
      .from('attestati_lavoratori')
      .update({
        data_rilascio: renewDate,
        codice_attestato: code,
      })
      .eq('id', renewTarget.courseId);

    setSaving(false);
    if (!error) {
      setRenewTarget(null);
      await loadAllData();
    } else {
      alert('Errore salvataggio corso: ' + error.message);
    }
  };

  // Salvataggio reale su Supabase: Visita Medica Annuale
  const confirmMedicalVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalTarget || !medicalDate) return;
    setSaving(true);

    const { error } = await supabase
      .from('lavoratori')
      .update({
        ultima_visita_medica: medicalDate,
        esito_visita_medica: medicalOutcome,
      })
      .eq('id', medicalTarget.workerId);

    setSaving(false);
    if (!error) {
      setMedicalTarget(null);
      await loadAllData();
    } else {
      alert('Errore salvataggio visita medica: ' + error.message);
    }
  };

  // Inserimento reale su Supabase di un nuovo assunto segnalato dal cliente
  const handleIntegrateNewHire = async (req: any) => {
    setSaving(true);
    const rolesToAssign =
      req.proposedRoles && req.proposedRoles.length > 0
        ? req.proposedRoles
        : ['Dipendente'];

    const { data: insertedWorker, error: wErr } = await supabase
      .from('lavoratori')
      .insert({
        azienda_id: req.companyId,
        nome_completo: req.workerName || 'Nuovo Dipendente',
        codice_fiscale: req.fiscalCode || 'ND',
        ruoli: rolesToAssign,
        data_assunzione: todayISO(),
        ultima_visita_medica: null,
        validita_visita_mesi: 12,
        esito_visita_medica: 'Visita preventiva da programmare',
      })
      .select()
      .single();

    if (wErr || !insertedWorker) {
      setSaving(false);
      alert('Errore inserimento lavoratore: ' + wErr?.message);
      return;
    }

    await supabase.from('attestati_lavoratori').insert([
      {
        lavoratore_id: insertedWorker.id,
        titolo_corso: 'Formazione Lavoratori (Generale + Specifica)',
        area: 'Sicurezza D.Lgs. 81/08',
        ore: 12,
        data_rilascio: null,
        validita_mesi: 60,
      },
      {
        lavoratore_id: insertedWorker.id,
        titolo_corso: 'Corso HACCP Base',
        area: 'Autocontrollo HACCP',
        ore: 6,
        data_rilascio: null,
        validita_mesi: 36,
      },
      {
        lavoratore_id: insertedWorker.id,
        titolo_corso: 'Corso HACCP Specifico',
        area: 'Autocontrollo HACCP',
        ore: 6,
        data_rilascio: null,
        validita_mesi: 36,
      },
    ]);

    await supabase
      .from('segnalazioni_clienti')
      .update({ stato: 'Completata', letta_da_ente: true })
      .eq('id', req.id);

    setSaving(false);
    await loadAllData();
    setEnteTab('workers');
  };

  // Invio reale segnalazione dal Portale / App Cliente
  const handleSendClientRequest = async (
    e: React.FormEvent,
    companyId: string
  ) => {
    e.preventDefault();
    if (!reqWorkerName.trim() && reqType === 'NUOVO_ASSUNTO') return;
    setSaving(true);

    const { error } = await supabase.from('segnalazioni_clienti').insert({
      azienda_id: companyId,
      tipo: reqType,
      stato: 'Da gestire',
      nome_lavoratore: reqWorkerName.trim() || 'Segnalazione Generale',
      codice_fiscale: reqFiscalCode.trim().toUpperCase(),
      ruoli_proposti: reqRoles,
      note: reqNotes.trim(),
    });

    setSaving(false);
    if (!error) {
      setReqWorkerName('');
      setReqFiscalCode('');
      setReqNotes('');
      setReqFeedback(
        "Segnalazione salvata nel database! L'ente di formazione la visualizza subito."
      );
      await loadAllData();
      setTimeout(() => setReqFeedback(''), 4500);
    } else {
      alert('Errore invio segnalazione: ' + error.message);
    }
  };

  const toggleRoleSelection = (role: string) => {
    setReqRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Salvataggio reale DVR / Documento
  const handleAddDocument = async (e: React.FormEvent, companyId: string) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('documenti_aziendali').insert({
      azienda_id: companyId,
      titolo: newDocTitle.trim(),
      categoria: newDocCategory,
      revisione: newDocVersion.trim() || 'Rev. 01',
      data_caricamento: todayISO(),
      note: newDocNotes.trim(),
    });

    setSaving(false);
    if (!error) {
      setNewDocTitle('');
      setNewDocNotes('');
      await loadAllData();
    } else {
      alert('Errore salvataggio documento: ' + error.message);
    }
  };

  // Salvataggio reale Dispensa
  const handleAddHandout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandoutTitle.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('dispense').insert({
      azienda_id: null,
      titolo: newHandoutTitle.trim(),
      area: newHandoutArea,
      tag_corso: newHandoutCourseTag.trim() || 'Dispensa',
      numero_pagine: Number(newHandoutPages) || 20,
      riepilogo: newHandoutSummary.trim() || 'Materiale didattico aggiornato.',
      data_aggiornamento: todayISO(),
    });

    setSaving(false);
    if (!error) {
      setNewHandoutTitle('');
      setNewHandoutSummary('');
      await loadAllData();
    } else {
      alert('Errore salvataggio dispensa: ' + error.message);
    }
  };

  // Creazione reale nuova azienda cliente
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompUser.trim() || !newCompPass.trim())
      return;
    setSaving(true);

    const { data, error } = await supabase
      .from('aziende')
      .insert({
        ragione_sociale: newCompName.trim(),
        settore: 'Attività Commerciale / Ristorazione',
        partita_iva: newCompVat.trim() || '00000000000',
        codice_ateco: '56.10.11',
        indirizzo: 'Isernia (IS)',
        referente_nome: 'Referente Aziendale',
        referente_email: 'info@azienda.it',
        username_portale: newCompUser.trim(),
        password_portale: newCompPass.trim(),
        accesso_attivo: true,
        medico_competente_nome: 'Dott.ssa Elena Marchetti',
        medico_competente_data_nomina: todayISO(),
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setNewCompName('');
      setNewCompVat('');
      setNewCompUser('');
      setNewCompPass('');
      await loadAllData();
      setSelectedCompanyId(data.id);
    } else {
      alert('Errore creazione azienda: ' + error?.message);
    }
  };

  const toggleCompanyAccess = async (comp: any) => {
    setSaving(true);
    await supabase
      .from('aziende')
      .update({ accesso_attivo: !comp.appActive })
      .eq('id', comp.id);
    setSaving(false);
    await loadAllData();
  };

  const resetCompanyPassword = async (compId: string) => {
    const suggested = `Accesso${Math.floor(1000 + Math.random() * 9000)}!`;
    setSaving(true);
    await supabase
      .from('aziende')
      .update({ password_portale: suggested })
      .eq('id', compId);
    setSaving(false);
    await loadAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3 p-6">
        <Database className="w-8 h-8 text-emerald-400 animate-pulse" />
        <div className="text-sm font-semibold">
          Connessione al database Supabase in corso...
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-lg bg-white text-slate-900 rounded-2xl p-6 space-y-4">
          <div className="font-bold text-red-700 text-base">
            Connessione al database da completare
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{dbError}</p>
          <button
            type="button"
            onClick={loadAllData}
            className="bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
          >
            Riprova Connessione
          </button>
        </div>
      </div>
    );
  }

  // SCHERMATA DI LOGIN
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-medium mb-5">
                <Database className="w-4 h-4 text-emerald-300" />
                Database Cloud Attivo • Sicurezza 81/08 & HACCP
              </div>
              <h1 className="text-2xl font-bold leading-snug mb-3">
                FormaSafe & HACCP Manager
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed">
                Gestionale operativo collegato al database permanente per
                attestati, visite mediche annuali, DVR, dispense e segnalazioni
                dai clienti da PC desktop e smartphone.
              </p>
            </div>

            <div className="mt-8 space-y-2 text-xs text-blue-100 bg-black/20 p-4 rounded-xl">
              <div className="font-semibold text-white">
                Credenziali di accesso:
              </div>
              <div>
                <strong>Ente di Formazione:</strong> <code>admin.ente</code> /{' '}
                <code>FormaSafe2026!</code>
              </div>
              {companies[0] && (
                <div>
                  <strong>Cliente ({companies[0].name}):</strong>{' '}
                  <code>{companies[0].username}</code> /{' '}
                  <code>{companies[0].password}</code>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-lg mb-2">
              <KeyRound className="w-5 h-5" />
              Accedi al Portale
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Inserisci nome utente e password del tuo profilo.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Nome Utente
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="es. osteria.borgo oppure admin.ente"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Inserisci la password"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm"
                />
              </div>

              {loginError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg text-sm cursor-pointer"
              >
                Entra
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-500 mb-2.5">
                Accesso rapido:
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickLogin('ente')}
                  className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold py-2.5 px-3 rounded-lg cursor-pointer"
                >
                  Ente di Formazione
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('client', companies[0]?.id)}
                  className="border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold py-2.5 px-3 rounded-lg cursor-pointer"
                >
                  Cliente (PC & App)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA ENTE DI FORMAZIONE (BACK-OFFICE)
  if (session.role === 'ente') {
    const activeCompany =
      companies.find((c) => c.id === selectedCompanyId) || companies[0];
    const companyWorkers = workers.filter(
      (w) => w.companyId === activeCompany?.id
    );
    const companyDocs = documents.filter(
      (d) => d.companyId === activeCompany?.id
    );

    const filteredWorkers = companyWorkers.filter((w) => {
      const matchesSearch =
        w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.roles.some((r: string) =>
          r.toLowerCase().includes(searchTerm.toLowerCase())
        );
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;

      const medExp = w.lastMedicalVisit
        ? addMonths(w.lastMedicalVisit, w.medicalValidityMonths || 12)
        : null;
      const medSt = getDeadlineStatus(medExp);
      if (statusFilter === 'medical') return medSt.code !== 'valid';

      return w.courses.some((c: any) => {
        const exp = c.issueDate
          ? addMonths(c.issueDate, c.validityMonths)
          : null;
        return getDeadlineStatus(exp).code === statusFilter;
      });
    });

    const expiredCoursesCount = workers.reduce((acc, w) => {
      return (
        acc +
        w.courses.filter((c: any) => {
          const exp = c.issueDate
            ? addMonths(c.issueDate, c.validityMonths)
            : null;
          return getDeadlineStatus(exp).code === 'expired';
        }).length
      );
    }, 0);

    const medicalAlertsCount = workers.filter((w) => {
      const exp = w.lastMedicalVisit
        ? addMonths(w.lastMedicalVisit, w.medicalValidityMonths || 12)
        : null;
      return getDeadlineStatus(exp).code !== 'valid';
    }).length;

    const pendingCoursesCount = workers.reduce((acc, w) => {
      return (
        acc +
        w.courses.filter(
          (c: any) =>
            getDeadlineStatus(
              c.issueDate ? addMonths(c.issueDate, c.validityMonths) : null
            ).code === 'pending'
        ).length
      );
    }, 0);

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="bg-blue-950 text-white px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 border border-emerald-400/40 p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold text-sm lg:text-base leading-tight flex items-center gap-2">
                FormaSafe & HACCP Manager — Back-Office Ente
                {saving && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    Salvataggio...
                  </span>
                )}
              </div>
              <div className="text-[11px] text-blue-200">
                Sincronizzato con Database Cloud Supabase
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activeCompany && (
              <select
                value={activeCompany.id}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-blue-900 border border-blue-700 text-white text-xs rounded-lg px-3 py-2"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={loadAllData}
              className="bg-blue-900 hover:bg-blue-800 border border-blue-700 p-2 rounded-lg cursor-pointer"
              title="Aggiorna dati dal database"
            >
              <RefreshCw className="w-4 h-4 text-blue-200" />
            </button>

            <button
              type="button"
              onClick={() => setEnteTab('alerts')}
              className="relative bg-blue-900 hover:bg-blue-800 border border-blue-700 p-2 rounded-lg cursor-pointer"
              title="Centro Notifiche"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {activeCompany && (
              <button
                type="button"
                onClick={() => quickLogin('client', activeCompany.id)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
              >
                Apri Vista Cliente
              </button>
            )}

            <button
              type="button"
              onClick={() => setSession(null)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Esci
            </button>
          </div>
        </header>

        <nav className="bg-white border-b border-slate-200 px-4 lg:px-8 flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Panoramica & Ruoli', icon: Building2 },
            {
              id: 'workers',
              label: 'Lavoratori, Corsi & Visite Mediche',
              icon: Users,
            },
            {
              id: 'alerts',
              label: `Notifiche & Segnalazioni (${computedAlerts.length})`,
              icon: Bell,
            },
            { id: 'documents', label: 'DVR & Documenti', icon: FileText },
            { id: 'handouts', label: 'Dispense Corsi & HACCP', icon: BookOpen },
            { id: 'credentials', label: 'Credenziali Clienti', icon: KeyRound },
          ].map((t) => {
            const Icon = t.icon;
            const active = enteTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setEnteTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-blue-800 text-blue-900 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Attestati Scaduti
              </div>
              <div className="text-2xl font-bold text-red-700 mt-1">
                {expiredCoursesCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Visite Mediche Annuali (Alert)
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {medicalAlertsCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Corsi da Frequentare
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {pendingCoursesCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Segnalazioni da Clienti
              </div>
              <div className="text-2xl font-bold text-blue-800 mt-1">
                {requests.filter((r) => r.status !== 'Completata').length}
              </div>
            </div>
          </div>

          {enteTab === 'overview' && activeCompany && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {activeCompany.sector}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      {activeCompany.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      P.IVA {activeCompany.vat} • ATECO {activeCompany.ateco} •{' '}
                      {activeCompany.address}
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <strong>Referente:</strong> {activeCompany.contactPerson}
                    </div>
                    <div>
                      <strong>Utente Portale:</strong>{' '}
                      <code>{activeCompany.username}</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Organigramma Ruoli Sicurezza & Personale (
                    {companyWorkers.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {companyWorkers.map((w) => (
                      <div
                        key={w.id}
                        className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60"
                      >
                        <div className="font-semibold text-sm text-slate-900">
                          {w.fullName}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {w.roles.map((role: string) => (
                            <span
                              key={role}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2">
                          Assunzione: {formatDate(w.hireDate)} • CF:{' '}
                          <code>{w.fiscalCode}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                  <Stethoscope className="w-5 h-5" />
                  Nomina Medico Competente
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="text-sm font-bold text-teal-950">
                    {activeCompany.medicoCompetente.doctorName}
                  </div>
                  <div>
                    <strong>Data Nomina:</strong>{' '}
                    {formatDate(activeCompany.medicoCompetente.appointmentDate)}
                  </div>
                  <div>
                    <strong>Protocollo:</strong>{' '}
                    <code>{activeCompany.medicoCompetente.protocolNumber}</code>
                  </div>
                  <p className="text-teal-900 pt-1 leading-relaxed">
                    {activeCompany.medicoCompetente.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {enteTab === 'workers' && activeCompany && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Archivio Lavoratori, Corsi (81/08 + HACCP) & Visite Mediche
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ogni aggiornamento viene salvato permanentemente su
                    Supabase.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cerca nome o ruolo..."
                      className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="expired">Attestati scaduti</option>
                    <option value="expiring">
                      Attestati in scadenza (≤60 gg)
                    </option>
                    <option value="pending">Corsi da frequentare</option>
                    <option value="medical">Visite mediche in alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredWorkers.map((w) => {
                  const medExpiry = w.lastMedicalVisit
                    ? addMonths(
                        w.lastMedicalVisit,
                        w.medicalValidityMonths || 12
                      )
                    : null;
                  const medStatus = getDeadlineStatus(medExpiry);

                  return (
                    <div
                      key={w.id}
                      className="border border-slate-200 rounded-xl p-4 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-slate-900">
                              {w.fullName}
                            </span>
                            {w.roles.map((r: string) => (
                              <span
                                key={r}
                                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            CF: <code>{w.fiscalCode}</code> • Assunto il{' '}
                            {formatDate(w.hireDate)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2">
                          <div className="text-xs">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                              Visita Medica Annuale
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              Ultima: {formatDate(w.lastMedicalVisit)} •
                              Prossima: <strong>{formatDate(medExpiry)}</strong>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${medStatus.badgeClass}`}
                          >
                            {medStatus.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setMedicalTarget({
                                workerId: w.id,
                                workerName: w.fullName,
                              });
                              setMedicalDate(todayISO());
                              setMedicalOutcome(w.medicalOutcome || 'Idoneo');
                            }}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Registra Visita
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {w.courses.map((c: any) => {
                          const expiry = c.issueDate
                            ? addMonths(c.issueDate, c.validityMonths)
                            : null;
                          const st = getDeadlineStatus(expiry);
                          return (
                            <div
                              key={c.id}
                              className="border border-slate-200 rounded-lg p-3 flex flex-col justify-between gap-2.5 bg-white"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      c.area.includes('HACCP')
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {c.area} ({c.hours}h)
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.badgeClass}`}
                                  >
                                    {st.label}
                                  </span>
                                </div>
                                <div className="font-semibold text-xs text-slate-900 mt-2">
                                  {c.title}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Rilascio: {formatDate(c.issueDate)} • Scad:{' '}
                                  {formatDate(expiry)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenewTarget({
                                      workerId: w.id,
                                      workerName: w.fullName,
                                      courseId: c.id,
                                      courseTitle: c.title,
                                      certificateCode: c.certificateCode,
                                    });
                                    setRenewDate(todayISO());
                                  }}
                                  className="text-xs font-semibold text-blue-800 hover:underline cursor-pointer"
                                >
                                  {c.issueDate
                                    ? 'Registra Rinnovo'
                                    : 'Registra Conseguimento'}
                                </button>

                                {c.certificateCode && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerTextDownload(
                                        `${
                                          c.certificateCode
                                        }_${w.fullName.replaceAll(
                                          ' ',
                                          '_'
                                        )}.txt`,
                                        `ATTESTATO DI FORMAZIONE\nAzienda: ${
                                          activeCompany.name
                                        }\nLavoratore: ${w.fullName} (CF: ${
                                          w.fiscalCode
                                        })\nCorso: ${c.title} (${
                                          c.hours
                                        } ore)\nCodice Attestato: ${
                                          c.certificateCode
                                        }\nData Rilascio: ${formatDate(
                                          c.issueDate
                                        )}\nScadenza: ${formatDate(expiry)}\n`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Attestato
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {enteTab === 'alerts' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Centro Alert Automatici (Attestati & Visite Mediche)
                  </h2>
                  <button
                    type="button"
                    onClick={markAllAlertsRead}
                    className="text-xs text-blue-800 font-semibold hover:underline cursor-pointer"
                  >
                    Segna tutti come letti
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {computedAlerts.map((a) => {
                    const isRead = readAlertIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => markAlertRead(a.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer ${
                          isRead
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : 'bg-amber-50/40 border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {a.title}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {a.kind === 'medical'
                              ? 'Visita Medica'
                              : a.kind === 'request'
                              ? 'Segnalazione'
                              : 'Attestato'}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">{a.detail}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {a.companyName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Segnalazioni Ricevute da App / Portale Cliente
                </h2>
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="border border-slate-200 rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-blue-900">
                          {r.type.replaceAll('_', ' ')}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            r.status === 'Completata'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {r.workerName}{' '}
                        {r.fiscalCode && (
                          <span className="text-xs font-normal text-slate-500">
                            ({r.fiscalCode})
                          </span>
                        )}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                          {r.notes}
                        </p>
                      )}
                      {r.status !== 'Completata' &&
                        r.type === 'NUOVO_ASSUNTO' && (
                          <button
                            type="button"
                            onClick={() => handleIntegrateNewHire(r)}
                            className="mt-1 inline-flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Inserisci Subito in Anagrafica
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {enteTab === 'documents' && activeCompany && (
            <div className="grid lg:grid-cols-3 gap-6">
              <form
                onSubmit={(e) => handleAddDocument(e, activeCompany.id)}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 h-fit"
              >
                <h2 className="text-base font-bold text-slate-900">
                  Carica DVR / Documento Aziendale
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Titolo Documento
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="es. DVR Aggiornamento Rischi 2026"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="DVR Sicurezza">DVR Sicurezza</option>
                    <option value="Manuale HACCP">Manuale HACCP</option>
                    <option value="Sorveglianza Sanitaria">
                      Sorveglianza Sanitaria
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Revisione / Protocollo
                  </label>
                  <input
                    type="text"
                    value={newDocVersion}
                    onChange={(e) => setNewDocVersion(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Note
                  </label>
                  <textarea
                    rows={3}
                    value={newDocNotes}
                    onChange={(e) => setNewDocNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  Pubblica nell'Area Cliente
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900 mb-2">
                  Documenti Disponibili per {activeCompany.name}
                </h2>
                {companyDocs.map((d) => (
                  <div
                    key={d.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {d.category} • {d.version}
                      </span>
                      <div className="font-bold text-sm text-slate-900 mt-1.5">
                        {d.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {d.notes}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Aggiornato il {formatDate(d.uploadDate)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerTextDownload(
                          `${d.title
                            .toLowerCase()
                            .replaceAll(/[^a-z0-9]+/g, '_')}.txt`,
                          `DOCUMENTO AZIENDALE: ${d.title}\nCategoria: ${
                            d.category
                          } (${d.version})\nAzienda: ${
                            activeCompany.name
                          }\nData: ${formatDate(d.uploadDate)}\nNote: ${
                            d.notes
                          }\n`
                        )
                      }
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Scarica
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enteTab === 'handouts' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <form
                onSubmit={handleAddHandout}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 h-fit"
              >
                <h2 className="text-base font-bold text-slate-900">
                  Inserisci Nuova Dispensa
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Titolo Dispensa
                  </label>
                  <input
                    type="text"
                    required
                    value={newHandoutTitle}
                    onChange={(e) => setNewHandoutTitle(e.target.value)}
                    placeholder="es. Dispensa Gestione Allergeni"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Area
                  </label>
                  <select
                    value={newHandoutArea}
                    onChange={(e) => setNewHandoutArea(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Autocontrollo HACCP">
                      Autocontrollo HACCP
                    </option>
                    <option value="Sicurezza D.Lgs. 81/08">
                      Sicurezza D.Lgs. 81/08
                    </option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Corso / Tag
                    </label>
                    <input
                      type="text"
                      value={newHandoutCourseTag}
                      onChange={(e) => setNewHandoutCourseTag(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      N° Pagine
                    </label>
                    <input
                      type="number"
                      value={newHandoutPages}
                      onChange={(e) => setNewHandoutPages(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contenuti Principali
                  </label>
                  <textarea
                    rows={3}
                    value={newHandoutSummary}
                    onChange={(e) => setNewHandoutSummary(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  Pubblica Dispensa ai Clienti
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900 mb-2">
                  Archivio Dispense Didattiche ({handouts.length})
                </h2>
                {handouts.map((h) => (
                  <div
                    key={h.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                          {h.area}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {h.courseTag} • {h.pages} pag.
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1.5">
                        {h.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{h.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerTextDownload(
                          `${h.title
                            .toLowerCase()
                            .replaceAll(/[^a-z0-9]+/g, '_')}.txt`,
                          `DISPENSA DIDATTICA\nTitolo: ${h.title}\nArea: ${
                            h.area
                          }\nCorso: ${h.courseTag}\nPagine: ${
                            h.pages
                          }\nAggiornamento: ${formatDate(
                            h.updatedAt
                          )}\n\nSintesi contenuti:\n${h.summary}\n`
                        )
                      }
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Scarica
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enteTab === 'credentials' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <form
                onSubmit={handleAddCompany}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 h-fit"
              >
                <h2 className="text-base font-bold text-slate-900">
                  Nuova Azienda Cliente & Credenziali
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ragione Sociale
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="es. Trattoria del Corso S.n.c."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={newCompVat}
                    onChange={(e) => setNewCompVat(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome Utente Accesso
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompUser}
                    onChange={(e) => setNewCompUser(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Password Iniziale
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompPass}
                    onChange={(e) => setNewCompPass(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  Crea Azienda e Credenziali
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900 mb-2">
                  Gestione Accessi Clienti (PC & App)
                </h2>
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-sm text-slate-900">
                        {c.name}
                      </div>
                      <div>
                        <strong>Username:</strong> <code>{c.username}</code> •{' '}
                        <strong>Password:</strong> <code>{c.password}</code>
                      </div>
                      <div>
                        Stato accesso:{' '}
                        <span
                          className={
                            c.appActive
                              ? 'text-emerald-700 font-semibold'
                              : 'text-red-700 font-semibold'
                          }
                        >
                          {c.appActive ? 'Attivo' : 'Sospeso'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetCompanyPassword(c.id)}
                        className="inline-flex items-center gap-1 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Nuova Password
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompanyAccess(c)}
                        className="inline-flex items-center gap-1 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {c.appActive ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            Sospendi
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            Attiva
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {renewTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={confirmRenewCourse}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            >
              <h3 className="text-base font-bold text-slate-900">
                {renewTarget.courseTitle}
              </h3>
              <p className="text-xs text-slate-600">
                Lavoratore: <strong>{renewTarget.workerName}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data Conseguimento / Rinnovo
                </label>
                <input
                  type="date"
                  required
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-800 hover:bg-blue-900 text-white rounded-lg cursor-pointer"
                >
                  Salva su Database
                </button>
              </div>
            </form>
          </div>
        )}

        {medicalTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={confirmMedicalVisit}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            >
              <h3 className="text-base font-bold text-slate-900">
                Registra Visita Medica Annuale
              </h3>
              <p className="text-xs text-slate-600">
                Lavoratore: <strong>{medicalTarget.workerName}</strong> •
                Prossima scadenza automatica: +12 mesi
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data Visita Medica Effettuata
                </label>
                <input
                  type="date"
                  required
                  value={medicalDate}
                  onChange={(e) => setMedicalDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Esito / Idoneità
                </label>
                <input
                  type="text"
                  value={medicalOutcome}
                  onChange={(e) => setMedicalOutcome(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMedicalTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer"
                >
                  Salva Visita (+12 Mesi)
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // VISTA PORTALE / APP CLIENTE (DESKTOP + MOBILE)
  const myCompany =
    companies.find((c) => c.id === session.companyId) || companies[0];
  const myWorkers = workers.filter((w) => w.companyId === myCompany?.id);
  const myDocs = documents.filter((d) => d.companyId === myCompany?.id);
  const myRequests = requests.filter((r) => r.companyId === myCompany?.id);

  const myUrgentItems: any[] = [];
  myWorkers.forEach((w) => {
    const medExp = w.lastMedicalVisit
      ? addMonths(w.lastMedicalVisit, w.medicalValidityMonths || 12)
      : null;
    const medSt = getDeadlineStatus(medExp);
    if (medSt.code !== 'valid') {
      myUrgentItems.push({
        id: `m-${w.id}`,
        worker: w.fullName,
        label: `Visita medica annuale: ${medSt.label}`,
        status: medSt.code,
      });
    }
    w.courses.forEach((c: any) => {
      const exp = c.issueDate ? addMonths(c.issueDate, c.validityMonths) : null;
      const st = getDeadlineStatus(exp);
      if (st.code !== 'valid') {
        myUrgentItems.push({
          id: `c-${w.id}-${c.id}`,
          worker: w.fullName,
          label: `${c.title}: ${st.label}`,
          status: st.code,
        });
      }
    });
  });

  const filteredMyWorkers = myWorkers.filter((w) => {
    if (clientWorkerFilter === 'all') return true;
    if (clientWorkerFilter === 'medical') {
      const medExp = w.lastMedicalVisit
        ? addMonths(w.lastMedicalVisit, w.medicalValidityMonths || 12)
        : null;
      return getDeadlineStatus(medExp).code !== 'valid';
    }
    return w.courses.some((c: any) => {
      const exp = c.issueDate ? addMonths(c.issueDate, c.validityMonths) : null;
      return getDeadlineStatus(exp).code === clientWorkerFilter;
    });
  });

  const filteredHandouts = handouts.filter((h) =>
    handoutAreaFilter === 'all' ? true : h.area === handoutAreaFilter
  );

  const clientNavItems = [
    { id: 'home', label: 'Stato Azienda', icon: Building2 },
    { id: 'team', label: 'Personale & Attestati', icon: Users },
    { id: 'docs', label: 'DVR & Documenti', icon: FileText },
    { id: 'handouts', label: 'Dispense', icon: BookOpen },
    { id: 'report', label: 'Comunica Aggiornamento', icon: Send },
  ];

  const isMobilePreview = clientViewMode === 'mobile';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <header className="bg-teal-900 text-white px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-emerald-300" />
          <div>
            <div className="font-bold text-sm">{myCompany?.name}</div>
            <div className="text-[11px] text-teal-200">
              Portale & App Cliente • Medico Competente:{' '}
              {myCompany?.medicoCompetente.doctorName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-teal-950/70 p-1 rounded-lg border border-teal-700/60">
            <button
              type="button"
              onClick={() => setClientViewMode('desktop')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                !isMobilePreview
                  ? 'bg-white text-teal-950'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              PC Desktop
            </button>
            <button
              type="button"
              onClick={() => setClientViewMode('mobile')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                isMobilePreview
                  ? 'bg-white text-teal-950'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              App Mobile
            </button>
          </div>

          <button
            type="button"
            onClick={() => quickLogin('ente')}
            className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Vista Ente
          </button>

          <button
            type="button"
            onClick={() => setSession(null)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Esci
          </button>
        </div>
      </header>

      <div
        className={`flex-1 mx-auto w-full ${
          isMobilePreview ? 'max-w-md py-6 px-3' : 'max-w-7xl p-4 lg:p-8'
        }`}
      >
        <div
          className={
            isMobilePreview
              ? 'bg-white rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden min-h-[680px] flex flex-col justify-between'
              : 'grid lg:grid-cols-12 gap-6 items-start'
          }
        >
          {!isMobilePreview && (
            <aside className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-3 space-y-1">
              {clientNavItems.map((item) => {
                const Icon = item.icon;
                const active = clientTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClientTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left cursor-pointer ${
                      active
                        ? 'bg-teal-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                );
              })}
            </aside>
          )}

          <div
            className={
              isMobilePreview
                ? 'p-4 space-y-4 overflow-y-auto'
                : 'lg:col-span-9 space-y-6'
            }
          >
            {clientTab === 'home' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Situazione Formazione & Visite Mediche
                  </h2>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-[11px] text-slate-500">
                        Personale
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {myWorkers.length}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-[11px] text-red-700">
                        In Alert / Scaduti
                      </div>
                      <div className="text-xl font-bold text-red-800">
                        {myUrgentItems.length}
                      </div>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <div className="text-[11px] text-teal-800">Dispense</div>
                      <div className="text-xl font-bold text-teal-900">
                        {handouts.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Scadenze e Visite Mediche da Attenzionare (
                    {myUrgentItems.length})
                  </h3>
                  {myUrgentItems.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 text-xs border border-slate-200 rounded-lg p-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {u.worker}
                        </div>
                        <div className="text-slate-600">{u.label}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setClientTab('report')}
                        className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                      >
                        Segnala
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientTab === 'team' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Personale, Corsi (81/08 & HACCP) e Visite Mediche Annuali
                  </h2>
                  <select
                    value={clientWorkerFilter}
                    onChange={(e) => setClientWorkerFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="all">Tutti i lavoratori</option>
                    <option value="expired">Con attestati scaduti</option>
                    <option value="expiring">Con attestati in scadenza</option>
                    <option value="pending">Con corsi da frequentare</option>
                    <option value="medical">Con visita medica in alert</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredMyWorkers.map((w) => {
                    const medExp = w.lastMedicalVisit
                      ? addMonths(
                          w.lastMedicalVisit,
                          w.medicalValidityMonths || 12
                        )
                      : null;
                    const medSt = getDeadlineStatus(medExp);

                    return (
                      <div
                        key={w.id}
                        className="border border-slate-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-slate-900">
                              {w.fullName}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {w.roles.map((r: string) => (
                                <span
                                  key={r}
                                  className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                            <div className="font-semibold text-teal-950">
                              Visita Medica Annuale: {formatDate(medExp)}
                            </div>
                            <div className="text-[11px] text-teal-800">
                              Stato: {medSt.label} • {w.medicalOutcome}
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {w.courses.map((c: any) => {
                            const exp = c.issueDate
                              ? addMonths(c.issueDate, c.validityMonths)
                              : null;
                            const st = getDeadlineStatus(exp);
                            return (
                              <div
                                key={c.id}
                                className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {c.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Scadenza: {formatDate(exp)} •{' '}
                                    <span className="font-medium">
                                      {st.label}
                                    </span>
                                  </div>
                                </div>
                                {c.certificateCode && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerTextDownload(
                                        `${
                                          c.certificateCode
                                        }_${w.fullName.replaceAll(
                                          ' ',
                                          '_'
                                        )}.txt`,
                                        `ATTESTATO DI FORMAZIONE\nAzienda: ${
                                          myCompany?.name
                                        }\nLavoratore: ${w.fullName}\nCorso: ${
                                          c.title
                                        }\nCodice: ${
                                          c.certificateCode
                                        }\nRilascio: ${formatDate(
                                          c.issueDate
                                        )}\nScadenza: ${formatDate(exp)}\n`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    Scarica
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {clientTab === 'docs' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  DVR & Documentazione Aziendale
                </h2>
                {myDocs.map((d) => (
                  <div
                    key={d.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {d.category} • {d.version}
                      </span>
                      <div className="font-bold text-sm text-slate-900 mt-1">
                        {d.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{d.notes}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerTextDownload(
                          `${d.title
                            .toLowerCase()
                            .replaceAll(/[^a-z0-9]+/g, '_')}.txt`,
                          `DOCUMENTO: ${d.title}\nAzienda: ${
                            myCompany?.name
                          }\nVersione: ${d.version}\nData: ${formatDate(
                            d.uploadDate
                          )}\nNote: ${d.notes}\n`
                        )
                      }
                      className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Scarica Documento
                    </button>
                  </div>
                ))}
              </div>
            )}

            {clientTab === 'handouts' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Dispense Corsi & Autocontrollo HACCP
                  </h2>
                  <select
                    value={handoutAreaFilter}
                    onChange={(e) => setHandoutAreaFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="all">Tutte le dispense</option>
                    <option value="Autocontrollo HACCP">
                      Autocontrollo HACCP
                    </option>
                    <option value="Sicurezza D.Lgs. 81/08">
                      Sicurezza D.Lgs. 81/08
                    </option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredHandouts.map((h) => (
                    <div
                      key={h.id}
                      className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                          {h.area} • {h.courseTag}
                        </span>
                        <div className="font-bold text-sm text-slate-900 mt-1">
                          {h.title}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {h.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          triggerTextDownload(
                            `${h.title
                              .toLowerCase()
                              .replaceAll(/[^a-z0-9]+/g, '_')}.txt`,
                            `DISPENSA: ${h.title}\nArea: ${h.area}\nCorso: ${h.courseTag}\nPagine: ${h.pages}\n\n${h.summary}\n`
                          )
                        }
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Scarica Dispensa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientTab === 'report' && myCompany && (
              <div className="space-y-5">
                <form
                  onSubmit={(e) => handleSendClientRequest(e, myCompany.id)}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <h2 className="text-base font-bold text-slate-900">
                    Comunica Aggiornamento all'Ente di Formazione
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tipo di Segnalazione
                    </label>
                    <select
                      value={reqType}
                      onChange={(e) => setReqType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="NUOVO_ASSUNTO">Nuovo Assunto</option>
                      <option value="CAMBIO_MANSIONE">
                        Cambio Mansione / Ruolo
                      </option>
                      <option value="RINNOVO_CORSO_VISITA">
                        Richiesta Rinnovo Attestato / Visita Medica
                      </option>
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome e Cognome Dipendente
                      </label>
                      <input
                        type="text"
                        required={reqType === 'NUOVO_ASSUNTO'}
                        value={reqWorkerName}
                        onChange={(e) => setReqWorkerName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Codice Fiscale
                      </label>
                      <input
                        type="text"
                        value={reqFiscalCode}
                        onChange={(e) => setReqFiscalCode(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Ruoli / Mansioni Previste
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Dipendente',
                        'Preposto',
                        'Addetto Antincendio',
                        'Addetto Primo Soccorso',
                        'RLS',
                      ].map((role) => {
                        const active = reqRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRoleSelection(role)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer ${
                              active
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Dettagli / Note
                    </label>
                    <textarea
                      rows={3}
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {reqFeedback && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      {reqFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                  >
                    Invia Segnalazione all'Ente
                  </button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Storico Segnalazioni Inviate ({myRequests.length})
                  </h3>
                  {myRequests.map((r) => (
                    <div
                      key={r.id}
                      className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">
                          {r.workerName}
                        </span>{' '}
                        <span className="text-slate-500">
                          • {r.type.replaceAll('_', ' ')} (
                          {formatDate(r.createdAt)})
                        </span>
                      </div>
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-full ${
                          r.status === 'Completata'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isMobilePreview && (
            <div className="bg-white border-t border-slate-200 grid grid-cols-5 py-1.5">
              {clientNavItems.map((item) => {
                const Icon = item.icon;
                const active = clientTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClientTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold cursor-pointer ${
                      active ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="truncate max-w-[60px]">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
