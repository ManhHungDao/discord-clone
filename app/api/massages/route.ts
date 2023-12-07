import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { Message } from "@prisma/client";
import { NextResponse } from "next/server";

const MASSAGE_BATCH = 10;

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");
    if (!channelId)
      return new NextResponse("Channel ID Missing", { status: 400 });

    let messages: Message[] = [];
    if (cursor) {
      messages = await db.message.findMany({
        take: MASSAGE_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
        },
        include: {
          member: {
            include: { profile: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      messages = await db.message.findMany({
        take: MASSAGE_BATCH,
        where: {
          channelId,
        },
        include: {
          member: {
            include: { profile: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    let nextCursor = null;
    if (messages.length === MASSAGE_BATCH) {
      nextCursor = messages[MASSAGE_BATCH - 1].id;
    }
    return NextResponse.json({
      items: messages,
      nextCursor,
    });
  } catch (error) {
    console.log("🚀 ~ file: route.ts:5 ~ GET ~ error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
