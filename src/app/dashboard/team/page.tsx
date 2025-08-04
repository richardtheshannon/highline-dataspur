// src/app/dashboard/teams/page.tsx

import { prisma } from "@/lib/prisma";
import UserTable from "./UserTable"; 
import AddUserForm from "./AddUserForm"; // Import the new form component

// This line forces the page to be rendered dynamically on each request
export const dynamic = 'force-dynamic';

// This function fetches all users from the database, now including role and active status
async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,      // Added role
      isActive: true,  // Added isActive status
      createdAt: true,
      avatar: true,    // We will need the avatar field for the new UI
    },
    orderBy: {
      createdAt: 'desc', // Show newest users first
    }
  });
  return users;
}

// This is the main page component (Server Component)
export default async function TeamPage() {
  const users = await getUsers();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Members</h2>
        <p className="text-gray-600 dark:text-gray-400">
          A list of all the users in your application. Admins can enable or disable user accounts.
        </p>
      </div>

      {/* Render the UserTable client component, passing the full user data as a prop */}
      <UserTable users={users} />
      
      {/* Render the new AddUserForm component below the table */}
      <AddUserForm />
    </div>
  );
}
