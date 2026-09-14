import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { countUnreadMessages } from "@/features/messages/server/message-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { MessagesInbox } from "@/features/messages/components/MessagesInbox";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requirePermission("messages.read");
  const unread = await countUnreadMessages();

  return (
    <>
      <PageHeader
        title="Contact messages"
        description={
          unread === 0
            ? "Enquiries sent through the website's contact form."
            : `${unread} unread ${unread === 1 ? "message" : "messages"} from the website's contact form.`
        }
      />
      <MessagesInbox />
    </>
  );
}
