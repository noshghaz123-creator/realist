import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { refreshNotificationBadge } from '../utils/notifications';

function toIdSet(list = []) {
  return new Set(list.map((id) => String(id)));
}

function leadKey(lead) {
  return String(lead?._id || lead?.id || lead?.radarId || '');
}

export function usePropertyLeadActions() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const [favOverride, setFavOverride] = useState(null);
  const [myOverride, setMyOverride] = useState(null);

  useEffect(() => {
    setFavOverride(null);
    setMyOverride(null);
  }, [user?.favouritePropertyLeads, user?.myPropertyLeads]);

  const favouriteIds = useMemo(
    () => favOverride ?? toIdSet(user?.favouritePropertyLeads),
    [favOverride, user?.favouritePropertyLeads]
  );

  const myLeadIds = useMemo(
    () => myOverride ?? toIdSet(user?.myPropertyLeads),
    [myOverride, user?.myPropertyLeads]
  );

  const toggleFavourite = useCallback(
    async (lead) => {
      const idStr = leadKey(lead);
      if (!idStr) {
        toast.error('This lead cannot be saved — missing ID.');
        return null;
      }
      const wasFav = favouriteIds.has(idStr);
      const next = new Set(favouriteIds);
      if (wasFav) next.delete(idStr);
      else next.add(idStr);
      setFavOverride(next);

      try {
        const data = await api.togglePropertyFavourite(lead);
        patchUser({ favouritePropertyLeads: data.favouritePropertyLeads });
        setFavOverride(null);
        if (data.added) toast.success('Lead added to Favourites successfully!');
        else toast.info('Removed from Favourites');
        refreshNotificationBadge();
        return data;
      } catch (err) {
        setFavOverride(null);
        toast.error(err.message || 'Could not update Favourites');
        throw err;
      }
    },
    [favouriteIds, patchUser, toast]
  );

  const toggleMyLead = useCallback(
    async (lead) => {
      const idStr = leadKey(lead);
      if (!idStr) {
        toast.error('This lead cannot be saved — missing ID.');
        return null;
      }
      const wasSaved = myLeadIds.has(idStr);
      const next = new Set(myLeadIds);
      if (wasSaved) next.delete(idStr);
      else next.add(idStr);
      setMyOverride(next);

      try {
        const data = await api.togglePropertyMyLead(lead);
        patchUser({ myPropertyLeads: data.myPropertyLeads });
        setMyOverride(null);
        if (data.added) toast.success('Lead added to My Leads successfully!');
        else toast.info('Removed from My Leads');
        refreshNotificationBadge();
        return data;
      } catch (err) {
        setMyOverride(null);
        toast.error(err.message || 'Could not update My Leads');
        throw err;
      }
    },
    [myLeadIds, patchUser, toast]
  );

  const addAllMyLeads = useCallback(
    async (leads) => {
      const list = Array.isArray(leads) ? leads.filter((l) => leadKey(l)) : [];
      if (!list.length) return null;

      const next = new Set(myLeadIds);
      list.forEach((lead) => next.add(leadKey(lead)));
      setMyOverride(next);

      try {
        const data = await api.addAllPropertyMyLeads(list);
        patchUser({ myPropertyLeads: data.myPropertyLeads });
        setMyOverride(null);
        if (data.addedCount > 0) toast.success(data.message);
        else toast.info(data.message);
        refreshNotificationBadge();
        return data;
      } catch (err) {
        setMyOverride(null);
        toast.error(err.message || 'Could not add leads to My Leads');
        throw err;
      }
    },
    [myLeadIds, patchUser, toast]
  );

  return { favouriteIds, myLeadIds, toggleFavourite, toggleMyLead, addAllMyLeads };
}
