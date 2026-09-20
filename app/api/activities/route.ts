
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

// GET: Retrieve all saved activities
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        wordList: {
          include: {
            words: {
              include: {
                word: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    console.error("Error retrieving activities:", error);

    return NextResponse.json(
      { error: "Unable to retrieve activities." },
      { status: 500 }
    );
  }
}

// POST: Create a new Wordle or Word Search activity
export async function POST(request: NextRequest) {
  try {
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

    const {
      name,
      type,
      difficulty = "Easy",
      showHints = false,
      maxGuesses = 6,
      gridRows = 10,
      gridColumns = 10,
      wordListId,
    } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "A valid activity name is required." },
        { status: 400 }
      );
    }

    if (!["WORDLE", "WORD_SEARCH"].includes(type)) {
      return NextResponse.json(
        { error: "Activity type must be WORDLE or WORD_SEARCH." },
        { status: 400 }
      );
    }

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Difficulty must be Easy, Medium, or Hard." },
        { status: 400 }
      );
    }

    if (typeof showHints !== "boolean") {
      return NextResponse.json(
        { error: "showHints must be true or false." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(wordListId) ||
      wordListId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid wordListId is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(maxGuesses) ||
      maxGuesses < 1 ||
      maxGuesses > 20
    ) {
      return NextResponse.json(
        { error: "maxGuesses must be between 1 and 20." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(gridRows) ||
      gridRows < 5 ||
      gridRows > 30 ||
      !Number.isSafeInteger(gridColumns) ||
      gridColumns < 5 ||
      gridColumns > 30
    ) {
      return NextResponse.json(
        {
          error:
            "Grid rows and columns must be between 5 and 30.",
        },
        { status: 400 }
      );
    }

    const wordList = await prisma.wordList.findUnique({
      where: { id: wordListId },
      include: {
        words: true,
      },
    });

    if (!wordList) {
      return NextResponse.json(
        { error: "The selected word list does not exist." },
        { status: 404 }
      );
    }

    if (wordList.words.length === 0) {
      return NextResponse.json(
        { error: "The selected word list is empty." },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        type,
        difficulty,
        showHints,
        maxGuesses,
        gridRows,
        gridColumns,
        wordList: {
          connect: { id: wordListId },
        },
      },
      include: {
        wordList: {
          include: {
            words: {
              include: {
                word: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error creating activity:", error);

    return NextResponse.json(
      { error: "Unable to create activity." },
      { status: 500 }
    );
  }
}