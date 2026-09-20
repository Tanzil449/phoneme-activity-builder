
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getValidId(id: string) {
  const number = Number(id);

  if (!Number.isSafeInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

const includeWords = {
  words: {
    include: {
      word: true,
    },
  },
  activities: true,
};

// GET: Retrieve a saved word list by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordListId = getValidId(id);

    if (wordListId === null) {
      return NextResponse.json(
        { error: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const wordList = await prisma.wordList.findUnique({
      where: { id: wordListId },
      include: includeWords,
    });

    if (!wordList) {
      return NextResponse.json(
        { error: "Word list not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(wordList, { status: 200 });
  } catch (error) {
    console.error("Error retrieving word list:", error);

    return NextResponse.json(
      { error: "Unable to retrieve word list." },
      { status: 500 }
    );
  }
}

// PUT: Update a saved word list
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordListId = getValidId(id);

    if (wordListId === null) {
      return NextResponse.json(
        { error: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "A valid JSON object is required." },
        { status: 400 }
      );
    }

    const { name, description, wordIds } = body;

    if (
      name === undefined &&
      description === undefined &&
      wordIds === undefined
    ) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 }
      );
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return NextResponse.json(
        { error: "A valid word list name is required." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      (
        typeof description !== "string" ||
        description.length > 500
      )
    ) {
      return NextResponse.json(
        { error: "Description must contain up to 500 characters." },
        { status: 400 }
      );
    }

    if (
      wordIds !== undefined &&
      (
        !Array.isArray(wordIds) ||
        !wordIds.every(
          (wordId: unknown) =>
            typeof wordId === "number" &&
            Number.isSafeInteger(wordId) &&
            wordId > 0
        )
      )
    ) {
      return NextResponse.json(
        { error: "wordIds must contain valid word IDs." },
        { status: 400 }
      );
    }

    const existingList = await prisma.wordList.findUnique({
      where: { id: wordListId },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: "Word list not found." },
        { status: 404 }
      );
    }

    const uniqueWordIds: number[] =
      wordIds === undefined
        ? []
        : [...new Set<number>(wordIds)];

    if (wordIds !== undefined) {
      const existingWords = await prisma.word.findMany({
        where: {
          id: { in: uniqueWordIds },
        },
      });

      if (existingWords.length !== uniqueWordIds.length) {
        return NextResponse.json(
          { error: "One or more selected words do not exist." },
          { status: 400 }
        );
      }
    }

    const updatedList = await prisma.wordList.update({
      where: { id: wordListId },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),
        ...(description !== undefined && {
          description:
            description === null
              ? null
              : description.trim() || null,
        }),
        ...(wordIds !== undefined && {
          words: {
            deleteMany: {},
            create: uniqueWordIds.map((wordId) => ({
              word: {
                connect: { id: wordId },
              },
            })),
          },
        }),
      },
      include: includeWords,
    });

    return NextResponse.json(updatedList, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error updating word list:", error);

    return NextResponse.json(
      { error: "Unable to update word list." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a saved word list
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordListId = getValidId(id);

    if (wordListId === null) {
      return NextResponse.json(
        { error: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const existingList = await prisma.wordList.findUnique({
      where: { id: wordListId },
      include: {
        activities: {
          select: { id: true },
        },
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: "Word list not found." },
        { status: 404 }
      );
    }

    if (existingList.activities.length > 0) {
      return NextResponse.json(
        {
          error:
            "This word list is used by saved activities. Delete those activities before deleting the word list.",
        },
        { status: 409 }
      );
    }

    await prisma.wordList.delete({
      where: { id: wordListId },
    });

    return NextResponse.json(
      { message: "Word list deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting word list:", error);

    return NextResponse.json(
      { error: "Unable to delete word list." },
      { status: 500 }
    );
  }
}