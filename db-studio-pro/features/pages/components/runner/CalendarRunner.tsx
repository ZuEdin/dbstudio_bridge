import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../../../stores/useProjectStore';
import { executeSelectQuery } from '../../../queries/utils/queryExecution';
import { CalendarRunnerProps, CalendarViewType, CalendarEvent } from './calendar/types';
import { getMonthDays, getWeekDays, isSameDay, processEvents } from './calendar/utils';
import { CalendarTopBar } from './calendar/CalendarTopBar';
import { CalendarNavBar } from './calendar/CalendarNavBar';
import { CalendarMonthView } from './calendar/CalendarMonthView';
import { CalendarWeekView } from './calendar/CalendarWeekView';
import { CalendarDayView } from './calendar/CalendarDayView';
import { CalendarAgendaView } from './calendar/CalendarAgendaView';
import { CalendarEventDetailModal } from './calendar/CalendarEventDetailModal';
import { CalendarFormModal } from './calendar/CalendarFormModal';

export const CalendarRunner: React.FC<CalendarRunnerProps> = ({
  comp,
  node,
  fetchedData = [],
  loading,
}) => {
  const { tables, queries, relationships, updateTable } = useProjectStore();
  const conf = comp.configuration || {};

  // Find linked table if applicable (override config with node props if provided)
  const nodeProps = node?.props || {};
  const dsId = nodeProps.dataSourceId || conf.dataSourceId || conf.tableId;
  const dsType = nodeProps.dataSourceType || conf.dataSourceType || (conf.tableId ? 'table' : '');
  const linkedTable = dsType === 'table' ? tables.find(t => t.id === dsId) : null;
  const linkedQuery = dsType === 'query' ? queries.find(q => q.id === dsId) : null;

  const activeData = useMemo(() => {
    if (fetchedData && fetchedData.length > 0) {
      return fetchedData;
    }
    if (linkedTable) {
      return linkedTable.data || [];
    }
    if (linkedQuery && linkedQuery.type === 'SELECT') {
      try {
        return executeSelectQuery(linkedQuery as any, tables, relationships || []);
      } catch (err) {
        console.error("Error executing query for calendar:", err);
      }
    }
    return [];
  }, [fetchedData, linkedTable, linkedQuery, tables, relationships]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarViewType>(
    (conf.defaultView as any) || 'month'
  );

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Process data from table/query to standardized event format
  const events = useMemo(() => {
    return processEvents(activeData, conf);
  }, [activeData, conf]);

  // Handle month/year changes
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (currentView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (currentView === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (currentView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (currentView === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  // Days calculations
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(e => e.start && isSameDay(e.start, day));
  };

  // Handle Event Clicks
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  // Add Record handler
  const handleOpenAddModal = (day?: Date, timeString?: string) => {
    if (!linkedTable) return;
    const initialForm: Record<string, any> = {};
    linkedTable.fields.forEach((f: any) => {
      if (f.isAutoIncrement || f.isPrimaryKey) return;
      const fieldNameLower = f.name.toLowerCase();

      if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
        const d = day || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        if (f.type === 'DATE') {
          initialForm[f.name] = `${year}-${month}-${date}`;
        } else {
          const time = timeString || "09:00";
          initialForm[f.name] = `${year}-${month}-${date}T${time}:00`;
        }
      } else if (f.type === 'BOOLEAN') {
        initialForm[f.name] = false;
      } else if (fieldNameLower.includes('uhrzeit') || fieldNameLower.includes('zeit') || fieldNameLower.includes('time') || fieldNameLower.includes('startzeit')) {
        initialForm[f.name] = timeString || '09:00';
      } else if (fieldNameLower.includes('farbe') || fieldNameLower.includes('color')) {
        initialForm[f.name] = '#4f46e5';
      } else {
        initialForm[f.name] = f.defaultValue || '';
      }
    });
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleSaveNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedTable) return;

    // Generate unique ID
    const primaryKeyField = linkedTable.fields.find((f: any) => f.isPrimaryKey) || { name: 'id' };
    const recordId = Math.random().toString(36).substr(2, 9);
    
    const newRecord = {
      ...formData,
      [primaryKeyField.name]: recordId
    };

    const updatedData = [...(linkedTable.data || []), newRecord];
    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setShowAddModal(false);
    setFormData({});
  };

  // Edit/Update Event handler
  const handleOpenEditModal = () => {
    if (!linkedTable || !selectedEvent) return;
    setFormData({ ...selectedEvent.raw });
    setShowEditModal(true);
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedTable || !selectedEvent) return;

    const primaryKeyField = linkedTable.fields.find((f: any) => f.isPrimaryKey) || { name: 'id' };
    const pKeyValue = selectedEvent.raw[primaryKeyField.name];

    const updatedData = (linkedTable.data || []).map((row: any) => {
      if (row[primaryKeyField.name] === pKeyValue) {
        return { ...row, ...formData };
      }
      return row;
    });

    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setShowEditModal(false);
    setSelectedEvent(null);
    setFormData({});
  };

  // Delete Record handler
  const handleDeleteRecord = () => {
    if (!linkedTable || !selectedEvent) return;
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;

    const primaryKeyField = linkedTable.fields.find((f: any) => f.isPrimaryKey) || { name: 'id' };
    const pKeyValue = selectedEvent.raw[primaryKeyField.name];

    const updatedData = (linkedTable.data || []).filter((row: any) => row[primaryKeyField.name] !== pKeyValue);

    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setSelectedEvent(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[650px] w-full text-slate-800 dark:text-slate-100 font-sans transition-all">
      {/* Upper Information Bar */}
      <CalendarTopBar
        linkedTable={linkedTable}
        linkedQuery={linkedQuery}
        eventsCount={events.length}
        onOpenAddModal={() => handleOpenAddModal()}
      />

      {/* Main Calendar Navigation */}
      <CalendarNavBar
        currentDate={currentDate}
        currentView={currentView}
        prevPeriod={prevPeriod}
        nextPeriod={nextPeriod}
        setToday={setToday}
        setCurrentView={setCurrentView}
      />

      {/* VIEW GRID CONTENT */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/20 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {currentView === 'month' && (
          <CalendarMonthView
            monthDays={monthDays}
            getEventsForDay={getEventsForDay}
            linkedTable={linkedTable}
            onOpenAddModal={handleOpenAddModal}
            onEventClick={handleEventClick}
          />
        )}

        {currentView === 'week' && (
          <CalendarWeekView
            weekDays={weekDays}
            getEventsForDay={getEventsForDay}
            linkedTable={linkedTable}
            onOpenAddModal={handleOpenAddModal}
            onEventClick={handleEventClick}
          />
        )}

        {currentView === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            getEventsForDay={getEventsForDay}
            linkedTable={linkedTable}
            onOpenAddModal={handleOpenAddModal}
            onEventClick={handleEventClick}
          />
        )}

        {currentView === 'agenda' && (
          <CalendarAgendaView
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* EVENT DETAIL POPUP MODAL */}
      <CalendarEventDetailModal
        selectedEvent={selectedEvent}
        linkedTable={linkedTable}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteRecord}
      />

      {/* DYNAMIC FORM MODAL: ADD RECORD */}
      <CalendarFormModal
        mode="add"
        isOpen={showAddModal}
        linkedTable={linkedTable}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSaveNewRecord}
      />

      {/* DYNAMIC FORM MODAL: EDIT RECORD */}
      <CalendarFormModal
        mode="edit"
        isOpen={showEditModal && !!selectedEvent}
        linkedTable={linkedTable}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveEditRecord}
      />
    </div>
  );
};
