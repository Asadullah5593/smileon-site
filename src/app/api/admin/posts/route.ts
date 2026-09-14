import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { postCreateSchema, postListQuerySchema } from "@/features/posts/schemas";
import { createPost, listPosts } from "@/features/posts/server/post-repository";

export const GET = createRouteHandler(
  { permission: "posts.read", query: postListQuerySchema },
  async ({ query }) => ok(await listPosts(query)),
);

export const POST = createRouteHandler(
  { permission: "posts.create", body: postCreateSchema },
  async ({ body, viewer }) => created(await createPost(body, viewer)),
);
