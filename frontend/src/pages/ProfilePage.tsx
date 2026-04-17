import { startTransition, useState } from 'react';

import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { ProfileForm, type ProfileFormPayload } from '../components/forms/ProfileForm';
import { profileApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function ProfilePage() {
  const [busy, setBusy] = useState(false);
  const user = useAppStore((state) => state.user);
  const csrfToken = useAppStore((state) => state.csrfToken);
  const setAuthSession = useAppStore((state) => state.setAuthSession);

  if (!user) {
    return null;
  }

  const handleSubmit = async (payload: ProfileFormPayload) => {
    setBusy(true);
    try {
      const updatedUser = await profileApi.update(payload);
      startTransition(() => {
        setAuthSession({ user: updatedUser, csrfToken });
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    setBusy(true);
    try {
      const updatedUser = await profileApi.uploadAvatar(file);
      startTransition(() => {
        setAuthSession({ user: updatedUser, csrfToken });
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Manage your identity, workspace details, currency and brand image from a secure account settings surface."
          eyebrow="Profile"
          title="Account settings"
        />

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="space-y-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent text-4xl uppercase tracking-[0.2em] text-paper">
              {user.name.slice(0, 1)}
            </div>
            <div className="space-y-3">
              <p className="text-2xl uppercase tracking-[0.18em] text-white">{user.name}</p>
              <p className="text-sm text-white/55">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge>{user.role}</Badge>
                <Badge>{user.currency}</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <ProfileForm busy={busy} onSubmit={handleSubmit} onUploadAvatar={handleUploadAvatar} user={user} />
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}