import "server-only";

import { connectToDatabase } from "@/lib/db";
import { NewsComment } from "@/models/NewsComment";
import { User } from "@/models/User";

export type NewsCommentDTO = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    username: string;
    displayName: string;
    avatar: string | null;
  };
};

export async function getNewsComments(storySlug: string, limit = 40): Promise<NewsCommentDTO[]> {
  await connectToDatabase();
  const comments = await NewsComment.find({ storySlug, status: "visible" })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean<Array<{ _id: unknown; userId: unknown; content: string; createdAt: Date }>>();

  const userIds = [...new Set(comments.map((comment) => String(comment.userId)))];
  const users = await User.find({ _id: { $in: userIds }, accountStatus: "active" })
    .select("username displayName avatar")
    .lean<Array<{ _id: unknown; username: string; displayName: string; avatar?: string | null }>>();
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return comments.map((comment) => {
    const author = userMap.get(String(comment.userId));
    return {
      id: String(comment._id),
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        username: author?.username ?? "proai-reader",
        displayName: author?.displayName ?? "خواننده ProAI",
        avatar: author?.avatar ?? null,
      },
    };
  });
}
