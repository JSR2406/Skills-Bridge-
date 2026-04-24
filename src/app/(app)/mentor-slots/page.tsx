'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllMentorSlots, addMentorSlot, deleteMentorSlot } from '@/features/mentors/api';
import { MentorSlot } from '@/features/mentors/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Plus, Trash2, CalendarClock, Clock, IndianRupee, Loader2, ShieldX, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatDateTime(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Rounded to next 30-minute boundary from now, +1 hour ahead */
function defaultStart() {
  const d = new Date(Date.now() + 3_600_000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0);
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

function addHours(iso: string, h: number) {
  const d = new Date(iso);
  d.setHours(d.getHours() + h);
  return d.toISOString().slice(0, 16);
}

export default function MentorSlotsPage() {
  const { profile, user } = useAuth();
  const router = useRouter();

  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [startIso, setStartIso] = useState(defaultStart);
  const [endIso, setEndIso] = useState(() => addHours(defaultStart(), 1));
  const [fee, setFee] = useState(profile?.role === 'mentor' ? '300' : '200');

  // Access control
  useEffect(() => {
    if (profile && profile.role !== 'mentor') {
      router.replace('/mentors');
    }
  }, [profile, router]);

  const loadSlots = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getAllMentorSlots(user.uid);
      setSlots(data);
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }
    if (start <= new Date()) {
      toast.error('Start time must be in the future');
      return;
    }
    try {
      setIsAdding(true);
      await addMentorSlot(user.uid, start, end, parseInt(fee) || 0);
      toast.success('Slot added!');
      setShowForm(false);
      setStartIso(defaultStart());
      setEndIso(addHours(defaultStart(), 1));
      await loadSlots();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add slot');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (slot: MentorSlot) => {
    if (slot.isBooked) {
      toast.error('Cannot delete a booked slot');
      return;
    }
    try {
      setDeletingId(slot.id);
      await deleteMentorSlot(slot.id);
      toast.success('Slot removed');
      setSlots(prev => prev.filter(s => s.id !== slot.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete slot');
    } finally {
      setDeletingId(null);
    }
  };

  if (!profile || profile.role !== 'mentor') return <LoadingSkeleton />;
  if (isLoading) return <div className="max-w-3xl mx-auto mt-10"><LoadingSkeleton /></div>;

  const upcoming = slots.filter(s => !s.isBooked && new Date(s.startTime as Date) > new Date());
  const booked = slots.filter(s => s.isBooked);
  const past = slots.filter(s => !s.isBooked && new Date(s.startTime as Date) <= new Date());

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[rgba(79,219,200,0.1)]">
        <div>
          <div className="flex items-center gap-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest mb-2">
            <CalendarClock className="w-4 h-4" />
            Mentor Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Manage Availability
          </h1>
          <p className="text-[#8899b8] text-sm mt-1">
            Add time slots when you're available for 1-on-1 sessions. Students can book them directly.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0b1326] transition-all hover:-translate-y-0.5 shadow-[0_0_20px_rgba(79,219,200,0.2)] shrink-0"
          style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {/* Add Slot Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-6 space-y-5 animate-fade-in"
          style={{ background: 'rgba(79,219,200,0.04)', border: '1px solid rgba(79,219,200,0.2)' }}
        >
          <h2 className="font-bold text-[#dae2fd] text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#4fdbc8]" /> New Availability Slot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8899b8] uppercase tracking-widest">Start Time</label>
              <input
                type="datetime-local"
                value={startIso}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => {
                  setStartIso(e.target.value);
                  setEndIso(addHours(e.target.value, 1));
                }}
                required
                className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(79,219,200,0.2)', color: '#dae2fd' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8899b8] uppercase tracking-widest">End Time</label>
              <input
                type="datetime-local"
                value={endIso}
                min={startIso}
                onChange={e => setEndIso(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(79,219,200,0.2)', color: '#dae2fd' }}
              />
            </div>
          </div>
          <div className="space-y-1.5 max-w-xs">
            <label className="text-[11px] font-bold text-[#8899b8] uppercase tracking-widest flex items-center gap-1.5">
              <IndianRupee className="w-3 h-3" /> Session Fee (INR)
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              step="50"
              value={fee}
              onChange={e => setFee(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(79,219,200,0.2)', color: '#dae2fd' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-bold text-[#8899b8] hover:text-[#dae2fd] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-[#0b1326] shadow-lg disabled:opacity-50 transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isAdding ? 'Adding...' : 'Add Slot'}
            </button>
          </div>
        </form>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: upcoming.length, color: '#4fdbc8' },
          { label: 'Booked', count: booked.length, color: '#ddb7ff' },
          { label: 'Expired', count: past.length, color: '#8899b8' },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(19,27,46,0.5)', border: `1px solid ${color}22` }}>
            <p className="text-2xl font-black" style={{ color }}>{count}</p>
            <p className="text-[11px] text-[#8899b8] uppercase tracking-widest font-bold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Slot List */}
      {slots.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[rgba(79,219,200,0.15)]">
          <CalendarClock className="w-10 h-10 text-[#4fdbc8]/30 mx-auto mb-3" />
          <h3 className="font-bold text-[#dae2fd]">No slots yet</h3>
          <p className="text-sm text-[#8899b8] mt-1">Add your first availability slot above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map(slot => {
            const start = new Date(slot.startTime as Date);
            const end = new Date(slot.endTime as Date);
            const isExpired = !slot.isBooked && start <= new Date();
            return (
              <div
                key={slot.id}
                className={cn(
                  'flex items-center justify-between gap-4 p-4 rounded-xl transition-all',
                  slot.isBooked
                    ? 'opacity-90'
                    : isExpired
                    ? 'opacity-50'
                    : 'hover:border-[rgba(79,219,200,0.3)]',
                )}
                style={{
                  background: 'rgba(19,27,46,0.5)',
                  border: slot.isBooked
                    ? '1px solid rgba(221,183,255,0.2)'
                    : isExpired
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(79,219,200,0.12)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {slot.isBooked ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#ddb7ff] bg-[rgba(221,183,255,0.08)] border border-[rgba(221,183,255,0.2)]">
                        Booked
                      </span>
                    ) : isExpired ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#8899b8] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#4fdbc8] bg-[rgba(79,219,200,0.06)] border border-[rgba(79,219,200,0.15)]">
                        Available
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-[#8899b8] font-bold">
                      <IndianRupee className="w-3 h-3" />{slot.fee}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4fdbc8] shrink-0" />
                    {formatDateTime(start)}
                  </p>
                  <p className="text-[11px] text-[#8899b8] mt-0.5 ml-5">
                    ends {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {Math.round((end.getTime() - start.getTime()) / 60000)} min
                  </p>
                </div>

                {!slot.isBooked && !isExpired && (
                  <button
                    onClick={() => handleDelete(slot)}
                    disabled={deletingId === slot.id}
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[#8899b8] hover:text-red-400 hover:bg-red-500/10 transition-all border border-[rgba(255,255,255,0.07)] disabled:opacity-40"
                    title="Remove slot"
                  >
                    {deletingId === slot.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                )}
                {slot.isBooked && (
                  <CheckCircle2 className="w-5 h-5 text-[#ddb7ff] shrink-0" />
                )}
                {isExpired && !slot.isBooked && (
                  <AlertTriangle className="w-4 h-4 text-[#8899b8]/50 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
