import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      eventType,
      activityType,
      success,
      durationMs,
      details,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        {
          status: "ERROR",
          message: "eventType is required",
        },
        { status: 400 }
      );
    }

    const usageEvent = await prisma.usageEvent.create({
      data: {
        eventType,
        activityType: activityType ?? null,
        success:
          typeof success === "boolean"
            ? success
            : null,
        durationMs:
          typeof durationMs === "number"
            ? durationMs
            : null,
        details: details ?? null,
      },
    });

    return NextResponse.json(
      {
        status: "OK",
        usageEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Usage event API error:", error);

    return NextResponse.json(
      {
        status: "ERROR",
        message: "Unable to record usage event",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const usageEvents = await prisma.usageEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(usageEvents);
  } catch (error) {
    console.error("Usage event GET error:", error);

    return NextResponse.json(
      {
        status: "ERROR",
        message: "Unable to load usage events",
      },
      { status: 500 }
    );
  }
}