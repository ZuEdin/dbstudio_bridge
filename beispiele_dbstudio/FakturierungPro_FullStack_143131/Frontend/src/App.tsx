import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';

import { GlobalStateProvider } from './context/GlobalStateContext';
import { KundenList } from './pages/Kunden/KundenList';
import { KundenForm } from './pages/Kunden/KundenForm';
import { ArtikelList } from './pages/Artikel/ArtikelList';
import { ArtikelForm } from './pages/Artikel/ArtikelForm';
import { AngeboteList } from './pages/Angebote/AngeboteList';
import { AngebotspositionenList } from './pages/Angebotspositionen/AngebotspositionenList';
import { AuftraegeList } from './pages/Auftraege/AuftraegeList';
import { AuftragspositionenList } from './pages/Auftragspositionen/AuftragspositionenList';
import { RechnungenList } from './pages/Rechnungen/RechnungenList';
import { RechnungspositionenList } from './pages/Rechnungspositionen/RechnungspositionenList';
import { MahnungenList } from './pages/Mahnungen/MahnungenList';
import { GutschriftenList } from './pages/Gutschriften/GutschriftenList';
import { GutschriftpositionenList } from './pages/Gutschriftpositionen/GutschriftpositionenList';
import { RechnungserfassungForm } from './pages/forms/RechnungserfassungForm';
import { RechnungspositionenSubformForm } from './pages/forms/RechnungspositionenSubformForm';
import { AngebotserfassungForm } from './pages/forms/AngebotserfassungForm';
import { AngebotspositionenSubformForm } from './pages/forms/AngebotspositionenSubformForm';
import { AuftragserfassungForm } from './pages/forms/AuftragserfassungForm';
import { AuftragspositionenSubformForm } from './pages/forms/AuftragspositionenSubformForm';
import { MahnungserfassungForm } from './pages/forms/MahnungserfassungForm';
import { GutschrifterfassungForm } from './pages/forms/GutschrifterfassungForm';
import { GutschriftpositionenSubformForm } from './pages/forms/GutschriftpositionenSubformForm';
import { OffeneRechnungenMahnstufenQueryPage } from './pages/queries/OffeneRechnungenMahnstufenQueryPage';
import { RechnungsjournalUmsaetzeReportPage } from './pages/reports/RechnungsjournalUmsaetzeReportPage';



function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <GlobalStateProvider>
        
        
        <HashRouter>
            <Routes>
                <Route element={<Layout><Outlet /></Layout>}>
                    <Route path="/" element={
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Willkommen bei FakturierungPro</h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">Wählen Sie einen Eintrag aus dem Menü, um zu starten.</p>
                        </div>
                    } />
                    {/* Generated Routes */}
                    <Route path="/kunden" element={<KundenList />} />
                    <Route path="/kunden/new" element={<KundenForm />} />
                    <Route path="/kunden/:id" element={<KundenForm />} />
                    <Route path="/artikel" element={<ArtikelList />} />
                    <Route path="/artikel/new" element={<ArtikelForm />} />
                    <Route path="/artikel/:id" element={<ArtikelForm />} />
                    <Route path="/angebote" element={<AngeboteList />} />
                    <Route path="/angebotspositionen" element={<AngebotspositionenList />} />
                    <Route path="/auftraege" element={<AuftraegeList />} />
                    <Route path="/auftragspositionen" element={<AuftragspositionenList />} />
                    <Route path="/rechnungen" element={<RechnungenList />} />
                    <Route path="/rechnungspositionen" element={<RechnungspositionenList />} />
                    <Route path="/mahnungen" element={<MahnungenList />} />
                    <Route path="/gutschriften" element={<GutschriftenList />} />
                    <Route path="/gutschriftpositionen" element={<GutschriftpositionenList />} />
                    <Route path="/forms/rechnungserfassungForm/:id" element={<RechnungserfassungForm />} />
                    <Route path="/forms/rechnungserfassungForm" element={<RechnungserfassungForm />} />
                    <Route path="/forms/rechnungserfassungForm/new" element={<RechnungserfassungForm />} />
                    <Route path="/forms/rechnungserfassung" element={<RechnungserfassungForm />} />
                    <Route path="/forms/rechnungserfassung/:id" element={<RechnungserfassungForm />} />
                    <Route path="/form/f_rechnung" element={<RechnungserfassungForm />} />
                    <Route path="/form/f_rechnung/:id" element={<RechnungserfassungForm />} />
                    <Route path="/forms/f_rechnung" element={<RechnungserfassungForm />} />
                    <Route path="/forms/f_rechnung/:id" element={<RechnungserfassungForm />} />
                    <Route path="/forms/rechnungspositionensubformForm/:id" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/rechnungspositionensubformForm" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/rechnungspositionensubformForm/new" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/rechnungspositionenSubform" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/rechnungspositionenSubform/:id" element={<RechnungspositionenSubformForm />} />
                    <Route path="/form/f_rechnung_pos_sub" element={<RechnungspositionenSubformForm />} />
                    <Route path="/form/f_rechnung_pos_sub/:id" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/f_rechnung_pos_sub" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/f_rechnung_pos_sub/:id" element={<RechnungspositionenSubformForm />} />
                    <Route path="/forms/angebotserfassungForm/:id" element={<AngebotserfassungForm />} />
                    <Route path="/forms/angebotserfassungForm" element={<AngebotserfassungForm />} />
                    <Route path="/forms/angebotserfassungForm/new" element={<AngebotserfassungForm />} />
                    <Route path="/forms/angebotserfassung" element={<AngebotserfassungForm />} />
                    <Route path="/forms/angebotserfassung/:id" element={<AngebotserfassungForm />} />
                    <Route path="/form/f_angebot" element={<AngebotserfassungForm />} />
                    <Route path="/form/f_angebot/:id" element={<AngebotserfassungForm />} />
                    <Route path="/forms/f_angebot" element={<AngebotserfassungForm />} />
                    <Route path="/forms/f_angebot/:id" element={<AngebotserfassungForm />} />
                    <Route path="/forms/angebotspositionensubformForm/:id" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/angebotspositionensubformForm" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/angebotspositionensubformForm/new" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/angebotspositionenSubform" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/angebotspositionenSubform/:id" element={<AngebotspositionenSubformForm />} />
                    <Route path="/form/f_angebot_pos_sub" element={<AngebotspositionenSubformForm />} />
                    <Route path="/form/f_angebot_pos_sub/:id" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/f_angebot_pos_sub" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/f_angebot_pos_sub/:id" element={<AngebotspositionenSubformForm />} />
                    <Route path="/forms/auftragserfassungForm/:id" element={<AuftragserfassungForm />} />
                    <Route path="/forms/auftragserfassungForm" element={<AuftragserfassungForm />} />
                    <Route path="/forms/auftragserfassungForm/new" element={<AuftragserfassungForm />} />
                    <Route path="/forms/auftragserfassung" element={<AuftragserfassungForm />} />
                    <Route path="/forms/auftragserfassung/:id" element={<AuftragserfassungForm />} />
                    <Route path="/form/f_auftrag" element={<AuftragserfassungForm />} />
                    <Route path="/form/f_auftrag/:id" element={<AuftragserfassungForm />} />
                    <Route path="/forms/f_auftrag" element={<AuftragserfassungForm />} />
                    <Route path="/forms/f_auftrag/:id" element={<AuftragserfassungForm />} />
                    <Route path="/forms/auftragspositionensubformForm/:id" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/auftragspositionensubformForm" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/auftragspositionensubformForm/new" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/auftragspositionenSubform" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/auftragspositionenSubform/:id" element={<AuftragspositionenSubformForm />} />
                    <Route path="/form/f_auftrag_pos_sub" element={<AuftragspositionenSubformForm />} />
                    <Route path="/form/f_auftrag_pos_sub/:id" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/f_auftrag_pos_sub" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/f_auftrag_pos_sub/:id" element={<AuftragspositionenSubformForm />} />
                    <Route path="/forms/mahnungserfassungForm/:id" element={<MahnungserfassungForm />} />
                    <Route path="/forms/mahnungserfassungForm" element={<MahnungserfassungForm />} />
                    <Route path="/forms/mahnungserfassungForm/new" element={<MahnungserfassungForm />} />
                    <Route path="/forms/mahnungserfassung" element={<MahnungserfassungForm />} />
                    <Route path="/forms/mahnungserfassung/:id" element={<MahnungserfassungForm />} />
                    <Route path="/form/f_mahnung" element={<MahnungserfassungForm />} />
                    <Route path="/form/f_mahnung/:id" element={<MahnungserfassungForm />} />
                    <Route path="/forms/f_mahnung" element={<MahnungserfassungForm />} />
                    <Route path="/forms/f_mahnung/:id" element={<MahnungserfassungForm />} />
                    <Route path="/forms/gutschrifterfassungForm/:id" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/gutschrifterfassungForm" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/gutschrifterfassungForm/new" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/gutschrifterfassung" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/gutschrifterfassung/:id" element={<GutschrifterfassungForm />} />
                    <Route path="/form/f_gutschrift" element={<GutschrifterfassungForm />} />
                    <Route path="/form/f_gutschrift/:id" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/f_gutschrift" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/f_gutschrift/:id" element={<GutschrifterfassungForm />} />
                    <Route path="/forms/gutschriftpositionensubformForm/:id" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/gutschriftpositionensubformForm" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/gutschriftpositionensubformForm/new" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/gutschriftpositionenSubform" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/gutschriftpositionenSubform/:id" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/form/f_gutschrift_pos_sub" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/form/f_gutschrift_pos_sub/:id" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/f_gutschrift_pos_sub" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/forms/f_gutschrift_pos_sub/:id" element={<GutschriftpositionenSubformForm />} />
                    <Route path="/queries/offeneRechnungenMahnstufen" element={<OffeneRechnungenMahnstufenQueryPage />} />
                    <Route path="/query/q_offene_rechnungen" element={<OffeneRechnungenMahnstufenQueryPage />} />
                    <Route path="/queries/q_offene_rechnungen" element={<OffeneRechnungenMahnstufenQueryPage />} />
                    <Route path="/reports/rechnungsjournalUmsaetze" element={<RechnungsjournalUmsaetzeReportPage />} />
                    <Route path="/report/r_rechnungsjournal" element={<RechnungsjournalUmsaetzeReportPage />} />
                    <Route path="/reports/r_rechnungsjournal" element={<RechnungsjournalUmsaetzeReportPage />} />
                </Route>
            </Routes>
        </HashRouter>
        
        </GlobalStateProvider>
    </ThemeProvider>
  );
}
export default App;