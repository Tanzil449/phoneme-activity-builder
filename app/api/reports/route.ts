import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalWords = await prisma.word.count();

    const totalWordLists = await prisma.wordList.count();

    const totalActivities = await prisma.activity.count();

    const totalWordle = await prisma.activity.count({
      where: {
        type: "WORDLE",
      },
    });

    const totalWordSearch = await prisma.activity.count({
      where: {
        type: "WORD_SEARCH",
      },
    });

    const successfulGenerations = await prisma.usageEvent.count({
      where: {
        eventType: "generation",
        success: true,
      },
    });

    const failedGenerations = await prisma.usageEvent.count({
      where: {
        eventType: "generation",
        success: false,
      },
    });

    const generationEvents = await prisma.usageEvent.findMany({
      where: {
        eventType: "generation",
        durationMs: {
          not: null,
        },
      },
      select: {
        durationMs: true,
      },
    });

    const averageGenerationTimeMs =
      generationEvents.length > 0
        ? Math.round(
            generationEvents.reduce(
              (total, event) =>
                total + (event.durationMs ?? 0),
              0
            ) / generationEvents.length
          )
        : 0;

    const activityUsage = await prisma.usageEvent.groupBy({
      by: ["activityType"],
      where: {
        activityType: {
          not: null,
        },
      },
      _count: {
        activityType: true,
      },
    });

    let mostUsedActivityType: string | null = null;

    if (activityUsage.length > 0) {
      activityUsage.sort(
        (a, b) =>
          b._count.activityType -
          a._count.activityType
      );

      mostUsedActivityType =
        activityUsage[0].activityType;
    }

    const recentEvents = await prisma.usageEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      status: "OK",
      totalWords,
      totalWordLists,
      totalActivities,
      totalWordle,
      totalWordSearch,
      successfulGenerations,
      failedGenerations,
      averageGenerationTimeMs,
      mostUsedActivityType,
      recentEvents,
    });
  } catch (error) {
    console.error("Reports API error:", error);

    return NextResponse.json(
      {
        status: "ERROR",
        message: "Unable to load reporting data",
      },
      {
        status: 500,
      }
    );
  }
}