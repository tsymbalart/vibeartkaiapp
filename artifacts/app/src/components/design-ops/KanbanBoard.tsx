import { useState } from "react";
import { createPortal } from "react-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { ItemCard, type KanbanItem } from "@/components/design-ops/ItemCard";
import { ItemDetailPanel } from "@/components/design-ops/ItemDetailPanel";
import { cn } from "@/lib/utils";

export type { KanbanItem };

interface KanbanColumnDef {
  key: string;
  label: string;
  dotColor: string;
}

const COLUMNS: KanbanColumnDef[] = [
  { key: "new", label: "New", dotColor: "bg-primary" },
  { key: "in_work", label: "In Work", dotColor: "bg-emerald-500" },
  { key: "in_review", label: "In Review", dotColor: "bg-amber-500" },
  { key: "done", label: "Done", dotColor: "bg-emerald-600" },
];

interface KanbanBoardProps {
  items: KanbanItem[];
  onMove: (item: KanbanItem, newStatus: string) => void;
  onArchive?: (item: KanbanItem) => void;
}

export function KanbanBoard({ items, onMove, onArchive }: KanbanBoardProps) {
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: items.filter((item) => item.status === col.key),
  }));

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;
    if (sourceCol === destCol) return;

    const draggedId = result.draggableId;
    const [source, idStr] = draggedId.split("-", 2) as [string, string];
    const item = items.find((i) => i.source === source && String(i.id) === idStr);
    if (item) {
      onMove(item, destCol);
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" data-testid="kanban-board">
          {grouped.map((col) => (
            <div key={col.key} className="flex flex-col min-h-[200px]" data-testid={`kanban-column-${col.key}`}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border pt-1">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className="text-sm font-medium text-foreground">{col.label}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full ml-auto">
                  {col.items.length}
                </span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col gap-2 flex-1 rounded-xl p-1 transition-colors",
                      snapshot.isDraggingOver && "bg-secondary/40"
                    )}
                  >
                    {col.items.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="flex items-center justify-center text-[13px] text-muted-foreground border border-dashed border-border rounded-xl py-8">
                        No items
                      </div>
                    ) : null}
                    {col.items.map((item, index) => (
                      <Draggable
                        key={`${item.source}-${item.id}`}
                        draggableId={`${item.source}-${item.id}`}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => {
                          const child = (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <ItemCard
                                item={item}
                                isDragging={dragSnapshot.isDragging}
                                draggable={true}
                                showSource={true}
                                onClick={() => setSelectedItem(item)}
                                onArchive={onArchive ? () => onArchive(item) : undefined}
                              />
                            </div>
                          );
                          // Portal dragged items to document.body to avoid
                          // offset issues from parent backdrop-blur / transforms
                          return dragSnapshot.isDragging ? createPortal(child, document.body) : child;
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Sheet open={!!selectedItem} onOpenChange={(v) => { if (!v) setSelectedItem(null); }}>
        <SheetContent
          side="right"
          className="w-[440px] sm:max-w-[440px] p-0 flex flex-col"
          aria-describedby={undefined}
        >
          {selectedItem && (
            <ItemDetailPanel key={selectedItem.id} item={selectedItem} onClose={() => setSelectedItem(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
