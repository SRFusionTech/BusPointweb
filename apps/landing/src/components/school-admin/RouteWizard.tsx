'use client';

import { useEffect, useState } from 'react';
import { X, Check, ChevronLeft, School, MapPin, Flag, Users, AlertCircle, Sparkles, PencilLine } from 'lucide-react';
import MapPicker, { PinnedPoint, LatLng } from './MapPicker';
import { api, getSchool, setSchool } from '@/lib/schoolAdminApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Edit mode: provide an existing route id to load + update. */
  editRouteId?: string | null;
}

type Step = 0 | 1 | 2;

const STEPS = [
  {
    title: 'Confirm school location',
    description: 'Drag the pin or search to fix where the bus drops students off.',
    Icon: School,
  },
  {
    title: 'Set the starting point',
    description: 'Where does the bus begin its route in the morning — depot, garage, or first stop area?',
    Icon: Flag,
  },
  {
    title: 'Add pickup points',
    description: 'Click the map (or search) to place every spot where students board. Order them by tap order.',
    Icon: Users,
  },
] as const;

export default function RouteWizard({ open, onClose, onCreated, editRouteId }: Props) {
  const school = getSchool();
  const [step, setStep] = useState<Step>(0);

  /* Step 1 — school location */
  const [schoolPoint, setSchoolPoint] = useState<PinnedPoint | null>(null);
  const [savingSchool, setSavingSchool] = useState(false);

  /* Step 2 — starting point */
  const [startPoint, setStartPoint] = useState<PinnedPoint | null>(null);

  /* Step 3 — pickup stops */
  const [stops, setStops] = useState<PinnedPoint[]>([]);

  /* Route meta */
  const [routeName, setRouteName] = useState('');
  const [notes, setNotes] = useState('');
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Reset / hydrate when opened */
  useEffect(() => {
    if (!open) return;
    setError('');
    setStep(0);
    setRenameIndex(null);
    setRenameValue('');

    if (!school?.id) {
      setError('No school in session. Please log in again.');
      return;
    }

    // Load fresh school data for accurate lat/lng
    api.getSchoolById(school.id)
      .then((s: any) => {
        if (s?.lat != null && s?.lng != null) {
          setSchoolPoint({ lat: Number(s.lat), lng: Number(s.lng), address: s.location });
        } else {
          setSchoolPoint(null);
        }
      })
      .catch(() => {});

    if (editRouteId) {
      api.getRoute(editRouteId)
        .then((r: any) => {
          setRouteName(r?.name ?? '');
          setNotes(r?.notes ?? '');
          if (r?.startLat != null && r?.startLng != null) {
            setStartPoint({ lat: Number(r.startLat), lng: Number(r.startLng), address: r.startAddress });
          }
          setStops((r?.stops ?? []).map((s: any) => ({
            id: s.id,
            lat: Number(s.lat),
            lng: Number(s.lng),
            label: s.name,
            address: s.address,
          })));
        })
        .catch((err: any) => setError(err?.message ?? 'Failed to load route.'));
    } else {
      setRouteName('');
      setNotes('');
      setStartPoint(null);
      setStops([]);
    }
  }, [open, editRouteId, school?.id]);

  if (!open) return null;

  const canNextFromStep = (s: Step): boolean => {
    if (s === 0) return Boolean(schoolPoint && schoolPoint.lat && schoolPoint.lng);
    if (s === 1) return Boolean(startPoint && startPoint.lat && startPoint.lng);
    return true;
  };

  const goNext = async () => {
    setError('');

    if (step === 0) {
      // Persist school coordinates if changed
      if (!schoolPoint) return;
      if (!school?.id) return;
      try {
        setSavingSchool(true);
        const updated = await api.updateSchool(school.id, {
          lat: schoolPoint.lat,
          lng: schoolPoint.lng,
          ...(schoolPoint.address ? { location: schoolPoint.address } : {}),
        });
        // Keep cached school in sync so other admin pages pick it up
        setSchool({
          id: school.id,
          name: updated?.name ?? school.name,
          location: updated?.location ?? school.location,
          lat: updated?.lat ?? schoolPoint.lat,
          lng: updated?.lng ?? schoolPoint.lng,
        });
      } catch (err: any) {
        setError(err?.message ?? 'Failed to save school location.');
        return;
      } finally {
        setSavingSchool(false);
      }
    }

    if (step < 2) setStep((step + 1) as Step);
    else void handleSubmit();
  };

  const goBack = () => {
    setError('');
    if (step === 0) onClose();
    else setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!school?.id) { setError('No school in session.'); return; }
    if (!startPoint || !routeName.trim()) {
      setError('Route name and starting point are required.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const stopsPayload = stops.map((s, idx) => ({
        name: s.label ?? s.address ?? `Stop ${idx + 1}`,
        lat: s.lat,
        lng: s.lng,
        address: s.address,
        stopOrder: idx,
      }));

      if (editRouteId) {
        // PATCH /routes/:id — UpdateRouteDto omits schoolId on purpose
        // (a route's school never changes); sending it tripped the
        // forbidNonWhitelisted validator.
        await api.updateRoute(editRouteId, {
          name: routeName.trim(),
          startLat: startPoint.lat,
          startLng: startPoint.lng,
          startAddress: startPoint.address,
          notes: notes.trim() || undefined,
          stops: stopsPayload,
        });
      } else {
        await api.createRoute({
          schoolId: school.id,
          name: routeName.trim(),
          startLat: startPoint.lat,
          startLng: startPoint.lng,
          startAddress: startPoint.address,
          notes: notes.trim() || undefined,
          stops: stopsPayload,
        });
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save route.');
    } finally {
      setSubmitting(false);
    }
  };

  const StepIcon = STEPS[step].Icon;

  const renameStop = (idx: number) => {
    const point = stops[idx];
    if (!point) return;
    setRenameIndex(idx);
    setRenameValue(point.label ?? point.address ?? `Pickup point ${idx + 1}`);
  };

  const saveStopName = () => {
    if (renameIndex == null) return;
    const updated = [...stops];
    updated[renameIndex] = {
      ...updated[renameIndex],
      label: renameValue.trim() || `Pickup point ${renameIndex + 1}`,
    };
    setStops(updated);
    setRenameIndex(null);
    setRenameValue('');
  };

  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= stops.length || from === to) return;
    const next = [...stops];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setStops(next);
  };

  const checklist = [
    {
      title: 'School pin confirmed',
      done: Boolean(schoolPoint && schoolPoint.lat && schoolPoint.lng),
    },
    {
      title: 'Route start set',
      done: Boolean(routeName.trim() && startPoint && startPoint.lat && startPoint.lng),
    },
    {
      title: 'Pickup points added',
      done: stops.length > 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch lg:items-center justify-center p-0 lg:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 lg:rounded-3xl shadow-2xl w-full max-w-4xl h-full lg:h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <StepIcon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-purple-400">
                Step {step + 1} of {STEPS.length}{editRouteId ? ' · Edit' : ''}
              </div>
              <h2 className="text-base font-bold text-white truncate">{STEPS[step].title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 flex-1`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                      done ? 'bg-emerald-500 text-white' :
                      active ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {done ? <Check size={12} /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium truncate hidden md:inline ${
                      active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 transition-colors ${done ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-slate-400 mb-5 leading-relaxed">{STEPS[step].description}</p>

          <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={13} /> Route setup checklist
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {checklist.map((item) => (
                <div key={item.title} className={`rounded-xl border px-3 py-2 text-xs ${item.done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-800/60 text-slate-400'}`}>
                  <div className="flex items-center gap-1.5">
                    <Check size={12} className={item.done ? 'text-emerald-300' : 'text-slate-500'} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {step === 0 && (
            <MapPicker
              mode="single"
              points={schoolPoint ? [schoolPoint] : []}
              center={schoolPoint}
              onChange={(p) => setSchoolPoint(p[0] ?? null)}
              pinColor="#0ea5e9"
              searchPlaceholder={`Search for ${school?.name ?? 'your school'}…`}
              hint={schoolPoint
                ? "We saved this pin to the school record. Drag it to fine-tune."
                : "No school pin yet — search or click the map to drop one."}
            />
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Route name <span className="text-red-400">*</span>
                </label>
                <input
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g. Morning Route A — Indiranagar"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>

              <MapPicker
                mode="single"
                points={startPoint ? [startPoint] : []}
                center={startPoint ?? schoolPoint}
                onChange={(p) => setStartPoint(p[0] ?? null)}
                referencePin={schoolPoint ? { ...schoolPoint, color: '#0ea5e9', label: 'School' } : null}
                pinColor="#a855f7"
                searchPlaceholder="Search bus depot or starting area…"
                hint="The purple pin is the route's starting point. The blue 'S' pin is the school."
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <MapPicker
                mode="multi"
                points={stops}
                center={stops[0] ?? startPoint ?? schoolPoint}
                onChange={setStops}
                referencePin={schoolPoint ? { ...schoolPoint, color: '#0ea5e9', label: 'School' } : null}
                pinColor="#a855f7"
                searchPlaceholder="Search a pickup point address…"
                hint="Order matters — pin 1 is the first stop, pin 2 the second, and so on. Drag pins to fine-tune."
                showOrderedList
                onSelectPoint={renameStop}
                onMovePoint={moveStop}
                onRemovePoint={(idx) => setStops(stops.filter((_, i) => i !== idx))}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions for the driver — e.g. arrival window, school gate, etc."
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={goBack}
            disabled={submitting || savingSchool}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 hidden sm:flex">
            {step === 2 && (
              <>
                <MapPin size={12} />
                {stops.length} pickup {stops.length === 1 ? 'point' : 'points'} placed
              </>
            )}
          </div>

          <button
            onClick={goNext}
            disabled={!canNextFromStep(step) || submitting || savingSchool}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20"
          >
            {step < 2 ? (savingSchool ? 'Saving…' : 'Continue') : submitting ? (editRouteId ? 'Updating…' : 'Creating route…') : (editRouteId ? 'Update route' : 'Create route')}
            {!submitting && !savingSchool && <Check size={15} />}
          </button>
        </div>

        {renameIndex !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setRenameIndex(null)} />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2 text-white font-semibold">
                <PencilLine size={16} className="text-purple-300" />
                Rename pickup point #{renameIndex + 1}
              </div>
              <div className="px-5 py-4 space-y-3">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Pickup name</label>
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveStopName(); }}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  placeholder="e.g. MG Road Signal"
                  autoFocus
                />
              </div>
              <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setRenameIndex(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStopName}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold"
                >
                  Save name
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
