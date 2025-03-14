declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
    data: any;
  }

  export interface GridChildComponentProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: any;
  }

  export interface ListItemKeySelector {
    (index: number, data: any): React.Key;
  }

  export interface GridItemKeySelector {
    (params: {columnIndex: number, rowIndex: number, data: any}): React.Key;
  }

  interface CommonProps {
    children: React.ComponentType<any>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    height: number | string;
    width: number | string;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    itemKey?: ListItemKeySelector | GridItemKeySelector;
    layout?: 'horizontal' | 'vertical';
    overscanCount?: number;
    itemData?: any;
  }

  export interface FixedSizeListProps extends CommonProps {
    itemCount: number;
    itemSize: number;
  }

  export interface FixedSizeList {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'center' | 'end' | 'start'): void;
  }

  export interface FixedSizeGridProps extends CommonProps {
    columnCount: number;
    columnWidth: number;
    rowCount: number;
    rowHeight: number;
  }

  export interface FixedSizeGrid {
    scrollTo(params: {scrollLeft: number, scrollTop: number}): void;
    scrollToItem(params: {
      align?: 'auto' | 'center' | 'end' | 'start',
      columnIndex?: number,
      rowIndex?: number
    }): void;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps, {}> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'center' | 'end' | 'start'): void;
  }

  export class FixedSizeGrid extends React.Component<FixedSizeGridProps, {}> {
    scrollTo(params: {scrollLeft: number, scrollTop: number}): void;
    scrollToItem(params: {
      align?: 'auto' | 'center' | 'end' | 'start',
      columnIndex?: number,
      rowIndex?: number
    }): void;
  }

  export interface VariableSizeListProps extends CommonProps {
    itemCount: number;
    itemSize: (index: number) => number;
    estimatedItemSize?: number;
  }

  export interface VariableSizeGridProps extends CommonProps {
    columnCount: number;
    columnWidth: (index: number) => number;
    estimatedColumnWidth?: number;
    estimatedRowHeight?: number;
    rowCount: number;
    rowHeight: (index: number) => number;
  }

  export class VariableSizeList extends React.Component<VariableSizeListProps, {}> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'center' | 'end' | 'start'): void;
  }

  export class VariableSizeGrid extends React.Component<VariableSizeGridProps, {}> {
    scrollTo(params: {scrollLeft: number, scrollTop: number}): void;
    scrollToItem(params: {
      align?: 'auto' | 'center' | 'end' | 'start',
      columnIndex?: number,
      rowIndex?: number
    }): void;
  }

  export interface ListOnItemsRenderedProps {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }

  export interface GridOnItemsRenderedProps {
    overscanColumnStartIndex: number;
    overscanColumnStopIndex: number;
    overscanRowStartIndex: number;
    overscanRowStopIndex: number;
    visibleColumnStartIndex: number;
    visibleColumnStopIndex: number;
    visibleRowStartIndex: number;
    visibleRowStopIndex: number;
  }

  export interface ListOnScrollProps {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }

  export interface GridOnScrollProps {
    horizontalScrollDirection: 'forward' | 'backward';
    scrollLeft: number;
    scrollTop: number;
    scrollUpdateWasRequested: boolean;
    verticalScrollDirection: 'forward' | 'backward';
  }
}

declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: { width: number; height: number }) => void;
    style?: React.CSSProperties;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
} 