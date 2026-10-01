/**
 * Gasto Buster — ExportMenu.
 *
 * Export affordance for the Reports header: a trigger that opens a
 * focus-trapped Sheet menu with exactly two choices — this period or all
 * data. Serialization (`toCSV`) and the download (`downloadFile`) run
 * entirely client-side with Blob + object URLs, so it works offline.
 * Completion is announced through a polite live region that stays mounted
 * after the menu closes.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Database } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import usePeriod from '../../hooks/usePeriod.js';
import { CATEGORY_MAP } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import { toCSV, buildFilename, downloadFile } from '../../lib/export.js';
import Button from '../ui/Button.jsx';
import Sheet from '../ui/Sheet.jsx';
import { cn } from '../../utils/cn.js';

const MENU_ITEM_CLASSES = `flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-gray-100 transition hover:bg-onyx-soft ${FOCUS_RING_CLASSES}`;

export default function ExportMenu() {
  const { expenses, settings } = useExpenseContext();
  const { range, filteredExpenses } = usePeriod();
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const announceTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    []
  );

  const close = () => setIsOpen(false);

  const runExport = (scope) => {
    const rows = scope === 'period' ? filteredExpenses : expenses;
    const csv = toCSV(rows, {
      categories: CATEGORY_MAP,
      currency: settings.currency,
    });
    const filename = buildFilename(scope, scope === 'period' ? range : undefined);
    downloadFile(filename, csv, 'text/csv;charset=utf-8');

    setIsOpen(false);
    // Clear first so back-to-back identical exports re-announce.
    setAnnouncement('');
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(`Exported ${filename}`);
    }, 50);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export completion announcements (persists after the menu closes) */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export CSV
      </Button>

      <Sheet
        isOpen={isOpen}
        onClose={close}
        label="Export options"
        panelClassName="gap-[var(--space-3)]"
      >
        <p className="text-sm font-semibold text-gray-100">Export</p>
        <button
          type="button"
          data-autofocus
          onClick={() => runExport('period')}
          className={cn(MENU_ITEM_CLASSES)}
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          Export this period (CSV)
        </button>
        <button
          type="button"
          onClick={() => runExport('all')}
          className={cn(MENU_ITEM_CLASSES)}
        >
          <Database className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          Export all data (CSV)
        </button>
      </Sheet>
    </div>
  );
}
