import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { postUpdateSchema } from "@/features/posts/schemas";
import { deletePost, getPostById, updatePost } from "@/features/posts/server/post-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "posts.read", params: paramsSchema },
  async ({ params }) => ok(await getPostById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "posts.update", params: paramsSchema, body: postUpdateSchema },
  async ({ params, body, viewer }) => ok(await updatePost(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "posts.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deletePost(params.id, viewer);
    return noContent();
  },
);
