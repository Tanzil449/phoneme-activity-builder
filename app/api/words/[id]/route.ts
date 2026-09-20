
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Retrieve a single word by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordId = Number(id);

    if (!Number.isSafeInteger(wordId) || wordId <= 0) {
      return NextResponse.json(
        { error: "Invalid word ID." },
        { status: 400 }
      );
    }

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      return NextResponse.json(
        { error: "Word not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(word, { status: 200 });
  } catch (error) {
    console.error("Error retrieving word:", error);

    return NextResponse.json(
      { error: "Unable to retrieve word." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing word
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordId = Number(id);

    if (!Number.isSafeInteger(wordId) || wordId <= 0) {
      return NextResponse.json(
        { error: "Invalid word ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "A valid JSON object is required." },
        { status: 400 }
      );
    }

    const { text, phonemes, hint } = body;

    if (
      text === undefined &&
      phonemes === undefined &&
      hint === undefined
    ) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 }
      );
    }

    if (
      text !== undefined &&
      (typeof text !== "string" || text.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "A valid English word is required." },
        { status: 400 }
      );
    }

    if (
      phonemes !== undefined &&
      (
        !Array.isArray(phonemes) ||
        phonemes.length === 0 ||
        !phonemes.every(
          (phoneme: unknown) =>
            typeof phoneme === "string" &&
            phoneme.trim().length > 0
        )
      )
    ) {
      return NextResponse.json(
        { error: "At least one valid phoneme is required." },
        { status: 400 }
      );
    }

    if (
      hint !== undefined &&
      hint !== null &&
      (typeof hint !== "string" || hint.length > 500)
    ) {
      return NextResponse.json(
        { error: "Hint must be a string of up to 500 characters." },
        { status: 400 }
      );
    }

    const existingWord = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!existingWord) {
      return NextResponse.json(
        { error: "Word not found." },
        { status: 404 }
      );
    }

    const updatedWord = await prisma.word.update({
      where: { id: wordId },
      data: {
        ...(text !== undefined && {
          text: text.trim(),
        }),
        ...(phonemes !== undefined && {
          phonemes: JSON.stringify(
            phonemes.map((phoneme: string) => phoneme.trim())
          ),
        }),
        ...(hint !== undefined && {
          hint: hint === null ? null : hint.trim() || null,
        }),
      },
    });

    return NextResponse.json(updatedWord, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error updating word:", error);

    return NextResponse.json(
      { error: "Unable to update word." },
      { status: 500 }
    );
  }
}

// DELETE: Delete an existing word
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const wordId = Number(id);

    if (!Number.isSafeInteger(wordId) || wordId <= 0) {
      return NextResponse.json(
        { error: "Invalid word ID." },
        { status: 400 }
      );
    }

    const existingWord = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!existingWord) {
      return NextResponse.json(
        { error: "Word not found." },
        { status: 404 }
      );
    }

    await prisma.word.delete({
      where: { id: wordId },
    });

    return NextResponse.json(
      { message: "Word deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting word:", error);

    return NextResponse.json(
      { error: "Unable to delete word." },
      { status: 500 }
    );
  }
}