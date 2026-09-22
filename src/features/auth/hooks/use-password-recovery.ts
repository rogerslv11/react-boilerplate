import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/context/auth-context';
import type { ForgotPasswordFormValues } from '../schemas/auth-schemas';

export function usePasswordRecoveryMutation() {
  const { recoverPassword } = useAuth();

  return useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      await recoverPassword(values.email);
    },
  });
}
