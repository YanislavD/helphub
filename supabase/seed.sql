-- Demo content for HelpHub (fictional company "Müller Logistik GmbH").
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run. It is safe to run more than once
-- (articles whose slug already exists are skipped). The search vector and published_at are filled in
-- automatically by the database trigger. The articles are attributed to the first agent/admin account.
--
-- Stage 9 will extend this file with demo accounts; for now it only seeds articles.

insert into public.articles (title, slug, summary, content, category_id, tags, status, author_id)
values

-- 1 ------------------------------------------------------------------------------------------------
(
  'Windows-Passwort zurücksetzen und wieder anmelden',
  'windows-passwort-zuruecksetzen',
  'Du kommst nicht mehr an deinen PC, weil dein Passwort vergessen oder abgelaufen ist? So setzt du es in wenigen Minuten selbst zurück.',
  $md$Wenn du dich nicht mehr an deinem Arbeitsplatz-PC anmelden kannst, liegt es meistens an einem **vergessenen oder abgelaufenen Passwort**. Du kannst es selbst zurücksetzen – ohne Anruf beim IT-Team.

> [!NOTE]
> Du brauchst dein Smartphone mit der Authenticator-App und einen zweiten Rechner oder dein Handy, um die Seite zum Zurücksetzen zu öffnen.

## Passwort selbst zurücksetzen

1. Öffne auf deinem Smartphone oder einem anderen Rechner die Seite `passwort.mueller-logistik.de`.
2. Gib deine Firmen-E-Mail-Adresse ein und klicke auf **Weiter**.
3. Bestätige deine Identität mit dem sechsstelligen Code aus der Authenticator-App.
4. Vergib ein neues Passwort. Es muss mindestens **12 Zeichen** lang sein.
5. Starte deinen PC neu und melde dich mit dem neuen Passwort an.

> [!WARNING]
> **Im Homeoffice:** Das neue Passwort gilt auf dem Laptop erst, wenn er mit dem Firmennetz verbunden ist. Stelle zuerst die VPN-Verbindung her, bevor du dich anmeldest.

## Regeln für das neue Passwort

- Mindestens 12 Zeichen, mit Groß- und Kleinbuchstaben sowie einer Zahl
- Keines der letzten fünf Passwörter wiederverwenden
- Keine Namen, Geburtsdaten oder Teile deiner E-Mail-Adresse

## Wann läuft mein Passwort ab?

Du möchtest wissen, wie lange dein aktuelles Passwort noch gültig ist? Öffne die Eingabeaufforderung und führe diesen Befehl aus:

```
net user %USERNAME% /domain
```

In der Zeile „Kennwort läuft ab" steht das Datum.

## Funktioniert es immer noch nicht?

Wenn die Seite zum Zurücksetzen nicht erreichbar ist oder dein Konto gesperrt wurde, hilft dir das IT-Team direkt weiter: Telefon **1234** oder it-support@mueller-logistik.de.$md$,
  (select id from public.categories where slug = 'konten-passwoerter'),
  '{Passwort,Anmeldung,Windows,Konto gesperrt}',
  'published',
  (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
),

-- 2 ------------------------------------------------------------------------------------------------
(
  'VPN verbindet nicht – Fehlercode 809 beheben',
  'vpn-verbindet-nicht-fehler-809',
  'Der VPN-Client meldet Fehler 809 oder bleibt beim Verbinden hängen? Mit diesen Schritten findest du die häufigsten Ursachen selbst.',
  $md$Der Fehler **809** bedeutet: Dein Computer erreicht den VPN-Server nicht. Meist liegt es am Heimnetzwerk, nicht an deinem Laptop. Gehe die Schritte der Reihe nach durch.

## Schnelle Prüfung

1. Öffne im Browser eine beliebige Webseite. Lädt sie nicht, hast du **keine Internetverbindung** – dann liegt das Problem nicht beim VPN.
2. Trenne die VPN-Verbindung komplett und starte den **VPN-Client neu**.
3. Starte deinen Laptop neu und versuche es erneut.

## Anderes Netzwerk testen

Viele Heimrouter und öffentliche WLANs blockieren die Ports, die das VPN braucht.

1. Aktiviere auf deinem Smartphone den **mobilen Hotspot**.
2. Verbinde den Laptop mit dem Hotspot.
3. Starte das VPN erneut.

Klappt es dort, blockiert dein Router oder dein WLAN die Verbindung. Starte den Router neu oder wende dich an das IT-Team, damit wir die Einstellungen gemeinsam prüfen.

> [!TIP]
> Im Hotel oder Zug hilft oft ein Wechsel auf den Hotspot deines Handys – dort gibt es die wenigsten Sperren.

## Netzwerk-Cache leeren

Öffne die Eingabeaufforderung (Windows-Taste, `cmd` eingeben) und führe aus:

```
ipconfig /flushdns
ipconfig /release
ipconfig /renew
```

Starte danach den VPN-Client neu.

> [!WARNING]
> Ändere keine Einstellungen in der Windows-Registrierung, auch wenn du in Foren dazu Anleitungen findest. Das kann deinen Laptop beschädigen und wird vom IT-Team nicht unterstützt.

## Immer noch Fehler 809?

Erstelle ein Ticket und nenne uns:

- die genaue **Fehlermeldung**,
- ob du **zu Hause, im Hotel oder unterwegs** bist,
- ob es im **Hotspot** funktioniert.$md$,
  (select id from public.categories where slug = 'netzwerk-vpn'),
  '{VPN,Homeoffice,Fehler 809,Verbindung}',
  'published',
  (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
),

-- 3 ------------------------------------------------------------------------------------------------
(
  'Drucker im Büro hinzufügen',
  'drucker-im-buero-hinzufuegen',
  'So verbindest du deinen PC mit einem Netzwerkdrucker im Büro oder Lager – in drei Minuten und ohne IT-Hilfe.',
  $md$Netzwerkdrucker richtest du einmalig ein, danach erscheinen sie in jedem Druckdialog. Du brauchst den **Druckernamen**: Er steht auf einem Aufkleber am Gerät, zum Beispiel `DRUCKER-OG1-01`.

> [!NOTE]
> Du musst im Firmennetz oder per VPN verbunden sein, sonst findet Windows den Drucker nicht.

## Drucker hinzufügen

1. Öffne die **Einstellungen** (Windows-Taste + `I`).
2. Wähle **Bluetooth & Geräte** und dann **Drucker & Scanner**.
3. Klicke auf **Gerät hinzufügen** und warte einige Sekunden.
4. Erscheint dein Drucker nicht in der Liste, wähle **Der gewünschte Drucker ist nicht aufgeführt**.
5. Wähle **Freigegebenen Drucker über den Namen auswählen** und gib ein:

```
\\print01.mueller-logistik.local\DRUCKER-OG1-01
```

6. Bestätige mit **Weiter**. Windows installiert den Treiber automatisch.
7. Drucke zum Test eine **Testseite**.

## Standarddrucker festlegen

Öffne den Drucker in den Einstellungen und wähle **Als Standard festlegen**. Dann musst du ihn beim Drucken nicht jedes Mal auswählen.

## Es klappt nicht?

- **Zugriff verweigert:** Prüfe, ob du im Firmennetz oder per VPN bist.
- **Treiber wird nicht gefunden:** Warte zwei Minuten und versuche es erneut. Bleibt der Fehler, erstelle ein Ticket.
- **Drucker druckt nichts:** Prüfe, ob im Druckerfenster ein Auftrag mit dem Status „Fehler" hängt. Lösche ihn und drucke neu. Zeigt der Drucker selbst eine Fehlermeldung (z. B. Papierstau oder leerer Toner), behebe sie zuerst am Gerät.

> [!WARNING]
> Installiere keine Druckertreiber von fremden Webseiten. Das IT-Team stellt alle freigegebenen Treiber bereit.$md$,
  (select id from public.categories where slug = 'drucker'),
  '{Drucker,Netzwerkdrucker,Einrichten}',
  'published',
  (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
),

-- 4 ------------------------------------------------------------------------------------------------
(
  'Outlook startet nicht oder hängt beim Laden',
  'outlook-startet-nicht-oder-haengt',
  'Outlook öffnet sich nicht, friert ein oder bleibt bei „Profil wird geladen" stehen? Diese Schritte lösen die meisten Fälle.',
  $md$Wenn Outlook nicht startet, ist meist ein **Add-In** oder ein **beschädigtes Profil** die Ursache. Probiere die Lösungen in dieser Reihenfolge – nach jedem Schritt Outlook neu starten.

## 1. Outlook komplett schließen

Manchmal läuft Outlook noch im Hintergrund.

1. Drücke `Strg` + `Umschalt` + `Esc`, um den Task-Manager zu öffnen.
2. Suche **Outlook** in der Liste, klicke es an und wähle **Task beenden**.
3. Starte Outlook erneut.

## 2. Im abgesicherten Modus starten

1. Drücke `Windows` + `R`.
2. Gib ein:

```
outlook.exe /safe
```

3. Bestätige mit **OK** und wähle dein Profil.

Startet Outlook so, ist ein Add-In die Ursache:

1. Wähle **Datei**, dann **Optionen** und **Add-Ins**.
2. Klicke bei **Verwalten** auf **COM-Add-Ins** und **Los**.
3. Entferne alle Häkchen, starte Outlook normal und aktiviere die Add-Ins einzeln wieder, bis der Fehler zurückkommt.

## 3. Neues Outlook-Profil anlegen

1. Öffne die **Systemsteuerung** und suche nach **Mail**.
2. Klicke auf **Profile anzeigen** und dann auf **Hinzufügen**.
3. Gib deine Firmen-E-Mail-Adresse ein und folge den Schritten.
4. Wähle bei **Beim Start von Microsoft Outlook dieses Profil verwenden** das neue Profil.

> [!NOTE]
> Deine E-Mails gehen dabei nicht verloren – sie liegen auf dem Server und werden neu synchronisiert. Das kann bei vielen Mails einige Minuten dauern.

## 4. Office reparieren

Öffne **Einstellungen**, **Apps**, **Installierte Apps**, wähle **Microsoft 365** und klicke auf **Ändern**. Wähle dann **Schnellreparatur**.

## Hilfe vom IT-Team

Hilft nichts davon, erstelle ein Ticket. Nenne uns bitte die **Fehlermeldung** und seit wann das Problem besteht.$md$,
  (select id from public.categories where slug = 'email-teams'),
  '{Outlook,E-Mail,Office,Absturz}',
  'published',
  (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
),

-- 5 ------------------------------------------------------------------------------------------------
(
  'Laptop lädt nicht – Netzteil und Akku prüfen',
  'laptop-laedt-nicht-netzteil-akku',
  'Der Laptop zeigt „angeschlossen, lädt nicht" oder die Ladeleuchte bleibt aus? So findest du heraus, ob Netzteil, Steckdose oder Akku schuld ist.',
  $md$Bevor du einen Austausch anforderst, kannst du in wenigen Minuten selbst prüfen, wo das Problem liegt.

## Steckdose und Kabel prüfen

1. Stecke das Netzteil in eine **andere Steckdose**. Verlängerungskabel und Steckerleisten sind oft die Ursache.
2. Prüfe, ob die **Leuchte am Netzteil** leuchtet (falls vorhanden).
3. Schau dir Kabel und Stecker an. Sind sie geknickt, verfärbt oder locker?
4. Stecke den Stecker am Laptop fest ein und drehe ihn leicht.

> [!WARNING]
> Benutze kein beschädigtes Netzteil weiter und lade den Laptop nicht mit fremden Netzteilen. Das ist ein Brandrisiko und kann den Akku beschädigen.

## Laptop zurücksetzen (Hard Reset)

Hilft, wenn der Laptop das Netzteil nicht erkennt:

1. Fahre den Laptop herunter und ziehe das Netzteil ab.
2. Entferne alle USB-Geräte und Dockingstationen.
3. Halte den **Ein/Aus-Knopf 30 Sekunden** gedrückt.
4. Schließe das Netzteil an und starte den Laptop.

## Ladeanzeige in Windows prüfen

Zeigt Windows „Angeschlossen, lädt nicht", obwohl alles verbunden ist, öffne **Einstellungen**, **System** und **Energie & Akku**. Prüfe dort den Ladezustand. Bleibt er bei 80 %, ist vermutlich der **Akku-Schutzmodus** aktiv. Das ist gewollt und schont den Akku.

## Wann Ersatz nötig ist

Erstelle ein Ticket, wenn

- das Netzteil an einer anderen Steckdose und nach dem Hard Reset nicht lädt,
- der Akku stark **aufgebläht** aussieht,
- der Laptop **heiß** wird oder verbrannt riecht.

> [!NOTE]
> Wir stellen dir bei defektem Netzteil in der Regel noch am selben Tag ein Ersatzgerät bereit.$md$,
  (select id from public.categories where slug = 'hardware'),
  '{Laptop,Akku,Netzteil,Hardware}',
  'published',
  (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
)

on conflict (slug) do nothing;
