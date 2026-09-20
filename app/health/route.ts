
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "OK",
      message: "Phoneme Activity Builder backend is running",
    },
    { status: 200 }
  );
}