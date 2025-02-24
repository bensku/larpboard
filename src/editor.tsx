import * as Y from 'yjs';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';

export const TextEditor = ({fragment, editable}: {fragment: Y.XmlFragment, editable: boolean}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false
            }),
            Collaboration.configure({fragment}),
        ],
        editorProps: {
            attributes: {
                class: 'flex-grow outline-none'
            }
        },
        editable
    });
    return <div className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <EditorContent editor={editor} className="flex flex-grow" />
    </div>
}