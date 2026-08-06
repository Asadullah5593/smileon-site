"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";
import { Label } from "@/shared/ui/primitives/label";
import { cn } from "@/shared/utils/cn";

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/**
 * Tiptap editor for CMS body copy. Output is HTML, sanitized server-side on
 * write by `shared/editor/sanitize.ts` — never trust what arrives from here.
 */
export function RichTextEditor({ label, value, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose-cms min-h-56 max-w-none px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const tools = [
    { icon: Bold, label: "Bold", run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, label: "Italic", run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: Heading2, label: "Heading 2", run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: Heading3, label: "Heading 3", run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { icon: List, label: "Bullet list", run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, label: "Numbered list", run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, label: "Quote", run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    {
      icon: Link2,
      label: "Link",
      run: () => {
        const url = window.prompt("Link URL", editor.getAttributes("link").href ?? "https://");
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
    },
    { icon: Undo2, label: "Undo", run: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo2, label: "Redo", run: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="rounded-md border">
        <div className="flex flex-wrap gap-0.5 border-b p-1">
          {tools.map((tool) => (
            <Button
              key={tool.label}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tool.label}
              aria-pressed={tool.active}
              className={cn("size-8", tool.active && "bg-accent text-accent-foreground")}
              onClick={tool.run}
            >
              <tool.icon className="size-4" />
            </Button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
