import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/app';
import { usePasswordRecoveryMutation } from '../hooks/use-password-recovery';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth-schemas';

export function ForgotPasswordForm() {
  const mutation = usePasswordRecoveryMutation();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Check your inbox.</p>
        <p className="text-muted-foreground">
          If an account exists for {form.getValues('email')}, we have sent a recovery link.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send recovery link
        </Button>

        <Button asChild variant="link" className="w-full">
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </form>
    </Form>
  );
}
