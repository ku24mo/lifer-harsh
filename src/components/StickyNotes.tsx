"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X, Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addStickyNote,
  updateStickyNote,
  deleteStickyNote,
  toggleStickyNotePin,
} from "@/lib/data";
import type { StickyNoteRow } from "@/lib/types";

interface Props {
  date: string;
  notes: StickyNoteRow[];
  adding?: boolean;
  onAddingChange?: (v: boolean) => void;
}

const COLORS = [
  { key: "acid", bg: "bg-[var(--acid)]", text: "text-black", border: "border-black" },
  { key: "pink", bg: "bg-pink-400", text: "text-black", border: "border-black" },
  { key: "blue", bg: "bg-sky-400", text: "text-black", border: "border-black" },
  { key: "yellow", bg: "bg-yellow-300", text: "text-black", border: "border-black" },
  { key: "black", bg: "bg-black", text: "text-white", border: "border-black" },
];

function colorClass(color: string) {
  return COLORS.find((c) => c.key === color) ?? COLORS[0];
}

export function StickyNotes({ date, notes: initialNotes, adding: externalAdding, onAddingChange }: Props) {
  const [notes, setNotes] = useState<StickyNoteRow[]>(initialNotes);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("acid");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("acid");
  const [justAdded, setJustAdded] = useState(false);

  // Sync external adding state from bottom bar
  useEffect(() => {
    if (externalAdding !== undefined) {
      setAdding(externalAdding);
    }
  }, [externalAdding]);

  const handleAddingChange = (v: boolean) => {
    setAdding(v);
    onAddingChange?.(v);
  };

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    const content = newContent.trim();
    const color = newColor;
    startTransition(async () => {
      // Optimistic: add a temp note immediately
      const tempId = `temp-${Date.now()}`;
      setNotes((n) => [
        ...n,
        { id: tempId, date, content, color, pinned: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as StickyNoteRow,
      ]);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 600);
      setNewContent("");
      handleAddingChange(false);
      await addStickyNote(date, content, color);
      // Refresh from server to get real IDs
      const { fetchStickyNotes } = await import("@/lib/data-client");
      const fresh = await fetchStickyNotes(date);
      setNotes(fresh);
    });
  };

  const handleDelete = (id: string) => {
    // Optimistic: remove immediately
    setNotes((n) => n.filter((note) => note.id !== id));
    startTransition(async () => {
      await deleteStickyNote(id);
    });
  };

  const handlePin = (id: string, pinned: boolean) => {
    // Optimistic: update immediately
    setNotes((n) =>
      n
        .map((note) =>
          note.id === id ? { ...note, pinned: !pinned } : note
        )
        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    );
    startTransition(async () => {
      await toggleStickyNotePin(id, !pinned);
    });
  };

  const handleSaveEdit = (id: string) => {
    // Optimistic: update immediately
    setNotes((n) =>
      n.map((note) =>
        note.id === id ? { ...note, content: editContent.trim(), color: editColor } : note
      )
    );
    setEditingId(null);
    startTransition(async () => {
      await updateStickyNote(id, editContent.trim(), editColor);
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
          Sticky notes
        </h3>
        <button
          onClick={() => handleAddingChange(!adding)}
          className="flex h-6 w-6 items-center justify-center border-2 border-black bg-white text-black transition hover:bg-[var(--acid)]"
          aria-label="Add note"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mt-3 border-2 border-black p-3 animate-fade-in">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="quick thought…"
            rows={3}
            autoFocus
            className="w-full bg-transparent text-[14px] font-medium text-black placeholder:text-black/30 outline-none resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setNewColor(c.key)}
                  className={cn(
                    "h-5 w-5 border-2 border-black transition",
                    c.bg,
                    newColor === c.key && "ring-2 ring-black ring-offset-1"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  handleAddingChange(false);
                  setNewContent("");
                }}
                className="px-2 py-1 text-[11px] font-bold uppercase text-black/40 hover:text-black"
              >
                cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={pending || !newContent.trim()}
                className="bg-black px-3 py-1 text-[11px] font-bold uppercase text-white transition hover:bg-[var(--acid)] hover:text-black disabled:opacity-30"
              >
                add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {notes.map((note) => {
          const c = colorClass(note.color);
          const isEditing = editingId === note.id;
          return (
            <div
              key={note.id}
              className={cn(
                "group relative border-2 border-black p-3 transition animate-fade-in",
                c.bg,
                c.text,
                note.pinned && "shadow-[3px_3px_0_0_#000]"
              )}
            >
              {note.pinned && (
                <Pin className="absolute top-2 right-2 h-3 w-3 fill-current opacity-60" />
              )}

              {isEditing ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full bg-transparent text-[13px] font-medium outline-none resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      {COLORS.map((col) => (
                        <button
                          key={col.key}
                          onClick={() => setEditColor(col.key)}
                          className={cn(
                            "h-4 w-4 border border-black/30 transition",
                            col.bg,
                            editColor === col.key && "ring-1 ring-black"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="text-[11px] font-bold uppercase underline"
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[13px] font-medium leading-snug whitespace-pre-wrap pr-4">
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2 opacity-100 sm:opacity-0 transition sm:group-hover:opacity-100">
                    <button
                      onClick={() => handlePin(note.id, note.pinned)}
                      className="text-[10px] font-bold uppercase opacity-60 hover:opacity-100"
                    >
                      {note.pinned ? "unpin" : "pin"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                        setEditColor(note.color);
                      }}
                      className="text-[10px] font-bold uppercase opacity-60 hover:opacity-100"
                    >
                      edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-[10px] font-bold uppercase opacity-60 hover:opacity-100"
                    >
                      delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {notes.length === 0 && !adding && (
        <p className="mt-3 text-[12px] text-black/20">
          no notes yet. hit + to capture a thought.
        </p>
      )}
    </div>
  );
}
