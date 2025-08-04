// src/app/dashboard/team/EditUserModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define the User type
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) {
  // State for the "Edit Profile" form
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  
  // State for the "Reset Password" form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when the user prop changes (i.e., when a different user is selected)
  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }, [user]);

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      setSuccess('User details updated successfully!');
      onUserUpdated(); // This will trigger a refresh on the parent page
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to update details.');
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT', // Using PUT for password reset as defined in the API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setSuccess('Password has been reset successfully!');
      setPassword('');
      setConfirmPassword('');
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to reset password.');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to {user.name}'s profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="password">Reset Password</TabsTrigger>
          </TabsList>
          
          {/* Edit Details Tab */}
          <TabsContent value="details">
            <form onSubmit={handleDetailsUpdate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </TabsContent>

          {/* Reset Password Tab */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordReset} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </DialogContent>
    </Dialog>
  );
}
