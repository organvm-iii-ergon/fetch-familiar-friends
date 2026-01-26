import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Hook for managing pet health records
 * @param {string} petId - Optional pet ID to filter records
 * @returns {Object} Health records state and methods
 */
export function useHealthRecords(petId = null) {
  const { user, isAuthenticated } = useAuth();

  const [records, setRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch health records
  const fetchRecords = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('health_records')
        .select(`
          *,
          pet:pets(id, name, species, avatar_url)
        `)
        .order('date', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Group by type for easy access
      const grouped = groupRecordsByType(data || []);
      setRecords(grouped);

    } catch (err) {
      console.error('Error fetching health records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, petId]);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('reminders')
        .select(`
          *,
          pet:pets(id, name, species)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('due_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Add computed fields
      const processed = (data || []).map(reminder => ({
        ...reminder,
        isOverdue: new Date(reminder.due_at) < new Date(),
        isDueToday: isToday(new Date(reminder.due_at)),
        isDueSoon: isDueSoon(new Date(reminder.due_at)),
      }));

      setReminders(processed);

    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  }, [user?.id]);

  // Create health record
  const createRecord = useCallback(async (recordData) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('health_records')
        .insert({
          pet_id: recordData.petId,
          record_type: recordData.type,
          title: recordData.title,
          description: recordData.description,
          date: recordData.date,
          next_due_date: recordData.nextDueDate,
          vet_name: recordData.vetName,
          vet_clinic: recordData.vetClinic,
          cost: recordData.cost,
          documents: recordData.documents || [],
          metadata: recordData.metadata || {},
        })
        .select()
        .single();

      if (createError) throw createError;

      // If there's a next due date, create a reminder
      if (recordData.nextDueDate) {
        await createReminder({
          petId: recordData.petId,
          type: recordData.type,
          title: `${recordData.title} - Due`,
          dueAt: recordData.nextDueDate,
        });
      }

      await fetchRecords();
      return { data, error: null };

    } catch (err) {
      console.error('Error creating health record:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchRecords]);

  // Update health record
  const updateRecord = useCallback(async (recordId, updates) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('health_records')
        .update({
          title: updates.title,
          description: updates.description,
          date: updates.date,
          next_due_date: updates.nextDueDate,
          vet_name: updates.vetName,
          vet_clinic: updates.vetClinic,
          cost: updates.cost,
          documents: updates.documents,
          metadata: updates.metadata,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchRecords();
      return { data, error: null };

    } catch (err) {
      console.error('Error updating health record:', err);
      return { data: null, error: err };
    }
  }, [user?.id, fetchRecords]);

  // Delete health record
  const deleteRecord = useCallback(async (recordId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { error: deleteError } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) throw deleteError;

      await fetchRecords();
      return { error: null };

    } catch (err) {
      console.error('Error deleting health record:', err);
      return { error: err };
    }
  }, [user?.id, fetchRecords]);

  // Create reminder
  const createReminder = useCallback(async (reminderData) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { data, error: createError } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          pet_id: reminderData.petId,
          reminder_type: reminderData.type,
          title: reminderData.title,
          description: reminderData.description,
          due_at: reminderData.dueAt,
          repeat_interval: reminderData.repeatInterval || 'none',
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchReminders();
      return { data, error: null };

    } catch (err) {
      console.error('Error creating reminder:', err);
      return { data: null, error: err };
    }
  }, [user?.id, fetchReminders]);

  // Complete reminder
  const completeReminder = useCallback(async (reminderId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const reminder = reminders.find(r => r.id === reminderId);

      if (reminder?.repeat_interval && reminder.repeat_interval !== 'none') {
        // Create next occurrence
        const nextDueAt = calculateNextDueDate(new Date(reminder.due_at), reminder.repeat_interval);

        await supabase.from('reminders').insert({
          user_id: user.id,
          pet_id: reminder.pet_id,
          reminder_type: reminder.reminder_type,
          title: reminder.title,
          description: reminder.description,
          due_at: nextDueAt.toISOString(),
          repeat_interval: reminder.repeat_interval,
        });
      }

      // Mark current as completed
      const { error: updateError } = await supabase
        .from('reminders')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (updateError) throw updateError;

      await fetchReminders();
      return { error: null };

    } catch (err) {
      console.error('Error completing reminder:', err);
      return { error: err };
    }
  }, [user?.id, reminders, fetchReminders]);

  // Delete reminder
  const deleteReminder = useCallback(async (reminderId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { error: deleteError } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (deleteError) throw deleteError;

      await fetchReminders();
      return { error: null };

    } catch (err) {
      console.error('Error deleting reminder:', err);
      return { error: err };
    }
  }, [user?.id, fetchReminders]);

  // Get records by type
  const getRecordsByType = useCallback((type) => {
    return records[type] || [];
  }, [records]);

  // Get upcoming vaccinations
  const getUpcomingVaccinations = useCallback(() => {
    const vaccinations = records.vaccination || [];
    return vaccinations.filter(v => v.next_due_date && new Date(v.next_due_date) > new Date());
  }, [records]);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
      fetchReminders();
    } else {
      setRecords([]);
      setReminders([]);
    }
  }, [isAuthenticated, fetchRecords, fetchReminders]);

  return {
    // State
    records,
    reminders,
    loading,
    error,

    // Computed
    allRecords: Object.values(records).flat(),
    overdueReminders: reminders.filter(r => r.isOverdue),
    todayReminders: reminders.filter(r => r.isDueToday),
    upcomingReminders: reminders.filter(r => r.isDueSoon && !r.isDueToday),

    // Actions
    fetchRecords,
    fetchReminders,
    createRecord,
    updateRecord,
    deleteRecord,
    createReminder,
    completeReminder,
    deleteReminder,

    // Helpers
    getRecordsByType,
    getUpcomingVaccinations,

    // Clear error
    clearError: () => setError(null),
  };
}

// Helper functions
function groupRecordsByType(records) {
  return records.reduce((acc, record) => {
    const type = record.record_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(record);
    return acc;
  }, {});
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isDueSoon(date) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date <= weekFromNow;
}

function calculateNextDueDate(currentDate, interval) {
  const next = new Date(currentDate);

  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export default useHealthRecords;
