
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

// GET: Retrieve all saved word lists
export async function GET() {
  try {
    const wordLists = await prisma.wordList.findMany({
      include: {
        words: {
          include: {
            word: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(wordLists, { status: 200 });
  } catch (error) {
    console.error("Error retrieving word lists:", error);

    return NextResponse.json(
      { error: "Unable to retrieve word lists." },
      { status: 500 }
    );
  }
}

// POST: Create a new word list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, wordIds = [] } = body;

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "A valid word list name is required." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      (typeof description !== "string" ||
        description.length > 500)
    ) {
      return NextResponse.json(
        { error: "Description must be a string of up to 500 characters." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(wordIds) ||
      !wordIds.every(
        (id: unknown) =>
          typeof id === "number" &&
          Number.isSafeInteger(id) &&
          id > 0
      )
    ) {
      return NextResponse.json(
        { error: "wordIds must contain valid word IDs." },
        { status: 400 }
      );
    }

    const uniqueWordIds: number[] = [...new Set<number>(wordIds)];

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

    const wordList = await prisma.wordList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        words: {
          create: uniqueWordIds.map((wordId) => ({
            word: {
              connect: { id: wordId },
            },
          })),
        },
      },
      include: {
        words: {
          include: {
            word: true,
          },
        },
      },
    });

    return NextResponse.json(wordList, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error creating word list:", error);

    return NextResponse.json(
      { error: "Unable to create word list." },
      { status: 500 }
    );
  }
}