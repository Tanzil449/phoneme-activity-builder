
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

// GET: Retrieve all saved words
export async function GET() {
  try {
    const words = await prisma.word.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(words, { status: 200 });
  } catch (error) {
    console.error("Error retrieving words:", error);

    return NextResponse.json(
      { error: "Unable to retrieve words." },
      { status: 500 }
    );
  }
}

// POST: Save a new phoneme-based word
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { text, phonemes, hint } = body;

    if (
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "A valid English word is required." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(phonemes) ||
      phonemes.length === 0 ||
      !phonemes.every(
        (phoneme: unknown) =>
          typeof phoneme === "string" &&
          phoneme.trim().length > 0
      )
    ) {
      return NextResponse.json(
        { error: "At least one valid phoneme is required." },
        { status: 400 }
      );
    }

    if (
      hint !== undefined &&
      (typeof hint !== "string" || hint.length > 500)
    ) {
      return NextResponse.json(
        { error: "Hint must be a string of up to 500 characters." },
        { status: 400 }
      );
    }

    const word = await prisma.word.create({
      data: {
        text: text.trim(),
        phonemes: JSON.stringify(
          phonemes.map((phoneme: string) => phoneme.trim())
        ),
        hint: hint?.trim() || null,
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Error saving word:", error);

    return NextResponse.json(
      { error: "Unable to save word." },
      { status: 500 }
    );
  }
}