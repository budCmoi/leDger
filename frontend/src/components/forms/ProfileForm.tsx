import type { ChangeEvent } from 'react';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Upload } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../common/Button';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

const currencies = ['USD', 'EUR', 'GBP', 'AED'];

const profileFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  companyName: z.string().min(2),
  currency: z.string().min(3).max(5),
  avatar: z.string().url().optional().or(z.literal('')),
});

export type ProfileFormPayload = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  busy?: boolean;
  onSubmit: (payload: ProfileFormPayload) => Promise<void> | void;
  onUploadAvatar: (file: File) => Promise<void> | void;
  user: User;
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/60';

export const ProfileForm = ({ busy, onSubmit, onUploadAvatar, user }: ProfileFormProps) => {
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      currency: user.currency,
      avatar: user.avatar ?? '',
    },
  });

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await onUploadAvatar(file);
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Full name" {...form.register('name')} />
        <input className={inputClassName} placeholder="Email" {...form.register('email')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Company name" {...form.register('companyName')} />
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange}>
              <div className="relative">
                <ListboxButton className={cn(inputClassName, 'flex items-center justify-between uppercase tracking-[0.18em]')}>
                  {field.value}
                  <ChevronDown size={16} />
                </ListboxButton>
                <ListboxOptions anchor="bottom start" className="premium-panel z-20 mt-2 w-[var(--button-width)] p-2 outline-none">
                  {currencies.map((currency) => (
                    <ListboxOption key={currency} className="cursor-pointer rounded-xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-white/70 data-[focus]:bg-white/[0.06] data-[focus]:text-white" value={currency}>
                      {currency}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          )}
        />
      </div>

      <input className={inputClassName} placeholder="Avatar URL" {...form.register('avatar')} />

      <label className="flex cursor-pointer items-center justify-between rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-white/65 transition hover:border-accent/50 hover:text-white">
        <span className="flex items-center gap-3 uppercase tracking-[0.18em]">
          <Upload size={16} />
          Upload avatar image
        </span>
        <input className="hidden" onChange={handleAvatarChange} type="file" />
      </label>

      <Button disabled={busy} fullWidth type="submit">
        Save profile
      </Button>
    </form>
  );
};