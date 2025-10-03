'use client';

import { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { ChevronDown, ChevronRight, FolderOpen, Folder, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  children?: Category[];
  _count?: {
    reports: number;
  };
}

interface CategoryTreeViewProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCreateCategory: (name: string, parentId: string | null) => void;
  onRefresh: () => void;
}

export default function CategoryTreeView({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onRefresh,
}: CategoryTreeViewProps) {
  const [expanded, setExpanded] = useState<string[]>(['root']);
  const [creatingCategory, setCreatingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Build tree structure from flat array
  const buildTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const roots: Category[] = [];

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  const tree = buildTree(categories);

  const handleToggle = (event: React.SyntheticEvent | null, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent | null, nodeIds: string | string[] | null) => {
    const nodeId = Array.isArray(nodeIds) ? nodeIds[0] : nodeIds;
    if (nodeId === 'root') {
      onSelectCategory(null);
    } else if (nodeId) {
      onSelectCategory(nodeId);
    }
  };

  const canAddChild = (category: Category | null) => {
    if (!category) return true; // Root level
    return category.level < 3; // Max depth of 4
  };

  const handleCreateNew = async (parentId: string | null) => {
    if (newCategoryName.trim()) {
      await onCreateCategory(newCategoryName.trim(), parentId === 'root' ? null : parentId);
      setNewCategoryName('');
      setCreatingCategory(null);
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (editCategoryName.trim()) {
      try {
        const response = await fetch(`/api/reporting/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: editCategoryName.trim() }),
        });

        if (response.ok) {
          onRefresh();
          setEditingCategory(null);
          setEditCategoryName('');
        }
      } catch (error) {
        console.error('Failed to update category:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? It must be empty.')) {
      try {
        const response = await fetch(`/api/reporting/categories/${categoryId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onRefresh();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const renderTree = (nodes: Category[], parentId: string | null = null) => {
    return nodes.map((node) => {
      const nodeId = node.id;
      const reportCount = node._count?.reports || 0;

      return (
        <TreeItem
          key={nodeId}
          itemId={nodeId}
          label={
            <div className="flex items-center justify-between py-1 pr-2 group">
              {editingCategory === nodeId ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateCategory(nodeId);
                      } else if (e.key === 'Escape') {
                        setEditingCategory(null);
                      }
                    }}
                    className="h-7 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateCategory(nodeId);
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    {expanded.includes(nodeId) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                    <span>{node.name}</span>
                    {reportCount > 0 && (
                      <span className="text-xs text-gray-500">({reportCount})</span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canAddChild(node) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreatingCategory(nodeId);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subcategory
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(nodeId);
                            setEditCategoryName(node.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(nodeId);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          }
        >
          {creatingCategory === nodeId && (
            <div className="flex items-center gap-2 pl-6 py-2">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNew(nodeId);
                  } else if (e.key === 'Escape') {
                    setCreatingCategory(null);
                    setNewCategoryName('');
                  }
                }}
                className="h-8 text-sm"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateNew(nodeId);
                }}
              >
                Add
              </Button>
            </div>
          )}
          {node.children && renderTree(node.children, nodeId)}
        </TreeItem>
      );
    });
  };

  return (
    <div>
      <div className="mb-4">
        <button
          className="form-btn form-btn-secondary w-full flex items-center justify-center gap-2"
          onClick={() => setCreatingCategory('root')}
        >
          <span className="material-symbols-outlined">create_new_folder</span>
          New Category
        </button>
      </div>

      {creatingCategory === 'root' && (
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNew(null);
              } else if (e.key === 'Escape') {
                setCreatingCategory(null);
                setNewCategoryName('');
              }
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => handleCreateNew(null)}
          >
            Add
          </Button>
        </div>
      )}

      <SimpleTreeView
        aria-label="category navigator"
        defaultCollapseIcon={<ChevronDown className="h-4 w-4" />}
        defaultExpandIcon={<ChevronRight className="h-4 w-4" />}
        expandedItems={expanded}
        selectedItems={selectedCategoryId || 'root'}
        onExpandedItemsChange={handleToggle}
        onSelectedItemsChange={handleSelect}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          '& .MuiTreeItem-content': {
            padding: '2px 0',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
              },
            },
          },
        }}
      >
        <TreeItem
          itemId="root"
          label={
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span className="font-medium">All Reports</span>
              </div>
            </div>
          }
        >
          {renderTree(tree)}
        </TreeItem>
      </SimpleTreeView>
    </div>
  );
}