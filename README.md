# Kontrollkort QFSV

Svensk mobilanpassad webbapp baserad på det bifogade 24-sidiga kontrollkortet. Kräver Node.js 20 eller senare. Inga externa paket eller externa webbtjänster behövs.

## Kör lokalt

```sh
cd /workspace/Kontrollkort-QFSV
npm start
```

Servern använder port 3000 (eller miljövariabeln PORT). `npm test` kör tester av fordonens kontroll- och utrustningsdata. Ingen byggprocess krävs.

## Funktioner

- Elva fordon med bilder och registrerings-/maskinnummer från PDF-underlaget.
- Förare, datum, daglig tillsyn, valfri veckokontroll och extrautrustning.
- Alkolås och fordonsstatus för lastbil/bil, service, reparation, inspektion och mätarställning.
- Obligatoriska svar, kommentar vid reparationsbehov för utrustning, granskning före sparande.
- Automatiskt lokalt utkast, historik, textexport, JSON-export och utskrift/PDF.

## Avgränsningar och tolkningar

All lagring sker i localStorage i aktuell webbläsare. Det finns ingen serverdatabas, inloggning, synkronisering eller automatisk avisering till arbetsledningen. Rensad webbläsardata tar bort korten. Exportera regelbundet; JSON-import ingår inte ännu. Servern är avsedd för utveckling och ska inte exponeras som produktionssystem för personuppgifter.

PDF:ens hoppanvisningar är delvis motsägelsefulla (bland annat New Holland, Scania och truckar). Appen använder ett sammanhängande flöde: fordonsanpassad daglig tillsyn, valfri veckokontroll, valfri utrustning från valt utrustningsfordon, alkolås/fordonsstatus för bil och lastbil, sedan service och mätarställning. Uppgifter om service leder inte förbi frågan om mätarställning. För lastbil används fordonsstatus eftersom underlaget saknar separat daglig lastbilsmatris. Utrustning för bil hanteras i fordonsstatus. Beteckningen LMW DCG200 12LB följer formulärtexten; bildens maskinnummer är Kalmar 8501. Några rader i PDF:en överlappar och utrustningsbeteckningar behöver stämmas av före verksamhetsbruk.

## Verifiering

Datatester körs med `npm test`. Ett webbläsartest i utvecklingsmiljön har verifierat Hako med daglig tillsyn, veckokontroll, utrustningsfel och mätarställning samt Scania med alkolåsservice, fordonsfel och reparation. Sparande, historik efter omladdning och mobilvy har kontrollerats.

## GitHub Pages

Appen använder relativa filsökvägar och fungerar under `/Kontrollkort-QFSV/`.

1. Lägg projektfilerna i GitHub-repot `ScaniaGOtaxi/Kontrollkort-QFSV` på grenen `main`, inklusive `.github/workflows/pages.yml`.
2. Öppna repots **Settings → Pages**. Välj **GitHub Actions** under **Build and deployment → Source**.
3. Öppna **Actions → Publicera Kontrollkort QFSV → Run workflow**, välj `main` och starta. Framtida ändringar på `main` publiceras automatiskt.
4. När körningen är grön visas den publicerade länken i körningen och under Settings → Pages. Förväntad standardadress: `https://scaniagotaxi.github.io/Kontrollkort-QFSV/`. Adressen är inte aktiv förrän publiceringen lyckats.

Endast `public/` publiceras som webbplats. Fordonsbilder och den inbyggda förarlistan blir tillgängliga för webbplatsens besökare. Kontrollkort och utkast stannar i respektive webbläsare. GitHub Pages tillgänglighet för privata repos beror på GitHub-abonnemanget. Ingen GitHub-publicering genomförs av lokal konfiguration.
