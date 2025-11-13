"use client"

interface WorkTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function WorkTabs({ categories, activeCategory, onCategoryChange }: WorkTabsProps) {
  return (
    <div className="flex gap-6 border-b border-border -mb-px">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-1 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeCategory === category
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

