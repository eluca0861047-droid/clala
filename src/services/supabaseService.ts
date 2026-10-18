import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Student, Booking, AbsenceRecord, SlotLock, ActivityLog } from '../types';

// DB Snake_case types
interface DbStudent {
  id: string;
  name: string;
  grade: string;
  phone: string;
  makeup_tickets: number;
  regular_slots: any;
  avatar_bg?: string;
  access_code?: string;
}

interface DbBooking {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  student_id: string;
  student_name: string;
  counseling_type?: string;
  memo?: string;
  created_at: string;
}

interface DbAbsence {
  id: string;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  reason?: string;
  created_at: string;
}

interface DbSlotLock {
  id: string;
  date?: string;
  time: string;
  is_recurring_daily: boolean;
  reason: string;
  created_at: string;
}

interface DbActivityLog {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  student_name?: string;
  created_at: string;
}

// Converters
export function toStudent(row: DbStudent): Student {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    phone: row.phone,
    makeupTickets: row.makeup_tickets,
    regularSlots: Array.isArray(row.regular_slots) ? row.regular_slots : [],
    avatarBg: row.avatar_bg,
    accessCode: row.access_code,
  };
}

export function toDbStudent(st: Student): DbStudent {
  return {
    id: st.id,
    name: st.name,
    grade: st.grade,
    phone: st.phone,
    makeup_tickets: st.makeupTickets,
    regular_slots: st.regularSlots,
    avatar_bg: st.avatarBg,
    access_code: st.accessCode,
  };
}

export function toBooking(row: DbBooking): Booking {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    duration: (row.duration as 30 | 60) || 30,
    type: row.type as any,
    studentId: row.student_id,
    studentName: row.student_name,
    counselingType: row.counseling_type as any,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

export function toDbBooking(b: Booking): DbBooking {
  return {
    id: b.id,
    date: b.date,
    time: b.time,
    duration: b.duration,
    type: b.type,
    student_id: b.studentId,
    student_name: b.studentName,
    counseling_type: b.counselingType,
    memo: b.memo,
    created_at: b.createdAt || new Date().toISOString(),
  };
}

export function toAbsence(row: DbAbsence): AbsenceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    date: row.date,
    time: row.time,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function toDbAbsence(a: AbsenceRecord): DbAbsence {
  return {
    id: a.id,
    student_id: a.studentId,
    student_name: a.studentName,
    date: a.date,
    time: a.time,
    reason: a.reason,
    created_at: a.createdAt || new Date().toISOString(),
  };
}

export function toSlotLock(row: DbSlotLock): SlotLock {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    isRecurringDaily: row.is_recurring_daily,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function toDbSlotLock(l: SlotLock): DbSlotLock {
  return {
    id: l.id,
    date: l.date,
    time: l.time,
    is_recurring_daily: Boolean(l.isRecurringDaily),
    reason: l.reason,
    created_at: l.createdAt || new Date().toISOString(),
  };
}

export function toActivityLog(row: DbActivityLog): ActivityLog {
  return {
    id: row.id,
    type: row.type as any,
    message: row.message,
    timestamp: row.timestamp,
    studentName: row.student_name,
    createdAt: row.created_at,
  };
}

export function toDbActivityLog(l: ActivityLog): DbActivityLog {
  return {
    id: l.id,
    type: l.type,
    message: l.message,
    timestamp: l.timestamp,
    student_name: l.studentName,
    created_at: l.createdAt || new Date().toISOString(),
  };
}

/**
 * Fetch all base data from Supabase
 */
export async function fetchAllDataFromSupabase(): Promise<{
  students: Student[];
  bookings: Booking[];
  absences: AbsenceRecord[];
  locks: SlotLock[];
  logs: ActivityLog[];
} | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const [stRes, bkRes, abRes, lkRes, lgRes] = await Promise.all([
      supabase.from('students').select('*').order('name'),
      supabase.from('bookings').select('*').order('date').order('time'),
      supabase.from('absences').select('*').order('date').order('time'),
      supabase.from('slot_locks').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    if (stRes.error) throw stRes.error;

    return {
      students: (stRes.data as DbStudent[] || []).map(toStudent),
      bookings: (bkRes.data as DbBooking[] || []).map(toBooking),
      absences: (abRes.data as DbAbsence[] || []).map(toAbsence),
      locks: (lkRes.data as DbSlotLock[] || []).map(toSlotLock),
      logs: (lgRes.data as DbActivityLog[] || []).map(toActivityLog),
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch data, falling back to local:', err);
    return null;
  }
}

/**
 * Seed initial sample data to Supabase if tables are completely empty
 */
export async function seedInitialDataToSupabase(seed: {
  students: Student[];
  bookings: Booking[];
  absences: AbsenceRecord[];
  locks: SlotLock[];
  logs: ActivityLog[];
}) {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if (count !== null && count > 0) {
      // Already has data
      return;
    }

    console.log('[Supabase] Initializing empty database with seed data...');
    await supabase.from('students').insert(seed.students.map(toDbStudent));
    await supabase.from('slot_locks').insert(seed.locks.map(toDbSlotLock));
    await supabase.from('bookings').insert(seed.bookings.map(toDbBooking));
    await supabase.from('absences').insert(seed.absences.map(toDbAbsence));
    await supabase.from('activity_logs').insert(seed.logs.map(toDbActivityLog));
    console.log('[Supabase] Seed data inserted successfully!');
  } catch (err) {
    console.error('[Supabase] Failed to seed initial data:', err);
  }
}

// Single Entity Mutations
export async function dbUpsertStudent(st: Student) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('students').upsert(toDbStudent(st));
}

export async function dbDeleteStudent(id: string) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('students').delete().eq('id', id);
}

export async function dbUpsertBooking(b: Booking) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('bookings').upsert(toDbBooking(b));
}

export async function dbDeleteBooking(id: string) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('bookings').delete().eq('id', id);
}

export async function dbUpsertAbsence(a: AbsenceRecord) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('absences').upsert(toDbAbsence(a));
}

export async function dbDeleteAbsence(id: string) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('absences').delete().eq('id', id);
}

export async function dbUpsertSlotLock(l: SlotLock) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('slot_locks').upsert(toDbSlotLock(l));
}

export async function dbDeleteSlotLock(id: string) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('slot_locks').delete().eq('id', id);
}

export async function dbInsertLog(l: ActivityLog) {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('activity_logs').insert(toDbActivityLog(l));
}

export async function dbPurgeOldLogs(cutoffIsoDate?: string) {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const cutoff = cutoffIsoDate || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('activity_logs').delete().lt('created_at', cutoff);
  } catch (err) {
    console.warn('[Supabase] Failed to purge old activity_logs:', err);
  }
}

export async function dbResetAllData(seed: {
  students: Student[];
  bookings: Booking[];
  absences: AbsenceRecord[];
  locks: SlotLock[];
  logs: ActivityLog[];
}) {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    // Truncate / delete all rows
    await Promise.all([
      supabase.from('activity_logs').delete().neq('id', '___none___'),
      supabase.from('bookings').delete().neq('id', '___none___'),
      supabase.from('absences').delete().neq('id', '___none___'),
      supabase.from('slot_locks').delete().neq('id', '___none___'),
    ]);
    await supabase.from('students').delete().neq('id', '___none___');

    // Re-insert seed
    await supabase.from('students').insert(seed.students.map(toDbStudent));
    await supabase.from('slot_locks').insert(seed.locks.map(toDbSlotLock));
    await supabase.from('bookings').insert(seed.bookings.map(toDbBooking));
    await supabase.from('absences').insert(seed.absences.map(toDbAbsence));
    await supabase.from('activity_logs').insert(seed.logs.map(toDbActivityLog));
  } catch (err) {
    console.error('[Supabase] Failed to reset database:', err);
  }
}
