import { CustomPage, PageComponent } from '../../../../types';

export interface PagePreset {
  id: string;
  name: string;
  category: 'master_detail' | 'dashboard' | 'forms' | 'crm';
  description: string;
  icon: string;
  layout: PageComponent;
}

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: 'master_detail_order',
    name: 'Auftrag 360° mit Positionen (Master-Detail)',
    category: 'master_detail',
    description: 'Vollständige Master-Detail Auftragsseite mit Kopfdaten, Status-Badge, KPI-Kennzahlen und interaktivem Subformular für Auftragspositionen.',
    icon: 'Layers',
    layout: {
      id: 'root',
      type: 'container',
      props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
      children: [
        {
          id: 'node_alert',
          type: 'alert_box',
          props: {
            alertType: 'info',
            title: 'Auftragsbearbeitung aktiv',
            message: 'Änderungen in den Kopfdaten oder Positionen werden automatisch synchronisiert.',
            dismissible: true
          }
        },
        {
          id: 'node_header_row',
          type: 'row',
          props: { className: 'items-center justify-between' },
          children: [
            {
              id: 'node_header_col',
              type: 'column',
              props: { flex: '1' },
              children: [
                {
                  id: 'node_title',
                  type: 'text',
                  props: {
                    text: 'Auftrag #{{context.id || "10482"}} - Detailansicht',
                    className: 'text-2xl font-bold text-slate-900 tracking-tight'
                  }
                },
                {
                  id: 'node_subtitle',
                  type: 'text',
                  props: {
                    text: 'Kunde: {{context.kunden_name || "Muster GmbH & Co. KG"}} | Erstellt am {{context.created_at || "18.08.2026"}}',
                    className: 'text-sm text-slate-500 mt-1'
                  }
                }
              ]
            },
            {
              id: 'node_actions',
              type: 'action_group',
              props: {
                actions: [
                  { label: 'PDF Export', icon: 'Download', variant: 'secondary', actionType: 'export' },
                  { label: 'Auftrag abschließen', icon: 'CheckCircle', variant: 'primary', actionType: 'custom' }
                ]
              }
            }
          ]
        },
        {
          id: 'node_kpi_grid',
          type: 'grid_layout',
          props: { columns: 3, gap: 4 },
          children: [
            {
              id: 'node_kpi_1',
              type: 'kpi_widget',
              props: {
                label: 'Auftragssumme (Netto)',
                value: '14.850,00',
                unit: '€',
                trend: '+8.4%',
                trendDirection: 'up',
                trendLabel: 'inkl. Rabattstaffel',
                accentColor: 'emerald',
                icon: 'DollarSign'
              }
            },
            {
              id: 'node_kpi_2',
              type: 'kpi_widget',
              props: {
                label: 'Positionen Gesamt',
                value: '12',
                unit: 'Pos.',
                trend: '3 geliefert',
                trendDirection: 'neutral',
                trendLabel: 'Liefertermin: 25.08.',
                accentColor: 'indigo',
                icon: 'Layers'
              }
            },
            {
              id: 'node_kpi_3',
              type: 'kpi_widget',
              props: {
                label: 'Bearbeitungsstatus',
                value: 'In Bearbeitung',
                trend: 'Priorität Hoch',
                trendDirection: 'neutral',
                trendLabel: 'Zuständig: M. Schmidt',
                accentColor: 'amber',
                icon: 'Clock'
              }
            }
          ]
        },
        {
          id: 'node_tabs',
          type: 'tabs_container',
          props: {
            defaultTab: 'tab_positions',
            tabs: [
              { id: 'tab_positions', label: 'Auftragspositionen', icon: 'List' },
              { id: 'tab_details', label: 'Stammdaten & Adresse', icon: 'FileText' },
              { id: 'tab_subpage', label: 'Verknüpfte Unterseite', icon: 'Layers' }
            ]
          },
          children: [
            {
              id: 'node_subform_pos',
              type: 'subform',
              props: {
                title: 'Positionstabelle & Leistungsverzeichnis',
                subtitle: 'Fügen Sie Artikel hinzu oder passen Sie Mengen und Einzelpreise an.',
                foreignKeyField: 'auftrag_id',
                parentKeyField: 'id',
                allowAdd: true,
                allowDelete: true,
                allowEdit: true,
                showTotalRow: true,
                totalField: 'gesamtpreis',
                emptyText: 'Noch keine Positionen erfasst. Klicken Sie auf "+ Neue Position hinzufügen".'
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'analytics_dashboard',
    name: 'Executive Analytics & KPI Dashboard',
    category: 'dashboard',
    description: 'Modernes Kennzahlen-Cockpit mit Stat-Cards, dynamischem Such- und Filterbereich und interaktiven Datenlisten.',
    icon: 'TrendingUp',
    layout: {
      id: 'root',
      type: 'container',
      props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
      children: [
        {
          id: 'node_dash_header',
          type: 'row',
          props: { className: 'items-center justify-between pb-2 border-b border-slate-200' },
          children: [
            {
              id: 'node_dash_title_col',
              type: 'column',
              props: { flex: '1' },
              children: [
                {
                  id: 'node_dash_title',
                  type: 'text',
                  props: {
                    text: 'Unternehmens-Dashboard & Performance',
                    className: 'text-2xl font-bold text-slate-900'
                  }
                },
                {
                  id: 'node_dash_subtitle',
                  type: 'text',
                  props: {
                    text: 'Echtzeit-Übersicht aller wichtigen Kennzahlen, Projekte und offener Vorgänge.',
                    className: 'text-sm text-slate-500 mt-1'
                  }
                }
              ]
            },
            {
              id: 'node_dash_actions',
              type: 'action_group',
              props: {
                actions: [
                  { label: 'Daten aktualisieren', icon: 'RefreshCw', variant: 'secondary', actionType: 'refresh' },
                  { label: 'Bericht erstellen', icon: 'Plus', variant: 'primary', actionType: 'custom' }
                ]
              }
            }
          ]
        },
        {
          id: 'node_dash_kpis',
          type: 'grid_layout',
          props: { columns: 4, gap: 4 },
          children: [
            {
              id: 'kpi_rev',
              type: 'kpi_widget',
              props: {
                label: 'Monatsumsatz',
                value: '184.250',
                unit: '€',
                trend: '+14.2%',
                trendDirection: 'up',
                trendLabel: 'vs. Vormonat',
                accentColor: 'indigo',
                icon: 'DollarSign'
              }
            },
            {
              id: 'kpi_customers',
              type: 'kpi_widget',
              props: {
                label: 'Aktive Kunden',
                value: '1.429',
                trend: '+28 neue',
                trendDirection: 'up',
                trendLabel: 'letzte 30 Tage',
                accentColor: 'emerald',
                icon: 'Users'
              }
            },
            {
              id: 'kpi_open',
              type: 'kpi_widget',
              props: {
                label: 'Offene Tickets',
                value: '23',
                trend: '-5 gelöst',
                trendDirection: 'down',
                trendLabel: 'Reaktionszeit < 2h',
                accentColor: 'amber',
                icon: 'Clock'
              }
            },
            {
              id: 'kpi_rate',
              type: 'kpi_widget',
              props: {
                label: 'Projektabschluss-Quote',
                value: '96.8',
                unit: '%',
                trend: '+1.5%',
                trendDirection: 'up',
                trendLabel: 'Ziel: 95%',
                accentColor: 'blue',
                icon: 'Award'
              }
            }
          ]
        },
        {
          id: 'node_search_bar',
          type: 'search_filter_bar',
          props: {
            placeholder: 'Nach Projekten, Kunden oder Belegnummern suchen...',
            showFilterTags: true,
            filterTags: ['Alle', 'Aktiv', 'In Prüfung', 'Abgeschlossen']
          }
        },
        {
          id: 'node_card_table',
          type: 'card',
          props: {
            title: 'Neueste Transaktionen & Vorgänge',
            className: 'p-4'
          },
          children: [
            {
              id: 'node_table_recent',
              type: 'table_view',
              props: {
                showSearch: true,
                showPagination: true,
                pageSize: 5
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'customer_detail_tabs',
    name: 'Kunden 360° Akte mit Subpages & Tabs',
    category: 'crm',
    description: 'Umfassende Kundenansicht mit Kontaktstammdaten, Rechnungsverlauf, Ansprechpartnern und Notizen.',
    icon: 'Users',
    layout: {
      id: 'root',
      type: 'container',
      props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
      children: [
        {
          id: 'node_card_header',
          type: 'card',
          props: { className: 'p-6 bg-slate-900 text-white border-none' },
          children: [
            {
              id: 'node_c_row',
              type: 'row',
              props: { className: 'items-center justify-between' },
              children: [
                {
                  id: 'node_c_info',
                  type: 'column',
                  props: { flex: '1' },
                  children: [
                    {
                      id: 'node_c_badge',
                      type: 'badge_pill',
                      props: { label: 'Premium Kunde (A-Rating)', colorScheme: 'emerald' }
                    },
                    {
                      id: 'node_c_name',
                      type: 'text',
                      props: {
                        text: '{{context.firma || "Bauunternehmen Heinrich & Söhne GmbH"}}',
                        className: 'text-2xl font-bold text-white mt-2'
                      }
                    },
                    {
                      id: 'node_c_sub',
                      type: 'text',
                      props: {
                        text: 'Kundennr: {{context.kundennr || "KD-2026-8812"}} | Branche: Hoch- & Tiefbau | München, DE',
                        className: 'text-sm text-slate-300 mt-1'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'node_crm_tabs',
          type: 'tabs_container',
          props: {
            defaultTab: 'tab_overview',
            tabs: [
              { id: 'tab_overview', label: 'Übersicht & Ansprechpartner', icon: 'Users' },
              { id: 'tab_orders', label: 'Aufträge & Angebote', icon: 'DollarSign' },
              { id: 'tab_subpage', label: 'Eingebundene Unterseite', icon: 'Layers' }
            ]
          },
          children: [
            {
              id: 'node_subform_contacts',
              type: 'subform',
              props: {
                title: 'Ansprechpartner & Kontakte',
                subtitle: 'Direkte Kontaktpersonen beim Kunden mit Telefon und E-Mail.',
                foreignKeyField: 'kunde_id',
                parentKeyField: 'id',
                allowAdd: true,
                allowDelete: true,
                allowEdit: true
              }
            }
          ]
        }
      ]
    }
  }
];

export const pagePresets = PAGE_PRESETS;
