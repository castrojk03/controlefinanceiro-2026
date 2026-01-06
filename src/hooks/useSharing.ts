import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type AccessRole = 'viewer' | 'editor' | 'admin';

export interface SharedMember {
  id: string;
  member_id: string;
  email: string;
  role: AccessRole;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: AccessRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useSharing() {
  const { user } = useAuth();
  const [sharedMembers, setSharedMembers] = useState<SharedMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSharedMembers = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('shared_members')
      .select('id, member_id, role, created_at')
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error fetching shared members:', error);
      return;
    }

    // Fetch emails from profiles
    const memberIds = data?.map(m => m.member_id) || [];
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', memberIds);

      const membersWithEmail = data?.map(member => ({
        ...member,
        email: profiles?.find(p => p.id === member.member_id)?.email || 'Email não encontrado',
        role: member.role as AccessRole
      })) || [];

      setSharedMembers(membersWithEmail);
    } else {
      setSharedMembers([]);
    }
  }, [user]);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('owner_id', user.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching invitations:', error);
      return;
    }

    setInvitations((data || []).map(inv => ({
      ...inv,
      role: inv.role as AccessRole
    })));
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchSharedMembers(), fetchInvitations()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchSharedMembers, fetchInvitations]);

  const createInvitation = async (email: string, role: AccessRole): Promise<string | null> => {
    if (!user) return null;

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from('invitations').insert({
      owner_id: user.id,
      email: email.toLowerCase(),
      role,
      token,
      expires_at: expiresAt.toISOString()
    });

    if (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Erro ao criar convite',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }

    await fetchInvitations();
    return token;
  };

  const cancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    await fetchInvitations();
    toast({ title: 'Convite cancelado' });
  };

  const removeMember = async (memberId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('shared_members')
      .delete()
      .eq('owner_id', user.id)
      .eq('member_id', memberId);

    if (error) {
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    await fetchSharedMembers();
    toast({ title: 'Membro removido' });
  };

  const updateMemberRole = async (memberId: string, newRole: AccessRole) => {
    if (!user) return;

    const { error } = await supabase
      .from('shared_members')
      .update({ role: newRole })
      .eq('owner_id', user.id)
      .eq('member_id', memberId);

    if (error) {
      toast({
        title: 'Erro ao atualizar permissão',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    await fetchSharedMembers();
    toast({ title: 'Permissão atualizada' });
  };

  return {
    sharedMembers,
    invitations,
    loading,
    createInvitation,
    cancelInvitation,
    removeMember,
    updateMemberRole,
    refetch: () => Promise.all([fetchSharedMembers(), fetchInvitations()])
  };
}
