-- More demo articles, part 2 of 2 (27 articles: Software, Hardware, E-Mail & Teams).
-- Run AFTER supabase/seed.sql (it needs the categories and the demo accounts for the author).
-- Safe to run twice: existing slugs are skipped. Afterwards press "Suchindex neu aufbauen" in the agent area.
-- The company, addresses and phone numbers are fictional.

insert into public.articles (title, slug, summary, content, category_id, tags, status, author_id)
select v.title, v.slug, v.summary, v.content,
       (select id from public.categories where slug = v.cat),
       v.tags::text[], 'published',
       (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
from (values

-- Software ------------------------------------------------------------------------------------------
('Programm reagiert nicht: Beenden und neu starten', 'programm-reagiert-nicht',
 'Ein Fenster friert ein und „Keine Rückmeldung" erscheint? So beendest du das Programm und rettest deine Arbeit.',
 $md$Wenn ein Programm einfriert, hilft meist **Warten und Beenden**. Warte zuerst ein bis zwei Minuten, denn große Dateien brauchen manchmal Zeit.

## Programm beenden

1. Drücke `Strg` + `Umschalt` + `Esc`. Der **Task-Manager** öffnet sich.
2. Suche das Programm in der Liste, es ist mit „Keine Rückmeldung" markiert.
3. Klicke es an und wähle **Task beenden**.
4. Starte das Programm neu.

## Ungespeicherte Arbeit

- **Word, Excel und PowerPoint** bieten nach dem Neustart die **Wiederherstellung** der letzten automatisch gespeicherten Version an.
- Speichere Dateien auf **OneDrive** oder dem Netzlaufwerk, dann sind Änderungen oft schon gesichert.

> [!TIP]
> Passiert das Problem immer wieder bei demselben Programm, starte den Laptop neu und installiere offene Windows-Updates. Hilft das nicht, erstelle ein Ticket mit dem Programmnamen.$md$,
 'software', '{Programm,Absturz,Task-Manager}'),

('Excel: Datei ist gesperrt oder wird verwendet', 'excel-datei-gesperrt',
 'Excel meldet, die Datei sei gesperrt, weil jemand anderes sie geöffnet hat? So löst du die Sperre.',
 $md$Excel sperrt eine Datei, solange sie jemand bearbeitet. Das schützt vor widersprüchlichen Änderungen.

## Wer hat sie offen?

Die Meldung nennt meist den **Namen**. Bitte die Person, die Datei zu **schließen**. Danach kannst du sie bearbeiten.

## Niemand hat sie offen?

1. Schließe Excel komplett und öffne die Datei neu.
2. Starte den Laptop neu. Manchmal hängt noch eine alte Sitzung.
3. Liegt die Datei im Netzlaufwerk und du warst im VPN, das abgebrochen ist: Verbinde das VPN neu und warte einige Minuten.

## Gemeinsam arbeiten

Lege die Datei auf **OneDrive** oder in **Teams** ab. Dort können mehrere Personen **gleichzeitig** in einer Excel-Datei arbeiten.

> [!NOTE]
> Bleibt die Sperre bestehen, erstelle ein Ticket mit dem **Pfad** der Datei. Wir können die Sperre auf dem Dateiserver aufheben.$md$,
 'software', '{Excel,Datei gesperrt,OneDrive}'),

('Excel ist langsam: Tipps für große Tabellen', 'excel-langsam',
 'Excel braucht ewig zum Öffnen oder Rechnen? Diese Maßnahmen bringen spürbar Tempo.',
 $md$Große Tabellen mit vielen Formeln und Verknüpfungen machen Excel schwerfällig. Mit wenigen Eingriffen wird es schneller.

## Schnelle Hilfe

1. **Automatische Berechnung** vorübergehend ausschalten: Registerkarte **Formeln**, **Berechnungsoptionen**, **Manuell**. Mit `F9` rechnest du bei Bedarf neu.
2. Lösche **leere Zeilen und Spalten** am Dateiende: Markiere sie, rechtsklicke und wähle **Löschen**, speichere die Datei.
3. Entferne **nicht benötigte Formatierungen** und Bilder.
4. Öffne die Datei lokal statt über das Netzlaufwerk oder VPN.
5. Schließe andere große Programme.

## Zu viele Formeln

Ersetze Formeln, die sich nicht mehr ändern, durch **Werte**: Kopieren, **Einfügen**, **Werte einfügen**.

> [!TIP]
> Das Speichern im Format `.xlsb` (Excel-Binärarbeitsmappe) macht große Dateien deutlich kleiner und schneller.$md$,
 'software', '{Excel,langsam,Performance}'),

('PDF-Dateien bearbeiten, zusammenfügen und unterschreiben', 'pdf-bearbeiten',
 'Mit Bordmitteln Seiten ordnen, Texte ergänzen und Dokumente unterschreiben, ohne zusätzliche Software.',
 $md$Für einfache Aufgaben brauchst du keine teure PDF-Software.

## PDF im Browser öffnen

Rechtsklicke die PDF-Datei, wähle **Öffnen mit** und **Microsoft Edge**. Dort kannst du:

- **Text markieren** und kommentieren,
- mit dem **Stift** Notizen zeichnen,
- **Seiten drehen** und ausdrucken.

## Unterschreiben

1. Öffne die PDF in Edge und klicke auf **Zeichnen**.
2. Zeichne deine Unterschrift mit der Maus oder dem Touchpad.
3. Speichere die Datei mit **Speichern unter** und neuem Namen.

## Seiten zusammenfügen

Öffne **Word**, **Datei**, **Öffnen**, und wähle die PDF. Word wandelt sie in ein bearbeitbares Dokument um. Das Layout kann sich ändern. Für komplizierte Fälle melde dich beim IT-Team.

> [!NOTE]
> Rechtsverbindliche Unterschriften (zum Beispiel Verträge) laufen über die **Unterschriftsfunktion der Firma**, nicht über eine gezeichnete Grafik.$md$,
 'software', '{PDF,Unterschrift,Edge}'),

('Speicherplatz aufräumen: Festplatte ist voll', 'speicherplatz-aufraeumen',
 'Windows meldet „Zu wenig Speicherplatz"? So schaffst du schnell Platz auf deinem Laptop.',
 $md$Ist die Festplatte fast voll, werden Updates und Programme langsam oder schlagen fehl. Mit diesen Schritten schaffst du schnell Platz.

## Speicheroptimierung

1. Öffne **Einstellungen**, **System**, **Speicher**.
2. Schalte **Speicheroptimierung** ein. Sie löscht temporäre Dateien automatisch.
3. Klicke auf **Temporäre Dateien**, wähle **Papierkorb**, **Downloads** und **Temporäre Dateien** und klicke auf **Dateien entfernen**.

## Weitere Maßnahmen

- Leere deinen **Downloads-Ordner**. Dort sammelt sich viel an.
- Deinstalliere **nicht mehr benötigte Programme** (siehe „Software deinstallieren").
- Lege große Dateien auf **OneDrive** und aktiviere **Dateien bei Bedarf**. Dann belegen sie lokal kaum Platz.

> [!WARNING]
> Lösche keine Dateien in `C:\Windows` oder `C:\Programme`. Das kann Windows beschädigen.

Reicht der Platz trotzdem nicht, erstelle ein Ticket mit einem Screenshot der Speicheransicht.$md$,
 'software', '{Speicherplatz,Festplatte,Windows}'),

('Windows-Update schlägt fehl: Fehlercodes beheben', 'windows-update-fehler',
 'Ein Windows-Update bricht mit einem Fehlercode ab? Diese Schritte beheben die häufigsten Ursachen.',
 $md$Fehlgeschlagene Updates kommen vor. Meist liegt es an zu wenig Platz oder einer unterbrochenen Verbindung.

## Das hilft meistens

1. **Neu starten** und das Update erneut versuchen.
2. Prüfe, ob mindestens **10 GB freier Speicher** vorhanden sind.
3. Schließe das **Netzteil** an und bleibe im stabilen Netz (Firmennetz oder VPN).
4. Starte die **Problembehandlung**: **Einstellungen**, **System**, **Problembehandlung**, **Andere Problembehandlungen**, **Windows Update**, **Ausführen**.
5. Trenne **externe Geräte** wie USB-Sticks und Dockingstation und versuche es erneut.

## Bei Fehlercodes

Notiere den Code (zum Beispiel `0x80070005`) und erstelle ein Ticket. Wir prüfen den Fehler dann gezielt.

> [!NOTE]
> Windows-Updates werden meist über Nacht installiert. Lass den Laptop dafür eingeschaltet, siehe „Windows-Updates und Neustart".$md$,
 'software', '{Windows Update,Fehler,Neustart}'),

('Software deinstallieren', 'software-deinstallieren',
 'Ein Programm wird nicht mehr gebraucht? So entfernst du es sauber von deinem Laptop.',
 $md$Nicht mehr benötigte Programme sparen Platz und halten das System aufgeräumt.

## So deinstallierst du

1. Öffne **Einstellungen**, **Apps**, **Installierte Apps**.
2. Suche das Programm in der Liste.
3. Klicke auf die **drei Punkte** daneben und wähle **Deinstallieren**.
4. Folge den Hinweisen auf dem Bildschirm.

## Wenn es nicht geht

- Wird die Option **grau** angezeigt, hat die IT die Software **verteilt**. Entfernen können wir sie nur über das Unternehmensportal.
- Öffne das **Unternehmensportal**, suche das Programm und wähle **Deinstallieren**, falls angeboten.

> [!WARNING]
> Entferne keine Programme, die du nicht kennst. Manche sind Teil der Firmensicherheit und werden automatisch neu installiert.

Brauchst du eine Software nicht mehr, ist ein Ticket am einfachsten. Wir geben die **Lizenz** frei, dann kann sie ein Kollege nutzen.$md$,
 'software', '{Deinstallieren,Apps,Lizenz}'),

('Screenshot erstellen und weitergeben', 'screenshot-erstellen',
 'Ein Bild vom Bildschirm hilft uns bei jedem Ticket. So machst du in Sekunden einen Screenshot.',
 $md$Ein Screenshot zeigt uns genau, was du siehst. Das spart Rückfragen.

## Die schnellste Methode

Drücke `Windows` + `Umschalt` + `S`. Der Bildschirm wird dunkel und du **ziehst einen Rahmen** um den Bereich, den du aufnehmen willst. Das Bild liegt danach in der Zwischenablage. Füge es mit `Strg` + `V` in eine E-Mail, in Teams oder ins Ticket ein.

## Weitere Möglichkeiten

- `Druck`: ganzer Bildschirm in die Zwischenablage.
- `Alt` + `Druck`: nur das aktive Fenster.
- Das Programm **Snipping Tool** (Startmenü) lässt dich das Bild bearbeiten und speichern.

> [!WARNING]
> Prüfe vor dem Senden, ob **Passwörter** oder **vertrauliche Daten** im Bild zu sehen sind. Schwärze sie, bevor du den Screenshot weitergibst.

Bei Fehlermeldungen füge den Screenshot zusammen mit **Uhrzeit** und deiner **Beschreibung** ins Ticket ein.$md$,
 'software', '{Screenshot,Snipping Tool,Ticket}'),

-- Hardware ------------------------------------------------------------------------------------------
('Handscanner im Lager verbindet nicht', 'handscanner-verbindet-nicht',
 'Der Handscanner meldet „Keine Verbindung" oder piept ohne Reaktion? So bringst du ihn wieder ins Netz.',
 $md$Handscanner nutzen im Lager WLAN oder Bluetooth. Verliert er die Verbindung, kannst du meist selbst helfen.

## Prüfen

1. **Akku:** Ist er leer, wird der Scanner instabil. Setze ihn in die **Ladestation**.
2. **Neu starten:** Halte die **Einschalttaste** etwa zehn Sekunden gedrückt, bis er neu bootet.
3. **Bluetooth-Scanner:** Scanne den **Pairing-Barcode** aus dem Handbuch oder vom Etikett an der Station, um ihn neu zu koppeln.
4. **WLAN-Scanner:** Prüfe, ob du im **Empfangsbereich** bist. In Randzonen der Halle ist der Empfang schlechter.
5. Teste mit einem **zweiten Scanner**, ob die Station ein Problem hat.

## Dein Scanner ist defekt

Lege ihn in das Fach **Reparatur** und nimm einen **Ersatzscanner** aus dem Schrank im Büro der Schichtleitung.

> [!NOTE]
> Meldest du ein Ticket, nenne die **Gerätenummer** auf dem Aufkleber des Scanners und die **Halle**, in der das Problem auftrat.$md$,
 'hardware', '{Handscanner,Lager,Bluetooth,WLAN}'),

('Laptop wird sehr heiß oder der Lüfter ist laut', 'laptop-ueberhitzt',
 'Der Laptop ist heiß und der Lüfter dreht auf? Meist hilft es, die Luftzufuhr und die Last zu prüfen.',
 $md$Ein warmer Laptop ist normal. Wird er **sehr heiß**, drosselt er sich und läuft langsam.

## Das kannst du tun

1. Stelle den Laptop auf eine **harte, ebene Fläche**. Auf Sofa oder Bett blockiert Stoff die Lüftungsschlitze.
2. Prüfe, ob die **Lüftungsschlitze** staubfrei sind. Vorsichtig mit Druckluft ausblasen, nicht mit dem Staubsauger.
3. Öffne den **Task-Manager** (`Strg` + `Umschalt` + `Esc`) und schaue, welches Programm viel **CPU** nutzt. Beende es.
4. Schließe **nicht benötigte Browser-Tabs** und Programme.
5. Starte den Laptop neu.

> [!WARNING]
> Öffne den Laptop nicht selbst und lege ihn nicht auf ein Kissen, solange er läuft.

Bleibt er trotzdem sehr heiß oder schaltet er sich ab, erstelle ein Ticket. Eventuell ist der Lüfter verschmutzt oder die Wärmeleitpaste muss erneuert werden.$md$,
 'hardware', '{Laptop,Überhitzung,Lüfter}'),

('Laptop startet nicht: Was du prüfen kannst', 'laptop-startet-nicht',
 'Beim Einschalten passiert nichts oder der Laptop hängt am Logo? Diese Schritte helfen bei den häufigsten Ursachen.',
 $md$Bleibt der Bildschirm schwarz oder hängt der Laptop beim Start, ist oft nur der Strom das Problem.

## Schritt für Schritt

1. Schließe das **Netzteil** an und warte fünf Minuten. Ein tiefentladener Akku braucht Zeit.
2. Prüfe, ob eine **LED** am Netzteil oder Laptop leuchtet.
3. Entferne alle **externen Geräte** (USB, Dockingstation, Monitor).
4. **Hard-Reset:** Halte die Einschalttaste **15 Sekunden** gedrückt, lass los und starte neu.
5. Erscheint ein Windows-Logo mit drehenden Punkten sehr lange, warte bis zu **20 Minuten**. Windows installiert vielleicht ein Update.

## Weitere Hinweise

- Zeigt der Bildschirm eine **Fehlermeldung** (zum Beispiel „Reparatur wird vorbereitet"), mache ein **Foto** davon.
- Schalte den Laptop nicht mehrfach hart aus, während Windows Updates installiert.

> [!NOTE]
> Startet er trotz aller Schritte nicht, ruf das IT-Team an (Telefon **1234**). Wir besorgen dir ein Ersatzgerät.$md$,
 'hardware', '{Laptop,Start,Akku,Bildschirm}'),

('Akku-Laufzeit verlängern und Akkustatus prüfen', 'akku-laufzeit',
 'Der Akku hält nicht mehr lang? So prüfst du seinen Zustand und holst mehr Laufzeit heraus.',
 $md$Akkus altern. Nach zwei bis drei Jahren halten sie spürbar weniger. Mit einem Bericht siehst du, wie es um deinen Akku steht.

## Akkubericht erstellen

1. Klicke mit rechts auf das **Startmenü** und wähle **Terminal** oder **Eingabeaufforderung**.
2. Gib ein:

```
powercfg /batteryreport
```

3. Öffne die angezeigte Datei im Browser. Vergleiche **Design Capacity** mit **Full Charge Capacity**. Liegt der zweite Wert unter 60 Prozent, ist der Akku verbraucht.

## Laufzeit verlängern

- Aktiviere den **Energiesparmodus** (Windows-Taste + `A`).
- Verringere die **Bildschirmhelligkeit**.
- Schließe Programme, die du nicht brauchst, besonders Videokonferenzen im Hintergrund.
- Trenne **USB-Geräte**, die du gerade nicht nutzt.

> [!NOTE]
> Ist der Akku verbraucht, erstelle ein Ticket und hänge den Bericht an. Wir tauschen ihn aus.$md$,
 'hardware', '{Akku,Laptop,Laufzeit,Energiesparmodus}'),

('USB-Stick wird nicht erkannt', 'usb-stick-nicht-erkannt',
 'Du steckst einen USB-Stick ein, aber nichts passiert? Das hat meist einen einfachen Grund.',
 $md$Nicht jeder USB-Stick wird akzeptiert. Aus Sicherheitsgründen sind private Speichermedien gesperrt.

## Prüfen

1. Stecke den Stick an einem **anderen USB-Anschluss** an.
2. Zeigt der Explorer nach einigen Sekunden das Laufwerk? Wenn ja, ist alles in Ordnung.
3. Starte den Laptop neu und versuche es mit dem Stick erneut.
4. Teste ihn an einem **anderen Gerät**. Wird er dort auch nicht erkannt, ist der Stick defekt.

## Gesperrt

Siehst du die Meldung „Dieses Gerät ist durch die Firmenrichtlinie gesperrt", ist ein privater Stick nicht erlaubt.

- Nutze **OneDrive**, **Teams** oder die Netzlaufwerke zum Austausch.
- Brauchst du einen USB-Stick beruflich, erstelle ein Ticket. Wir geben dir einen **verschlüsselten Firmenstick**.

> [!WARNING]
> Stecke niemals gefundene USB-Sticks an den Laptop. Sie können Schadsoftware enthalten. Gib sie dem IT-Team.$md$,
 'hardware', '{USB,Speicher,Sicherheit}'),

('Zweiten Monitor einrichten', 'zweiter-monitor-einrichten',
 'Mehr Platz auf dem Schreibtisch: So schließt du einen zweiten Bildschirm an und stellst die Anzeige ein.',
 $md$Mit zwei Bildschirmen arbeitest du deutlich effizienter, zum Beispiel E-Mail links und Dokument rechts.

## Anschließen

1. Verbinde den Monitor per **HDMI**, **DisplayPort** oder **USB-C** mit dem Laptop oder der Dockingstation.
2. Schalte den Monitor ein und wähle den passenden **Eingang**.

## Anzeige einstellen

1. Drücke `Windows` + `P`.
2. Wähle **Erweitern**, damit der zweite Monitor zusätzlichen Platz bietet.
3. Ordne die Bildschirme unter **Einstellungen**, **System**, **Bildschirm** so an, wie sie auf deinem Schreibtisch stehen. Ziehe die Kästchen mit der Maus.

## Es klappt nicht

- Tausche das **Kabel** oder den **Anschluss**.
- Siehst du kein Bild, lies „Dockingstation erkennt Monitor nicht".

> [!TIP]
> Mit `Windows` + Pfeiltaste links oder rechts schiebst du ein Fenster schnell auf eine Bildschirmhälfte.$md$,
 'hardware', '{Monitor,Bildschirm,Dockingstation}'),

('Touchpad reagiert nicht', 'touchpad-reagiert-nicht',
 'Der Mauszeiger bewegt sich nicht mehr? Oft ist das Touchpad nur versehentlich ausgeschaltet.',
 $md$Bei vielen Laptops lässt sich das Touchpad mit einer Tastenkombination ausschalten, manchmal unbemerkt.

## Das hilft

1. Prüfe, ob eine **Taste mit Touchpad-Symbol** in der Funktionsreihe (`F1` bis `F12`) vorhanden ist. Drücke sie, eventuell zusammen mit `Fn`.
2. Öffne **Einstellungen**, **Bluetooth & Geräte**, **Touchpad** und aktiviere den **Schalter** oben.
3. Verwende eine **externe Maus** vorübergehend, um die Einstellung zu erreichen.
4. Starte den Laptop neu.

## Mit externer Maus ist es genauso?

Dann liegt es nicht am Touchpad. Siehe „Maus oder Tastatur reagiert nicht".

> [!NOTE]
> Ist das Touchpad trotzdem tot, melde dich per Ticket. Wir tauschen den Laptop oder reparieren ihn.$md$,
 'hardware', '{Touchpad,Laptop,Maus}'),

('Gerät verloren oder gestohlen: Sofort melden', 'geraet-verloren-gestohlen',
 'Laptop oder Smartphone weg? Je schneller du dich meldest, desto besser lassen sich Daten schützen.',
 $md$Ein verlorenes Gerät ist ein Sicherheitsvorfall, aber kein Beinbruch. Wichtig ist: **sofort melden**.

## Das tust du

1. Rufe das IT-Team an (Telefon **1234**), auch am Wochenende gibt es die Notfallnummer in der Firmen-App.
2. Nenne **Gerätenummer**, **Zeitpunkt** und **Ort**, an dem du es zuletzt hattest.
3. Wir **sperren** das Gerät aus der Ferne und das Konto, falls nötig.
4. Bei Diebstahl erstatte **Anzeige** bei der Polizei und gib uns das Aktenzeichen.

## Wir kümmern uns um

- Fernlöschung der Firmendaten,
- Zurücksetzen der Passwörter,
- Ersatzgerät.

> [!WARNING]
> Warte nicht ab, ob das Gerät wieder auftaucht. Jede Stunde zählt, besonders wenn es nicht verschlüsselt war.

Alle Firmenlaptops sind mit **BitLocker** verschlüsselt. Ohne dein Passwort kommt niemand an die Daten, aber wir sperren trotzdem.$md$,
 'hardware', '{Verlust,Diebstahl,Sicherheit,Laptop}'),

('Kein Ton am PC: Lautsprecher und Ausgabe prüfen', 'kein-ton-pc',
 'Videos und Anrufe bleiben stumm? Meist ist das falsche Ausgabegerät ausgewählt.',
 $md$Fehlt der Ton, ist selten die Hardware defekt. Prüfe die Auswahl.

## Schritt für Schritt

1. Klicke unten rechts auf das **Lautsprechersymbol** und prüfe, dass nicht **Stumm** aktiv ist.
2. Klicke auf den Pfeil neben dem Lautstärkeregler und wähle das richtige **Ausgabegerät**, zum Beispiel **Lautsprecher** oder dein Headset.
3. Prüfe **Lautstärke** in der App (Teams, Browser, Videoplayer).
4. Stecke das **Headset** aus und wieder ein.
5. Starte den Laptop neu.

## Nur in Teams?

Öffne in Teams **Einstellungen**, **Geräte** und prüfe Lautsprecher und Mikrofon. Siehe auch „Teams: Kein Ton oder Mikrofon".

> [!TIP]
> Zeigt die Dockingstation einen Monitor mit Lautsprechern an, kann Windows den Ton dorthin senden. Wähle dann das richtige Gerät.$md$,
 'hardware', '{Ton,Lautsprecher,Audio,Headset}'),

-- E-Mail & Teams ------------------------------------------------------------------------------------
('Outlook: E-Mail hängt im Postausgang fest', 'outlook-postausgang',
 'Deine E-Mail wird nicht gesendet und bleibt im Postausgang? Meist liegt es am Anhang oder an der Verbindung.',
 $md$Bleibt eine Nachricht im **Postausgang**, kann Outlook sie nicht senden.

## Das tust du

1. Prüfe unten rechts in Outlook, ob **Offline arbeiten** oder **Getrennt** steht. Dann klicke auf **Senden/Empfangen** und **Offline arbeiten**, um zu verbinden.
2. Prüfe deine **Internet- oder VPN-Verbindung**.
3. Ist ein **großer Anhang** dabei, verkleinere ihn oder nutze einen Link (siehe „Anhang zu groß").
4. Öffne die Nachricht im Postausgang, kopiere den Text in eine **neue E-Mail** und sende sie erneut.
5. Starte Outlook neu.

## Das Postfach ist voll?

Dann kann Outlook nichts senden. Siehe „Outlook-Postfach ist voll".

> [!NOTE]
> Hilft nichts, erstelle ein Ticket mit der Fehlermeldung und der Größe der E-Mail.$md$,
 'email-teams', '{Outlook,Postausgang,Senden}'),

('Outlook-Signatur einrichten', 'outlook-signatur',
 'So legst du eine professionelle E-Mail-Signatur an, die bei jeder Nachricht automatisch erscheint.',
 $md$Die Signatur enthält Name, Funktion, Telefonnummer und Standort. Bitte halte dich an die Vorlage.

## Signatur anlegen

1. Öffne in Outlook **Datei**, **Optionen**, **E-Mail**, **Signaturen**.
2. Klicke auf **Neu** und gib einen Namen ein, zum Beispiel „Firma".
3. Füge den Text ein. Die Vorlage bekommst du von deiner Teamleitung.
4. Wähle rechts oben, dass die Signatur bei **Neuen Nachrichten** und bei **Antworten** verwendet wird.
5. Klicke auf **OK**.

## Beispiel

```
Max Mustermann
Müller Logistik GmbH
Telefon 1234
```

> [!TIP]
> Verwende keine großen Bilder. Sie erscheinen bei jeder Antwort als Anhang und blähen das Postfach auf.

Im neuen Outlook gibt es die Einstellung unter **Einstellungen**, **Konten**, **Signaturen**.$md$,
 'email-teams', '{Outlook,Signatur,E-Mail}'),

('Outlook-Kalender freigeben', 'outlook-kalender-freigeben',
 'Teamkolleg:innen sollen deinen Kalender sehen? So gibst du ihn mit passenden Rechten frei.',
 $md$Ein freigegebener Kalender erleichtert Terminabstimmungen im Team.

## Freigabe einrichten

1. Wechsle in Outlook zur Ansicht **Kalender**.
2. Klicke oben auf **Kalender freigeben** und wähle deinen Kalender.
3. Gib die **E-Mail-Adresse** der Person ein.
4. Wähle die Berechtigung, zum Beispiel **Kann nur Verfügbarkeit anzeigen** oder **Kann alle Details anzeigen**.
5. Klicke auf **Senden**. Die Person bekommt eine Einladung.

## Private Termine

Markiere einen Termin als **Privat** (Schloss-Symbol). Andere sehen dann nur „Beschäftigt".

> [!NOTE]
> Vertretungen nutzen die Berechtigung **Kann bearbeiten**. Gib sie nur Personen, denen du vertraust.

## Freigabe entfernen

Öffne **Kalender freigeben**, wähle die Person und klicke auf **Entfernen**.$md$,
 'email-teams', '{Outlook,Kalender,Freigabe}'),

('Gemeinsames Postfach in Outlook hinzufügen', 'outlook-gemeinsames-postfach',
 'Teams wie Einkauf oder Lager nutzen oft ein gemeinsames Postfach. So fügst du es hinzu.',
 $md$Ein **gemeinsames Postfach** (zum Beispiel `lager@mueller-logistik.example`) wird von mehreren Personen genutzt. Du brauchst dafür die **Berechtigung** vom IT-Team.

## Hinzufügen

1. Prüfe, ob das Postfach unter deinem Konto im linken Bereich schon auftaucht. Meist fügt sich ein berechtigtes Postfach automatisch hinzu, das kann bis zu **60 Minuten** dauern.
2. Wenn nicht: Klicke mit rechts auf deine **Hauptadresse**, wähle **Ordner hinzufügen** oder **Freigegebenen Ordner hinzufügen**, und gib die Adresse ein.
3. Starte Outlook neu.

## Als gemeinsame Adresse senden

Öffne eine **neue E-Mail**, klicke auf **Von** und wähle die gemeinsame Adresse. Fehlt sie, trage sie über **Von** und **Andere E-Mail-Adresse** ein.

> [!NOTE]
> Fehlt das Postfach auch nach einer Stunde, erstelle ein Ticket mit der Adresse. Eventuell fehlt noch die Berechtigung durch die Teamleitung.$md$,
 'email-teams', '{Outlook,Gemeinsames Postfach,Berechtigung}'),

('E-Mail-Anhang ist zu groß', 'anhang-zu-gross',
 'Outlook lehnt einen großen Anhang ab? So verschickst du große Dateien trotzdem sicher.',
 $md$E-Mails haben meist ein Limit von **etwa 20 MB** pro Nachricht. Größere Dateien verschickst du als Link.

## Datei als Link teilen

1. Lade die Datei in **OneDrive** oder **Teams** hoch.
2. Rechtsklicke sie und wähle **Teilen**.
3. Gib die **Personen** an oder wähle **Personen in Müller Logistik**.
4. Kopiere den Link und füge ihn in die E-Mail ein.

## Datei verkleinern

- **Bilder**: Verkleinere sie in Word (**Bild komprimieren**).
- **PDF**: Speichere sie im Format **Kleinste Dateigröße**.
- **Mehrere Dateien**: Packe sie als **ZIP** (Rechtsklick, **Senden an**, **ZIP-komprimierter Ordner**).

> [!WARNING]
> An **externe Personen** sendest du vertrauliche Dokumente nur nach Rücksprache. Mit Linkfreigabe kannst du den Zugriff zeitlich begrenzen.

Externe können große Dateien über den **Link mit Passwort** erhalten. Sprich uns an, wenn du Hilfe beim Einstellen brauchst.$md$,
 'email-teams', '{Anhang,OneDrive,E-Mail,Dateigröße}'),

('E-Mail im Spam-Ordner: Wichtige Nachrichten fehlen', 'mail-im-spam',
 'Eine erwartete E-Mail kommt nicht an? Prüfe den Spam-Ordner und lege einen sicheren Absender fest.',
 $md$Manchmal landen echte E-Mails im Ordner **Junk-E-Mail**, weil der Filter sie für Spam hält.

## So gehst du vor

1. Öffne in Outlook den Ordner **Junk-E-Mail**.
2. Finde die Nachricht, rechtsklicke und wähle **Kein Junk**, **Immer vertrauen**.
3. Prüfe auch den Ordner **Gelöschte Elemente** und **Archiv**.

## Nicht angekommen?

- Frage den Absender, ob die **Adresse korrekt** ist.
- Erstelle ein Ticket mit **Absenderadresse**, **Betreff** und **Zeitpunkt**. Wir prüfen den Nachrichtenverlauf auf dem Mailserver.

> [!WARNING]
> Öffne in Spam-Mails keine Links oder Anhänge, auch nicht „zum Prüfen". Siehe „Phishing-E-Mail erkennen und melden".

Der Spamfilter lernt: Markierst du Spam als **Junk**, werden ähnliche Nachrichten künftig direkt aussortiert.$md$,
 'email-teams', '{Spam,Junk,Outlook,E-Mail}'),

('Teams: Bildschirm teilen im Meeting', 'teams-bildschirm-teilen',
 'Du willst dein Fenster oder den ganzen Bildschirm zeigen? So teilst du Inhalte in Teams.',
 $md$In einem Teams-Meeting zeigst du anderen deinen Bildschirm in wenigen Sekunden.

## So teilst du

1. Klicke im Meeting auf **Teilen** (Symbol mit Pfeil nach oben).
2. Wähle **Bildschirm**, ein einzelnes **Fenster** oder **PowerPoint Live**.
3. Aktiviere **Systemaudio einbeziehen**, wenn du ein Video mit Ton abspielst.
4. Zum Beenden klicke oben auf **Freigabe beenden**.

## Tipps

- Teile bevorzugt **ein Fenster**. Dann sehen andere keine privaten Benachrichtigungen.
- Schließe vorher **E-Mails** und vertrauliche Dokumente.
- Auf dem Mac musst du Teams unter **Datenschutz**, **Bildschirmaufnahme** erlauben.

> [!NOTE]
> Fehlt die Schaltfläche **Teilen**, bist du eventuell als **Teilnehmer** statt Referent eingeladen. Bitte den Organisator, deine Rolle zu ändern.$md$,
 'email-teams', '{Teams,Bildschirm teilen,Meeting}'),

('Teams-Meeting planen und Einladung versenden', 'teams-meeting-planen',
 'So planst du ein Online-Meeting mit Terminserie, Teilnehmenden und Link.',
 $md$Ein Teams-Meeting planst du direkt in Outlook oder in Teams.

## In Teams

1. Öffne den **Kalender** und klicke auf **Neues Meeting**.
2. Gib **Titel**, **Teilnehmende**, **Datum** und **Uhrzeit** ein.
3. Aktiviere bei Bedarf **Wiederholung** (täglich, wöchentlich).
4. Klicke auf **Speichern**. Die Einladung geht an alle Teilnehmenden.

## In Outlook

Wähle **Neue Besprechung** und dann **Teams-Besprechung**. Der Einwahllink wird automatisch eingefügt.

> [!TIP]
> Wähle für Meetings mit externen Gästen die Option **Lobby**: So kannst du Teilnehmende vorher prüfen und einlassen.

## Aufzeichnen

Klicke im Meeting auf **Mehr** und **Aufzeichnung starten**. Informiere alle Teilnehmenden vorher, das ist Pflicht.$md$,
 'email-teams', '{Teams,Meeting,Kalender,Outlook}'),

('Teams-Benachrichtigungen anpassen', 'teams-benachrichtigungen',
 'Zu viele oder zu wenige Hinweise aus Teams? So stellst du Töne und Banner passend ein.',
 $md$Du entscheidest, wann Teams dich unterbricht.

## Einstellen

1. Klicke oben rechts auf die **drei Punkte** und wähle **Einstellungen**.
2. Öffne **Benachrichtigungen und Aktivität**.
3. Wähle bei **Chat**, **Erwähnungen** und **Kanäle**, ob du ein **Banner**, einen **Ton** oder nur ein **Feed-Symbol** möchtest.
4. Stelle deinen **Status** auf **Nicht stören**, wenn du dich konzentrieren willst.

## Für einen Kanal

Klicke auf die **drei Punkte** neben dem Kanal und wähle **Kanalbenachrichtigungen**.

> [!NOTE]
> Du bekommst auch bei **Nicht stören** Meldungen von Personen, die du als **Priorität** festgelegt hast.

Meldungen bleiben aus? Prüfe auch die Windows-Einstellung **System**, **Benachrichtigungen**, ob Teams dort erlaubt ist.$md$,
 'email-teams', '{Teams,Benachrichtigungen,Status}'),

('Teams ist langsam oder fehlerhaft: Zurücksetzen', 'teams-cache-leeren',
 'Teams startet nicht, lädt langsam oder zeigt falsche Daten? Das Zurücksetzen löst viele Probleme.',
 $md$Teams speichert Daten lokal zwischen. Sind sie beschädigt, kommt es zu Fehlern. Das Zurücksetzen löscht diesen Zwischenspeicher.

## Neues Teams zurücksetzen

1. Beende Teams komplett (Rechtsklick auf das Symbol im Infobereich, **Beenden**).
2. Öffne **Einstellungen**, **Apps**, **Installierte Apps**.
3. Suche **Microsoft Teams**, klicke auf die **drei Punkte** und wähle **Erweiterte Optionen**.
4. Klicke auf **Zurücksetzen**.
5. Starte Teams neu und melde dich an.

## Vorher prüfen

- Hast du eine stabile **Internetverbindung**?
- Ist Teams **aktuell**? Hole ein Update über das Unternehmensportal.

> [!NOTE]
> Das Zurücksetzen löscht keine Chats oder Dateien. Sie liegen in der Cloud. Du musst dich nur neu anmelden.

Funktioniert Teams weiterhin nicht, erstelle ein Ticket mit **Screenshot** und Uhrzeit.$md$,
 'email-teams', '{Teams,Cache,Zurücksetzen,Fehler}')

) as v(title, slug, summary, content, cat, tags)
on conflict (slug) do nothing;
