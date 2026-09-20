
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

const includeWordList = {
  wordList: {
    include: {
      words: {
        include: {
          word: true,
        },
      },
    },
  },
};

// GET: Retrieve an activity by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const activityId = getValidId(id);

    if (activityId === null) {
      return NextResponse.json(
        { error: "Invalid activity ID." },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: includeWordList,
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(activity, { status: 200 });
  } catch (error) {
    console.error("Error retrieving activity:", error);

    return NextResponse.json(
      { error: "Unable to retrieve activity." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing activity
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const activityId = getValidId(id);

    if (activityId === null) {
      return NextResponse.json(
        { error: "Invalid activity ID." },
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

    const {
      name,
      type,
      difficulty,
      showHints,
      maxGuesses,
      gridRows,
      gridColumns,
      wordListId,
    } = body;

    if (Object.keys(body).length === 0) {
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
        { error: "A valid activity name is required." },
        { status: 400 }
      );
    }

    if (
      type !== undefined &&
      !["WORDLE", "WORD_SEARCH"].includes(type)
    ) {
      return NextResponse.json(
        { error: "Invalid activity type." },
        { status: 400 }
      );
    }

    if (
      difficulty !== undefined &&
      !["Easy", "Medium", "Hard"].includes(difficulty)
    ) {
      return NextResponse.json(
        { error: "Invalid difficulty level." },
        { status: 400 }
      );
    }

    if (
      showHints !== undefined &&
      typeof showHints !== "boolean"
    ) {
      return NextResponse.json(
        { error: "showHints must be true or false." },
        { status: 400 }
      );
    }

    if (
      maxGuesses !== undefined &&
      (!Number.isSafeInteger(maxGuesses) ||
        maxGuesses < 1 ||
        maxGuesses > 20)
    ) {
      return NextResponse.json(
        { error: "maxGuesses must be between 1 and 20." },
        { status: 400 }
      );
    }

    if (
      gridRows !== undefined &&
      (!Number.isSafeInteger(gridRows) ||
        gridRows < 5 ||
        gridRows > 30)
    ) {
      return NextResponse.json(
        { error: "gridRows must be between 5 and 30." },
        { status: 400 }
      );
    }

    if (
      gridColumns !== undefined &&
      (!Number.isSafeInteger(gridColumns) ||
        gridColumns < 5 ||
        gridColumns > 30)
    ) {
      return NextResponse.json(
        { error: "gridColumns must be between 5 and 30." },
        { status: 400 }
      );
    }

    if (
      wordListId !== undefined &&
      (!Number.isSafeInteger(wordListId) ||
        wordListId <= 0)
    ) {
      return NextResponse.json(
        { error: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const existingActivity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found." },
        { status: 404 }
      );
    }

    if (wordListId !== undefined) {
      const wordList = await prisma.wordList.findUnique({
        where: { id: wordListId },
        include: { words: true },
      });

      if (!wordList) {
        return NextResponse.json(
          { error: "Selected word list not found." },
          { status: 404 }
        );
      }

      if (wordList.words.length === 0) {
        return NextResponse.json(
          { error: "Selected word list is empty." },
          { status: 400 }
        );
      }
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),
        ...(type !== undefined && { type }),
        ...(difficulty !== undefined && { difficulty }),
        ...(showHints !== undefined && { showHints }),
        ...(maxGuesses !== undefined && { maxGuesses }),
        ...(gridRows !== undefined && { gridRows }),
        ...(gridColumns !== undefined && { gridColumns }),
        ...(wordListId !== undefined && {
          wordList: {
            connect: { id: wordListId },
          },
        }),
      },
      include: includeWordList,
    });

    return NextResponse.json(updatedActivity, {
      status: 200,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error updating activity:", error);

    return NextResponse.json(
      { error: "Unable to update activity." },
      { status: 500 }
    );
  }
}

// DELETE: Delete an existing activity
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const activityId = getValidId(id);

    if (activityId === null) {
      return NextResponse.json(
        { error: "Invalid activity ID." },
        { status: 400 }
      );
    }

    const existingActivity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found." },
        { status: 404 }
      );
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });

    return NextResponse.json(
      { message: "Activity deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting activity:", error);

    return NextResponse.json(
      { error: "Unable to delete activity." },
      { status: 500 }
    );
  }
}