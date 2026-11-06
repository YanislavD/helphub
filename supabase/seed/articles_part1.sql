-- More demo articles, part 1 of 2 (23 articles: Konten & Passwörter, Netzwerk & VPN, Drucker).
-- Run AFTER supabase/seed.sql (it needs the categories and the demo accounts for the author).
-- Safe to run twice: existing slugs are skipped. Afterwards press "Suchindex neu aufbauen" in the agent area.
-- The company, addresses and phone numbers are fictional.

insert into public.articles (title, slug, summary, content, category_id, tags, status, author_id)
select v.title, v.slug, v.summary, v.content,
       (select id from public.categories where slug = v.cat),
       v.tags::text[], 'published',
       (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
from (values

-- Konten & Passwörter ------------------------------------------------------------------------------
('Passwortmanager verwenden: Sichere Passwörter ohne Merken', 'passwortmanager-verwenden',
 'Ein Passwortmanager speichert deine Zugangsdaten verschlüsselt und erzeugt starke Passwörter. So nutzt du ihn richtig.',
 $md$Jedes Konto braucht ein eigenes, langes Passwort. Merken kann man sich das nicht – dafür gibt es **Passwortmanager**. Du merkst dir nur noch ein starkes Hauptpasswort.

## So gehst du vor

1. Frage das IT-Team nach dem **freigegebenen Passwortmanager** und installiere ihn über das Unternehmensportal.
2. Lege ein langes **Hauptpasswort** fest, am besten einen Satz mit mehreren Wörtern.
3. Lass den Manager für neue Konten **zufällige Passwörter** erzeugen (mindestens 16 Zeichen).
4. Nutze die **Auto-Ausfüllen-Funktion**. Sie füllt Zugangsdaten nur auf der echten Webseite aus – ein Schutz vor gefälschten Seiten.

> [!WARNING]
> Gib dein Hauptpasswort niemals weiter und speichere es nicht in einer Datei oder auf einem Zettel am Arbeitsplatz.

## Dein Windows-Passwort

Dein Windows-Passwort für die Firmenanmeldung merkst du dir weiterhin selbst. Es ist die Ausnahme.$md$,
 'konten-passwoerter', '{Passwort,Passwortmanager,Sicherheit}'),

('Phishing-E-Mail erkennen und melden', 'phishing-erkennen-melden',
 'Eine E-Mail wirkt verdächtig? Woran du Phishing erkennst und was du sofort tun solltest.',
 $md$Bei **Phishing** versuchen Betrüger, mit gefälschten E-Mails an Passwörter oder Geld zu kommen. Sie wirken oft echt, haben aber typische Merkmale.

## Warnzeichen

- Der Absender passt nicht: Die **Adresse** sieht ähnlich aus, ist aber leicht verändert.
- **Zeitdruck** oder Drohungen („Ihr Konto wird in 24 Stunden gesperrt").
- Die Mail fordert dich auf, ein **Passwort einzugeben** oder einen **Anhang zu öffnen**.
- Links zeigen beim Darüberfahren mit der Maus ein **anderes Ziel** als im Text.

## Das tust du

1. **Nicht klicken**, keinen Anhang öffnen, nichts antworten.
2. Wähle in Outlook **Melden** und dann **Phishing**, oder leite die Mail an `it-support@mueller-logistik.de` weiter.
3. Lösche die Mail danach.

> [!WARNING]
> Hast du schon auf einen Link geklickt oder ein Passwort eingegeben? Ruf **sofort** das IT-Team an (Telefon **1234**) und ändere dein Passwort.$md$,
 'konten-passwoerter', '{Phishing,Sicherheit,E-Mail,Betrug}'),

('Authenticator-App auf ein neues Smartphone übertragen', 'authenticator-neues-handy',
 'Neues Handy in Sicht? So nimmst du die Authenticator-App mit, ohne dich auszusperren.',
 $md$Die Authenticator-App ist dein zweiter Faktor bei der Anmeldung. Wechselst du das Smartphone, musst du sie **vorher** übertragen.

## Mit dem alten Handy

1. Installiere die **Microsoft Authenticator**-App auf dem neuen Gerät.
2. Öffne die App auf dem **alten Handy** und tippe auf **Einstellungen**, dann **Cloud-Sicherung** (iPhone: iCloud-Sicherung) und schalte sie ein.
3. Melde dich in der App auf dem neuen Handy mit **demselben Konto** an und wähle **Aus Sicherung wiederherstellen**.
4. Teste die Anmeldung am PC, bevor du das alte Handy zurücksetzt.

> [!WARNING]
> Setze das alte Handy erst zurück, wenn die Anmeldung mit dem neuen Gerät funktioniert hat.

## Das alte Handy ist schon weg?

Dann kannst du den zweiten Faktor nicht selbst erneuern. Ruf das IT-Team an (Telefon **1234**): Nach einer kurzen Identitätsprüfung setzen wir ihn zurück.$md$,
 'konten-passwoerter', '{Authenticator,MFA,Smartphone,Handywechsel}'),

('Windows Hello: PIN einrichten oder zurücksetzen', 'windows-hello-pin',
 'Mit einer PIN meldest du dich schneller am Laptop an. So richtest du sie ein oder setzt sie zurück.',
 $md$Die **PIN** von Windows Hello gilt nur auf diesem einen Gerät. Sie ist kürzer als das Passwort, aber sicher, weil sie nicht übers Netz geschickt wird.

## PIN einrichten

1. Öffne **Einstellungen**, **Konten**, **Anmeldeoptionen**.
2. Wähle **PIN (Windows Hello)** und klicke auf **Einrichten**.
3. Bestätige mit deinem Windows-Passwort und gib die neue **PIN** zweimal ein.

## PIN vergessen

1. Klicke auf dem Anmeldebildschirm auf **Ich habe meine PIN vergessen**.
2. Bestätige deine Identität (Passwort und Code aus der Authenticator-App).
3. Vergib eine neue PIN.

> [!NOTE]
> Die PIN ersetzt dein Passwort nicht. Ändert sich dein Passwort, bleibt die PIN gültig.$md$,
 'konten-passwoerter', '{PIN,Windows Hello,Anmeldung}'),

('Verdächtige Anmeldung gemeldet: Was tun?', 'verdaechtige-anmeldung',
 'Du bekommst eine Nachricht über eine neue Anmeldung, die nicht von dir war? So reagierst du richtig.',
 $md$Manchmal meldet das System: „Neue Anmeldung bei deinem Konto" oder du bekommst einen **Code, den du nicht angefordert hast**. Das kann ein Hinweis sein, dass jemand dein Passwort kennt.

## Sofort

1. **Bestätige keine** Anmeldeanfrage in der Authenticator-App, die du nicht selbst gestartet hast. Tippe auf **Ablehnen**.
2. Ändere dein Passwort über `passwort.mueller-logistik.de`.
3. Rufe das IT-Team an (Telefon **1234**) und nenne uns Uhrzeit und Ort der Meldung.

## Danach

- Prüfe, ob du das gleiche Passwort **anderswo** benutzt hast, und ändere es auch dort.
- Wir sperren bei Bedarf alle Sitzungen und prüfen dein Konto.

> [!NOTE]
> Eine abgelehnte Anfrage ist nie ein Fehler. Lieber einmal zu oft ablehnen als einmal zu wenig.$md$,
 'konten-passwoerter', '{Sicherheit,Anmeldung,Verdacht,MFA}'),

('Bildschirm sperren: Warum und wie', 'bildschirm-sperren',
 'Wer seinen Arbeitsplatz verlässt, sperrt den Bildschirm. Das geht in einer Sekunde.',
 $md$Ein ungesperrter Computer ist offen für alle, die vorbeigehen – auch im Lager oder am Empfang. Deshalb sperrst du ihn **jedes Mal**, wenn du dich entfernst.

## So sperrst du

- Drücke `Windows` + `L`.
- Oder klicke auf das **Startmenü**, dann auf deinen Namen und **Sperren**.

## Automatische Sperre

Nach etwa fünf Minuten ohne Eingabe sperrt sich der Bildschirm von selbst. Das ist Vorgabe der Firma und lässt sich nicht verlängern.

> [!TIP]
> Auch dein Smartphone mit Firmen-E-Mail sollte eine **Bildschirmsperre** (PIN oder Fingerabdruck) haben.

Vertrauliche Unterlagen gehören nach Feierabend in den abschließbaren Schrank.$md$,
 'konten-passwoerter', '{Sicherheit,Sperren,Arbeitsplatz}'),

('Erste Anmeldung für neue Mitarbeitende', 'erste-anmeldung',
 'Dein erster Arbeitstag: So meldest du dich zum ersten Mal an und richtest alles ein.',
 $md$Willkommen im Team! Für den Start brauchst du **drei Dinge**: deine Zugangsdaten, dein Smartphone und etwa 15 Minuten.

## Schritt für Schritt

1. Melde dich am Laptop mit dem **Startpasswort** an, das du von deiner Teamleitung bekommen hast.
2. Windows fordert dich auf, ein **eigenes Passwort** zu vergeben (mindestens 12 Zeichen).
3. Richte die **Authenticator-App** auf deinem Smartphone ein (siehe Artikel zur Zwei-Faktor-Authentifizierung).
4. Öffne **Outlook** und **Teams** und melde dich mit deiner Firmen-E-Mail-Adresse an.
5. Registriere dich in **HelpHub** – hier findest du Antworten auf die meisten IT-Fragen.

> [!NOTE]
> Das Startpasswort gilt nur für die erste Anmeldung. Gib es nicht weiter und schreibe es nicht auf.

Klappt etwas nicht, ruf uns an: Telefon **1234**.$md$,
 'konten-passwoerter', '{Onboarding,Anmeldung,Neue Mitarbeitende}'),

('Zugriff auf eine SharePoint-Seite beantragen', 'zugriff-sharepoint-beantragen',
 'Du siehst „Zugriff verweigert" auf einer Teamseite? So fragst du die Berechtigung an.',
 $md$Wenn SharePoint die Meldung **„Zugriff verweigert"** zeigt, hast du für diese Seite noch keine Berechtigung. Das ist normal und schnell erledigt.

## So beantragst du Zugriff

1. Klicke auf der Fehlerseite auf **Zugriff anfordern**.
2. Schreibe kurz, **wofür** du den Zugriff brauchst.
3. Klicke auf **Senden**. Die Anfrage geht an den Besitzer der Seite, meist die Teamleitung.

## Dauert es länger?

- Frage direkt bei der **Teamleitung** nach, sie kann die Anfrage freigeben.
- Bleibt die Anfrage nach zwei Arbeitstagen offen, erstelle ein **Ticket** mit dem Link zur Seite.

> [!NOTE]
> Das IT-Team vergibt solche Rechte nicht von sich aus. Es entscheidet immer der Besitzer der Seite.$md$,
 'konten-passwoerter', '{SharePoint,Zugriff,Berechtigung}'),

-- Netzwerk & VPN ------------------------------------------------------------------------------------
('WLAN verbunden, aber kein Internet', 'wlan-kein-internet',
 'Das WLAN-Symbol zeigt „Verbunden", doch keine Seite lädt? Diese Schritte bringen dich wieder online.',
 $md$Verbunden mit dem WLAN heißt noch nicht, dass auch das Internet erreichbar ist. Prüfe es in dieser Reihenfolge.

## Schnelle Hilfe

1. **Flugmodus** an- und wieder ausschalten (Windows-Taste + `A`).
2. Klicke auf das WLAN-Symbol, wähle dein Netzwerk und **Trennen**, dann **Verbinden**.
3. Prüfe mit dem Smartphone, ob **andere Geräte** im selben WLAN ins Internet kommen. Wenn nicht, liegt es am Router oder der Leitung.
4. **Starte den Laptop neu.**

## Im Büro

Funktioniert es nur bei dir nicht, öffne die Eingabeaufforderung und führe aus:

```
ipconfig /release
ipconfig /renew
```

## Im Homeoffice

Starte den **Router** neu (Netzstecker 30 Sekunden ziehen). Hilft das nicht, prüfe die Störungsmeldungen deines Internetanbieters.

> [!TIP]
> Zeigt der Laptop „Kein Internet", das Smartphone aber schon, hilft oft **„Netzwerk vergessen"** und die neue Anmeldung.$md$,
 'netzwerk-vpn', '{WLAN,Internet,Verbindung}'),

('VPN-Client installieren und einrichten', 'vpn-einrichten',
 'So richtest du das VPN auf deinem Firmenlaptop ein, damit du von zu Hause auf Firmendaten zugreifen kannst.',
 $md$Das **VPN** verbindet deinen Laptop über das Internet sicher mit dem Firmennetz. Auf Firmenlaptops ist der Client meist schon vorinstalliert.

## Einrichtung

1. Suche im Startmenü nach **VPN-Client**. Ist er nicht da, installiere ihn aus dem **Unternehmensportal**.
2. Starte den Client und wähle das Profil **Müller Logistik**.
3. Melde dich mit deinen Firmen-Zugangsdaten an.
4. Bestätige die Anmeldung mit dem **Code aus der Authenticator-App**.
5. Der Client zeigt **Verbunden** an. Jetzt erreichst du Netzlaufwerke, Intranet und Drucker.

> [!NOTE]
> Starte das VPN, **bevor** du auf Netzlaufwerke zugreifst und bevor du dich nach einem Passwortwechsel anmeldest.

## Es klappt nicht?

Lies den Artikel „VPN verbindet nicht – Fehlercode 809 beheben" oder erstelle ein Ticket mit der Fehlermeldung.$md$,
 'netzwerk-vpn', '{VPN,Einrichten,Homeoffice}'),

('VPN trennt sich ständig', 'vpn-trennt-staendig',
 'Die VPN-Verbindung bricht nach einigen Minuten ab? Meist liegt es an der Internetverbindung oder am Energiesparmodus.',
 $md$Wenn das VPN immer wieder abbricht, ist selten das VPN selbst schuld. Die häufigsten Gründe sind eine **instabile Verbindung** und der **Energiesparmodus**.

## Prüfe zuerst

1. **Signal:** Gehe näher an den WLAN-Router oder verbinde den Laptop per **Netzwerkkabel**.
2. **Energie:** Schließe das Netzteil an. Im Akkubetrieb schaltet Windows manchmal die WLAN-Karte ab.
3. **Andere Programme:** Schließe große Downloads oder Cloud-Synchronisationen.
4. **Neu starten:** VPN-Client beenden, Laptop neu starten, neu verbinden.

## Weitere Ursachen

- Nach längerer Inaktivität trennt das VPN die Verbindung automatisch. Das ist gewollt – verbinde dich einfach neu.
- Viele Heimrouter beenden Verbindungen, die lange nichts senden. Ein Neustart des Routers hilft oft.

> [!TIP]
> Tritt das Problem nur zu bestimmten Uhrzeiten auf, notiere sie und nenne sie im Ticket.$md$,
 'netzwerk-vpn', '{VPN,Verbindungsabbruch,Homeoffice}'),

('Netzwerkkabel: Verbindung prüfen', 'netzwerkkabel-pruefen',
 'Der Anschluss per LAN-Kabel funktioniert nicht? So findest du den Fehler in wenigen Minuten.',
 $md$Ein Netzwerkkabel ist stabiler als WLAN. Wenn es nicht funktioniert, liegt es meist am Kabel oder am Anschluss.

## Prüfen

1. Schau auf die **Leuchten am Netzwerkanschluss** des Laptops oder der Dockingstation. Leuchtet nichts, besteht keine Verbindung.
2. Stecke das Kabel an beiden Enden **fest** ein, bis es einrastet.
3. Probiere ein **anderes Kabel** und eine **andere Netzwerkdose**.
4. Schalte das WLAN kurz aus, damit Windows eindeutig das Kabel nutzt.
5. Starte den Laptop neu.

## Weiter?

Ist in den Netzwerkeinstellungen ein Symbol mit „Nicht identifiziertes Netzwerk" zu sehen, melde das mit **Dosenbezeichnung** (steht auf einem Aufkleber an der Wanddose) per Ticket.

> [!NOTE]
> Stecke niemals unbekannte Geräte (Router, Switch) in eine Netzwerkdose. Das stört das Firmennetz.$md$,
 'netzwerk-vpn', '{LAN,Netzwerkkabel,Verbindung}'),

('Webseite nicht erreichbar: Das kannst du prüfen', 'dns-problem-webseite',
 'Nur eine bestimmte Webseite lädt nicht? Mit diesen Schritten findest du heraus, wo das Problem liegt.',
 $md$Lädt **nur eine** Seite nicht, aber andere schon, ist meist die Seite selbst oder die Namensauflösung (DNS) betroffen.

## Prüfen

1. Probiere die Seite in einem **anderen Browser** und in einem **privaten Fenster**.
2. Teste sie mit dem **Smartphone im mobilen Netz**. Funktioniert sie dort, liegt es an deiner Verbindung. Wenn nicht, ist die Seite selbst gestört.
3. Leere den DNS-Zwischenspeicher. Öffne die Eingabeaufforderung und führe aus:

```
ipconfig /flushdns
```

4. Starte den Browser neu und versuche es nochmal.

> [!NOTE]
> Manche Seiten sind aus Sicherheitsgründen im Firmennetz gesperrt, zum Beispiel Streaming oder Spiele. Siehst du eine Sperrseite, ist das Absicht.

Brauchst du die Seite beruflich, erstelle ein Ticket mit der **Adresse** und dem Grund.$md$,
 'netzwerk-vpn', '{DNS,Webseite,Browser,Internet}'),

('Netzlaufwerk ist sehr langsam', 'netzlaufwerk-langsam',
 'Dateien auf dem Netzlaufwerk öffnen sich nur zäh? Mit diesen Tipps arbeitest du wieder flüssig.',
 $md$Netzlaufwerke sind abhängig von deiner Verbindung. Im Büro ist sie meist schnell, per VPN deutlich langsamer.

## Das hilft sofort

1. Prüfe, ob du per **LAN-Kabel** oder **VPN** verbunden bist. Per Kabel im Büro geht es am schnellsten.
2. Öffne nicht Ordner mit **tausenden Dateien** auf einmal, sondern gehe direkt in den Unterordner.
3. Kopiere große Dateien **zuerst auf deinen Laptop**, arbeite lokal und kopiere sie danach zurück.
4. Schließe die Datei, wenn du sie nicht mehr brauchst. Offene Dateien belasten die Verbindung.

## Immer noch langsam?

Erstelle ein Ticket mit diesen Angaben:

- **Pfad** des Laufwerks oder Ordners (zum Beispiel `\\fs01\abteilung`),
- Uhrzeit, wann es langsam war,
- ob du im **Büro oder per VPN** warst.

> [!TIP]
> Große Dateien wie Videos gehören nicht auf das Abteilungslaufwerk, sondern in die dafür vorgesehene Ablage.$md$,
 'netzwerk-vpn', '{Netzlaufwerk,langsam,Dateiserver}'),

('Remotedesktop: Auf den Büro-PC zugreifen', 'remotedesktop-buero-pc',
 'Arbeite von zu Hause so, als säßest du am Büro-PC. So richtest du den Remotedesktop ein.',
 $md$Mit der **Remotedesktopverbindung** steuerst du deinen Büro-PC von zu Hause aus. Voraussetzung: Der PC ist **eingeschaltet** und nicht im Ruhezustand.

## So verbindest du dich

1. Starte das **VPN** und warte auf „Verbunden".
2. Öffne das Startmenü und suche nach **Remotedesktopverbindung**.
3. Gib den **Namen deines Büro-PCs** ein. Er steht auf einem Aufkleber am Gerät, zum Beispiel `PC-12345`.
4. Klicke auf **Verbinden** und melde dich mit deinen Firmen-Zugangsdaten an.

## Gut zu wissen

- Der PC im Büro **sperrt sich**, solange du verbunden bist. Das ist normal.
- Hast du den Namen vergessen, frag die Kollegen im Büro oder erstelle ein Ticket.
- Ist der PC im Ruhezustand, kannst du ihn nicht aus der Ferne wecken. Lass ihn am Feierabend **eingeschaltet** und nur gesperrt, wenn du plötzlich von zu Hause arbeiten willst.

> [!WARNING]
> Melde dich nach der Arbeit mit **Abmelden** ab, statt nur das Fenster zu schließen.$md$,
 'netzwerk-vpn', '{Remotedesktop,Homeoffice,VPN}'),

('Im Hotel oder Zug arbeiten: WLAN mit Anmeldeseite', 'hotel-wlan-anmeldeseite',
 'Öffentliches WLAN verlangt eine Anmeldung? So verbindest du dich sicher und startest danach das VPN.',
 $md$Hotel-, Bahn- und Café-WLANs zeigen oft erst eine **Anmeldeseite**. Bis du sie bestätigt hast, hast du kein Internet.

## So gehst du vor

1. Verbinde dich mit dem WLAN.
2. Öffne den Browser. Erscheint keine Seite automatisch, rufe `http://neverssl.com` auf.
3. Gib den Code oder die Zimmernummer ein und **akzeptiere die Bedingungen**.
4. Starte **danach** das VPN.

> [!WARNING]
> Arbeite in öffentlichen WLANs **nie** ohne VPN mit Firmendaten.

## Klappt es nicht?

- Verbinde dich mit dem **Hotspot deines Smartphones** (siehe Artikel zum Hotspot).
- Das VPN bricht manchmal in öffentlichen Netzen ab, weil sie Ports sperren. Der Hotspot umgeht das.$md$,
 'netzwerk-vpn', '{WLAN,Hotel,Reise,VPN}'),

-- Drucker -------------------------------------------------------------------------------------------
('Drucker ist offline: So bringst du ihn wieder online', 'drucker-offline',
 'Windows zeigt „Drucker offline"? Meist ist nur ein Häkchen oder die Verbindung schuld.',
 $md$Die Meldung **„Offline"** bedeutet nur, dass dein Laptop den Drucker gerade nicht erreicht. Oft ist der Drucker in Ordnung.

## Das hilft

1. Prüfe, ob du im **Firmennetz oder per VPN** bist.
2. Schaue am Drucker, ob er **eingeschaltet** ist und „Bereit" anzeigt.
3. Öffne **Einstellungen**, **Bluetooth & Geräte**, **Drucker & Scanner**, wähle den Drucker und öffne die **Druckwarteschlange**.
4. Klicke dort oben auf **Drucker** und entferne das Häkchen bei **Drucker offline verwenden**.
5. Drucke erneut.

## Immer noch offline?

- Starte den Drucker neu (30 Sekunden ausschalten).
- Entferne den Drucker und füge ihn neu hinzu, siehe „Drucker im Büro hinzufügen".

> [!TIP]
> Am Homeoffice-Drucker kann ein neues WLAN-Passwort der Grund sein: Verbinde den Drucker neu mit dem WLAN.$md$,
 'drucker', '{Drucker,offline,Verbindung}'),

('Druckqualität schlecht: Streifen und Flecken', 'druckqualitaet-streifen',
 'Der Ausdruck hat Streifen, ist blass oder verschmiert? Das sind die häufigsten Ursachen.',
 $md$Schlechte Druckqualität hat meist eine einfache Ursache.

## Prüfen

1. Zeigt das Display **„Toner niedrig"**? Dann ist die Tonerkartusche fast leer. Siehe „Toner wechseln".
2. Schüttle die Kartusche **nicht**, wenn sie noch Toner hat. Das verteilt ihn nur ungleichmäßig.
3. Öffne im Druckmenü **Wartung** und starte die **Druckkopf-** oder **Walzenreinigung** (je nach Gerät).
4. Verwende **glattes, trockenes Papier**. Feuchtes Papier verschmiert.
5. Drucke eine **Testseite**, um zu sehen, ob das Problem bleibt.

## Typische Muster

- **Senkrechte Streifen:** Trommel oder Kartusche verschmutzt oder defekt.
- **Blasse Stellen:** Toner fast leer.
- **Verschmiert:** Papier zu feucht oder Fixiereinheit defekt.

> [!WARNING]
> Öffne den Drucker nicht weiter, als im Menü beschrieben. Die Fixiereinheit wird sehr heiß.

Hilft nichts, erstelle ein Ticket mit einem **Foto des Ausdrucks**.$md$,
 'drucker', '{Drucker,Druckqualität,Toner}'),

('Toner wechseln: Schritt für Schritt', 'toner-wechseln',
 'Die Tonerkartusche ist leer? So tauschst du sie in zwei Minuten, ohne dich schmutzig zu machen.',
 $md$Wenn das Display **„Toner leer"** zeigt, tauschst du die Kartusche selbst. Neue Kartuschen liegen in der Büroversorgung bereit.

## So geht es

1. Schalte den Drucker **nicht aus** – er erkennt den Wechsel selbst.
2. Öffne die **vordere Klappe** oder die Tonerabdeckung.
3. Ziehe die **alte Kartusche** vorsichtig und gerade heraus. Halte sie waagerecht, damit kein Toner herausfällt.
4. Entferne bei der **neuen Kartusche** die Schutzfolie und alle Transportstreifen.
5. Schiebe sie in den Schacht, bis sie **einrastet**.
6. Schließe die Klappe. Der Drucker braucht ein paar Sekunden.

> [!WARNING]
> Verschütteter Toner nicht wegpusten oder mit warmem Wasser abwischen. Nimm ein **feuchtes Tuch** (kaltes Wasser).

Die alte Kartusche gehört in die **Sammelbox** zur Rückgabe an den Hersteller, nicht in den Hausmüll. Ist keine Ersatzkartusche da, sag der Büroversorgung Bescheid.$md$,
 'drucker', '{Toner,Drucker,Verbrauchsmaterial}'),

('Doppelseitig drucken und heften', 'doppelseitig-drucken',
 'Papier sparen und professionell wirken: So druckst du beidseitig und lässt Stapel heften.',
 $md$Beidseitiges Drucken spart Papier. Die Einstellung findest du im Druckdialog.

## Beidseitig drucken

1. Öffne die Datei und drücke `Strg` + `P`.
2. Wähle den Drucker.
3. Stelle bei **Einseitig drucken** auf **Beidseitig drucken (Wenden an der langen Kante)**.
4. Klicke auf **Drucken**.

## Heften

Viele Multifunktionsgeräte heften automatisch:

1. Klicke im Druckdialog auf **Druckereigenschaften**.
2. Wähle bei **Fertigstellung** die Option **Heften**.

## Standard festlegen

Willst du immer beidseitig drucken, öffne **Einstellungen**, **Drucker & Scanner**, den Drucker, **Druckeinstellungen** und speichere dort die Option.

> [!TIP]
> Bei Präsentationen drucke mehrere Folien pro Seite („Handzettel"), das spart noch mehr Papier.$md$,
 'drucker', '{Drucken,Doppelseitig,Papier,Heften}'),

('Vom Smartphone drucken', 'drucken-smartphone',
 'Ein Dokument liegt nur auf dem Handy? So bringst du es auf Papier.',
 $md$Direktes Drucken vom Smartphone ist aus Sicherheitsgründen nicht eingerichtet. Mit einem Umweg geht es trotzdem.

## So geht es

1. Öffne das Dokument auf dem Handy und wähle **Teilen**.
2. Sende es per **E-Mail an dich selbst** oder speichere es in **OneDrive**.
3. Öffne es am **Laptop** und drucke es mit `Strg` + `P`.

## Gut zu wissen

- Das funktioniert auch mit Fotos und PDFs.
- Vertrauliche Dokumente schickst du nur über deine **Firmen-E-Mail-Adresse**, nie über private Konten oder Messenger.

> [!NOTE]
> Hast du keinen Laptop zur Hand, hilft oft ein Kollege. Frage, bevor du Dokumente an fremde Geräte schickst.$md$,
 'drucker', '{Smartphone,Drucken,OneDrive}'),

('Drucker meldet „Papier leer", obwohl Papier da ist', 'papier-leer-fehler',
 'Das Papierfach ist voll, aber der Drucker sagt „Papier leer"? Meist ist das Fach nur nicht richtig geschlossen.',
 $md$Der Drucker erkennt Papier über Sensoren. Sind sie verdeckt oder das Fach nicht ganz geschlossen, meldet er einen Fehler.

## Prüfen

1. Ziehe das **Papierfach** komplett heraus und schiebe es **fest** wieder ein, bis es einrastet.
2. Prüfe, ob das Papier **gerade** liegt und die **Führungen** (die seitlichen Schieber) sanft am Stapel anliegen, nicht zu eng.
3. Lege **nicht zu viel Papier** ein. Beachte die Markierung im Fach.
4. Entferne Papierreste vom Boden und von den Einzugsrollen.
5. Prüfe im Druckmenü, ob das richtige **Papierformat** und das richtige **Fach** eingestellt sind (zum Beispiel A4, Fach 1).

## Immer noch?

Wähle im Druckdialog ein anderes Fach oder nutze den **Einzelblatteinzug**. Hilft nichts, erstelle ein Ticket mit Gerätename und Fehlermeldung.$md$,
 'drucker', '{Papier,Drucker,Fehlermeldung}'),

('Etikettendrucker im Lager druckt leere Etiketten', 'etikettendrucker-leer',
 'Die Etiketten kommen leer aus dem Drucker? Meist liegt die Rolle falsch herum oder der Sensor braucht eine Einmessung.',
 $md$Etikettendrucker arbeiten im Lager täglich und sind empfindlich bei Rolle und Sensor.

## Prüfen

1. Ist der Drucker ein **Thermodirekt-Drucker**? Dann muss die **bedruckbare, glatte Seite** der Rolle zum Druckkopf zeigen. Ist sie falsch herum, bleiben die Etiketten leer.
2. Prüfe, ob die Rolle **zum Drucker passt** (Breite, Art der Etiketten).
3. Reinige den **Druckkopf** vorsichtig mit einem Reinigungsstift (Isopropanol), wenn er verschmutzt ist.
4. **Messe den Etikettensensor neu ein.** Das geht meist durch längeres Drücken der **Vorschub-Taste** (FEED), bis mehrere Etiketten durchlaufen.
5. Starte den Drucker neu und drucke ein Etikett.

> [!WARNING]
> Berühre den Druckkopf nicht mit den Fingern und benutze keine spitzen Gegenstände.

Hilft das nicht, erstelle ein Ticket mit **Gerätenummer** und **Standort**.$md$,
 'drucker', '{Etikettendrucker,Lager,Etiketten}'),

-- end of part 1 ------------------------------------------------------------------------------------
('Zertifikatswarnung im Browser verstehen', 'zertifikatswarnung-browser',
 'Der Browser warnt: „Die Verbindung ist nicht privat". Wann du weitermachen darfst und wann nicht.',
 $md$Eine **Zertifikatswarnung** bedeutet, dass der Browser die Identität der Webseite nicht sicher überprüfen kann.

## Das tust du

1. **Prüfe die Adresse** in der Adresszeile. Ein Tippfehler führt oft auf eine falsche Seite.
2. Prüfe **Datum und Uhrzeit** deines Laptops. Stimmt die Uhr nicht, hält der Browser Zertifikate für abgelaufen.
3. Verbinde dich per **Hotspot** oder anderes Netz. In Hotel-WLANs lösen Anmeldeseiten die Warnung oft aus.
4. Lade die Seite neu.

> [!WARNING]
> Klicke **nicht** auf „Trotzdem fortfahren", wenn du ein Passwort eingeben oder Zahlungen tätigen sollst.

## Interne Seiten

Betrifft die Warnung eine **Firmen-Webseite**, erstelle ein Ticket mit Adresse und Screenshot. Wir erneuern das Zertifikat.$md$,
 'netzwerk-vpn', '{Browser,Zertifikat,Sicherheit}')

) as v(title, slug, summary, content, cat, tags)
on conflict (slug) do nothing;
