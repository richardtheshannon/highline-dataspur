// src/app/api/projects/[id]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { Contact } from "@prisma/client";

// Define types for the nested objects to help TypeScript
type MemberWithUser = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type ProjectContactWithContact = {
  contact: Contact;
};


/**
 * GET handler to fetch a single project by its ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true, files: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // The permission check that restricted access to owners or members has been removed.
    // Any authenticated user can now view any project's details.

    const projectWithCleanedData = {
      ...project,
      members: project.members.map((member: MemberWithUser) => member.user),
      contacts: project.contacts.map((projectContact: ProjectContactWithContact) => projectContact.contact),
    };

    return NextResponse.json(projectWithCleanedData);
  } catch (error) {
    console.error("Single project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a project's details.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    // For security, we'll keep the check that only the project owner can edit.
    if (!project || project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden or Project not found" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, projectGoal, status, priority, startDate, endDate } = body;

    // Basic validation
    if (!name) {
        return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        name,
        description,
        projectGoal,
        status,
        priority,
        // Handle date conversion, ensuring null is passed if date is empty
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a project.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
        });

        // For security, we'll keep the check that only the project owner can delete.
        if (!project || project.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden or Project not found" }, { status: 403 });
        }

        await prisma.project.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Project deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Project delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
