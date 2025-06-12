import React, { useState, useCallback, useRef } from 'react';

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export interface DropResult {
  dragItem: DragItem;
  dropTarget: string;
  dropIndex?: number;
}

export interface DragDropHandlers {
  onDragStart: (e: React.DragEvent, item: DragItem) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDrop: (e: React.DragEvent, targetId: string, index?: number) => void;
  isDragging: boolean;
  dragItem: DragItem | null;
  dropTarget: string | null;
}

export function useDragAndDrop(
  onDropComplete?: (result: DropResult) => void
): DragDropHandlers {
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLElement | null>(null);

  const onDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    setIsDragging(true);
    setDragItem(item);
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag image
    const dragElement = e.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    
    // Create a clone for drag image
    const clone = dragElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '-1000px';
    clone.style.width = `${rect.width}px`;
    clone.style.transform = 'rotate(3deg)';
    clone.style.opacity = '0.8';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);
    
    // Add visual feedback
    dragElement.style.opacity = '0.5';
  }, []);

  const onDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    setDragItem(null);
    setDropTarget(null);
    
    // Restore opacity
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '1';
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetId);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, targetId: string, index?: number) => {
    e.preventDefault();
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const item: DragItem = JSON.parse(dragData);
      
      if (onDropComplete) {
        onDropComplete({
          dragItem: item,
          dropTarget: targetId,
          dropIndex: index
        });
      }
    } catch (error) {
    }
    
    setDropTarget(null);
  }, [onDropComplete]);

  return {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    isDragging,
    dragItem,
    dropTarget
  };
}