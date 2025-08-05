"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from '@/components/ui/card';
import { UserActions } from './UserActions';

// Define the User type to match the data passed from the server component
type User = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    avatar?: string | null;
};

export default function UserTable({ users: initialUsers }: { users: User[] }) {
    const [users, setUsers] = useState(initialUsers);
    const { data: session } = useSession();

    // This function is called when an admin toggles the switch
    const handleToggleActive = async (userId: string, newStatus: boolean) => {
        // Optimistic update
        const originalUsers = users;
        setUsers(currentUsers =>
            currentUsers.map(user =>
                user.id === userId ? { ...user, isActive: newStatus } : user
            )
        );

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Revert the UI change if the API call fails
                setUsers(originalUsers);
                console.error('Failed to update user status:', errorData.message);
            }
        } catch (error) {
            // Revert on error as well
            setUsers(originalUsers);
            console.error("An unexpected error occurred:", error);
        }
    };

    const handleUserUpdate = () => {
        // We'll refetch the data to ensure the UI is in sync with the database.
        // This is a simple but effective way to handle updates without complex state management.
        window.location.reload();
    };

    const handleUserDelete = (deletedUserId: string) => {
        // Filter out the deleted user from the state
        setUsers(currentUsers => currentUsers.filter(user => user.id !== deletedUserId));
        // A full page reload is not strictly necessary here, but we can do it for consistency
    };

    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                {isAdmin && <TableHead className="text-right">Enable/Disable</TableHead>}
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            {/* Prevent an admin from disabling their own account */}
                                            <Switch
                                                checked={user.isActive}
                                                onCheckedChange={(newStatus) => handleToggleActive(user.id, newStatus)}
                                                disabled={user.id === session?.user?.id}
                                            />
                                        </TableCell>
                                    )}
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            <UserActions
                                                user={user}
                                                onUserUpdated={handleUserUpdate}
                                                onUserDeleted={() => handleUserDelete(user.id)}
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
