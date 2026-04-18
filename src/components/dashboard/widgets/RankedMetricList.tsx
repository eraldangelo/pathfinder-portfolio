import React, { useMemo, useState } from 'react';

export interface RankedMetricItem {
  id: string;
  value: number;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  leading?: React.ReactNode;
  onClick?: () => void;
  hideBar?: boolean;
  hideValue?: boolean;
}

interface RankedMetricListProps {
  items: RankedMetricItem[];
  emptyState: React.ReactNode;
  barClassName?: string;
  columns?: number;
}

export const RankedMetricList: React.FC<RankedMetricListProps> = ({
  items,
  emptyState,
  barClassName = 'bg-indigo-500',
  columns = 1,
}) => {
  const barItems = items.filter((item) => !item.hideBar);
  const maxValue = barItems.length > 0 ? Math.max(...barItems.map((item) => item.value)) : 0;

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  const renderedItems = items.map((item) => {
    const rowMainClassName = item.leading ? 'flex items-center gap-3 flex-1 min-w-0' : 'flex-1 min-w-0';
    const content = (
      <>
        <div className={rowMainClassName}>
          {item.leading}
          <div className="flex-1 min-w-0">
            {item.primary}
            {item.secondary}
          </div>
        </div>
        {!item.hideValue ? (
          <span className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">{item.value}</span>
        ) : null}
      </>
    );

    return (
      <div key={item.id} className="space-y-1">
        {item.onClick ? (
          <button onClick={item.onClick} className="w-full flex flex-wrap items-start justify-between gap-2 text-left sm:flex-nowrap sm:items-center sm:gap-4">
            {content}
          </button>
        ) : (
          <div className="w-full flex flex-wrap items-start justify-between gap-2 text-left sm:flex-nowrap sm:items-center sm:gap-4">{content}</div>
        )}
        {!item.hideBar ? (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className={`${barClassName} h-1.5 rounded-full`} style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }} />
          </div>
        ) : null}
      </div>
    );
  });

  if (columns > 1) {
    const gridClassName = columns >= 3
      ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
      : 'grid grid-cols-1 gap-3 md:grid-cols-2';
    return <div className={gridClassName}>{renderedItems}</div>;
  }

  return <>{renderedItems}</>;
};

interface ToggleableRankedMetricListProps extends RankedMetricListProps {
  defaultVisibleCount?: number;
  seeAllLabel: React.ReactNode;
  showLessLabel: React.ReactNode;
}

export const ToggleableRankedMetricList: React.FC<ToggleableRankedMetricListProps> = ({
  items,
  emptyState,
  barClassName,
  defaultVisibleCount = 5,
  seeAllLabel,
  showLessLabel,
  columns,
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = useMemo(
    () => (showAll ? items : items.slice(0, defaultVisibleCount)),
    [defaultVisibleCount, items, showAll]
  );
  const canToggle = items.length > defaultVisibleCount;

  return (
    <>
      <RankedMetricList items={visibleItems} emptyState={emptyState} barClassName={barClassName} columns={columns} />
      {canToggle ? (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {showAll ? showLessLabel : seeAllLabel}
        </button>
      ) : null}
    </>
  );
};
