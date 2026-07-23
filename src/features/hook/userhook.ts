import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../../lib/user';
import { getUserDetails, getUsers } from '../admin-dashboard/api';

interface UseUserProfileProps {
  token?: string;
}

export function useUserProfile({ token }: UseUserProfileProps) {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(token!),
    enabled: !!token,
  });
}


