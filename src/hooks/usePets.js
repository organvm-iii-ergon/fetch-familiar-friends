import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Hook for managing user's pets
 * @returns {Object} Pets state and methods
 */
export function usePets() {
  const { user, isAuthenticated } = useAuth();

  const [pets, setPets] = useState([]);
  const [primaryPet, setPrimaryPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all pets for current user
  const fetchPets = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage as fallback
      const localPets = localStorage.getItem('dogtale-pets');
      if (localPets) {
        const parsed = JSON.parse(localPets);
        setPets(parsed);
        setPrimaryPet(parsed.find(p => p.is_primary) || parsed[0] || null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pets')
        .select(`
          *,
          photos:pet_photos(*)
        `)
        .eq('owner_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setPets(data || []);
      setPrimaryPet(data?.find(p => p.is_primary) || data?.[0] || null);

      // Cache locally for offline support
      localStorage.setItem('dogtale-pets', JSON.stringify(data || []));

    } catch (err) {
      console.error('Error fetching pets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new pet
  const createPet = useCallback(async (petData) => {
    if (!isOnlineMode || !user?.id) {
      setError('Must be signed in to add pets');
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      // If this is the first pet, make it primary
      const shouldBePrimary = pets.length === 0 || petData.is_primary;

      // If making this primary, unset other primary pets first
      if (shouldBePrimary && pets.some(p => p.is_primary)) {
        await supabase
          .from('pets')
          .update({ is_primary: false })
          .eq('owner_id', user.id);
      }

      const { data, error: createError } = await supabase
        .from('pets')
        .insert({
          owner_id: user.id,
          name: petData.name,
          species: petData.species || 'dog',
          breed: petData.breed,
          birth_date: petData.birthDate,
          adoption_date: petData.adoptionDate,
          weight_kg: petData.weight,
          gender: petData.gender,
          bio: petData.bio,
          is_primary: shouldBePrimary,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchPets();
      return { data, error: null };

    } catch (err) {
      console.error('Error creating pet:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, pets, fetchPets]);

  // Update a pet
  const updatePet = useCallback(async (petId, updates) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      // If making this primary, unset other primary pets first
      if (updates.is_primary) {
        await supabase
          .from('pets')
          .update({ is_primary: false })
          .eq('owner_id', user.id)
          .neq('id', petId);
      }

      const { data, error: updateError } = await supabase
        .from('pets')
        .update({
          name: updates.name,
          breed: updates.breed,
          birth_date: updates.birthDate,
          weight_kg: updates.weight,
          gender: updates.gender,
          bio: updates.bio,
          is_primary: updates.is_primary,
          avatar_url: updates.avatarUrl,
        })
        .eq('id', petId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchPets();
      return { data, error: null };

    } catch (err) {
      console.error('Error updating pet:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPets]);

  // Delete a pet
  const deletePet = useCallback(async (petId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
        .eq('owner_id', user.id);

      if (deleteError) throw deleteError;

      await fetchPets();
      return { error: null };

    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPets]);

  // Set as primary pet
  const setPrimary = useCallback(async (petId) => {
    return updatePet(petId, { is_primary: true });
  }, [updatePet]);

  // Mark pet as deceased (memorial)
  const markDeceased = useCallback(async (petId, memorialMessage, deceasedAt) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { error: updateError } = await supabase
        .from('pets')
        .update({
          is_deceased: true,
          deceased_at: deceasedAt || new Date().toISOString().split('T')[0],
          memorial_message: memorialMessage,
        })
        .eq('id', petId)
        .eq('owner_id', user.id);

      if (updateError) throw updateError;

      await fetchPets();
      return { error: null };

    } catch (err) {
      console.error('Error marking pet deceased:', err);
      return { error: err };
    }
  }, [user?.id, fetchPets]);

  // Fetch pets on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchPets();
    } else {
      setPets([]);
      setPrimaryPet(null);
    }
  }, [isAuthenticated, fetchPets]);

  return {
    // State
    pets,
    primaryPet,
    loading,
    error,

    // Computed
    petCount: pets.length,
    livingPets: pets.filter(p => !p.is_deceased),
    deceasedPets: pets.filter(p => p.is_deceased),
    hasPets: pets.length > 0,

    // Actions
    fetchPets,
    createPet,
    updatePet,
    deletePet,
    setPrimary,
    markDeceased,

    // Clear error
    clearError: () => setError(null),
  };
}

export default usePets;
