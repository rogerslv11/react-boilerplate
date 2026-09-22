import { useMutation } from '@tanstack/react-query';

import type { LoginFormValues } from '../schemas/auth-schemas';
import { useAuth } from '@/features/auth/context/auth-context';

export function useSignInMutation() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      await signIn(values.email, values.password);
    },
  });
}
