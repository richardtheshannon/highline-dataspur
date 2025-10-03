'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Save,
  X,
  Undo,
  Redo
} from 'lucide-react';

interface SectionEditorProps {
  sectionId: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  autoSaveDelay?: number;
}

export default function SectionEditor({
  sectionId,
  initialContent,
  onSave,
  onCancel,
  autoSaveDelay = 3000
}: SectionEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (content !== lastSavedContent) {
        setHasUnsavedChanges(true);

        // Clear existing timer
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }

        // Set new auto-save timer
        const timer = setTimeout(() => {
          handleAutoSave(content);
        }, autoSaveDelay);

        setAutoSaveTimer(timer);
      }
    },
  });

  const handleAutoSave = useCallback(async (content: string) => {
    if (!editor || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(content);
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't update lastSavedContent if save failed
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onSave]);

  const handleManualSave = async () => {
    if (!editor || isSaving) return;

    const content = editor.getHTML();
    try {
      setIsSaving(true);
      await onSave(content);
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    onCancel();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0"
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            P
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {isSaving ? 'Saving...' : 'Unsaved changes'}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px] max-h-[600px] overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <span>
          Auto-save: {autoSaveDelay / 1000}s delay
        </span>
        <span>
          {editor.storage.characterCount?.characters() || 0} characters
        </span>
      </div>
    </div>
  );
}