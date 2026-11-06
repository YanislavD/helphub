-- HelpHub demo data (fictional company "Müller Logistik GmbH").
--
--   1. five demo accounts (employee / agent / admin)
--   2. 27 published help articles in all six categories
--   3. a few votes ("war dieser Artikel hilfreich?") and support tickets, so the dashboard has content
--
-- HOW TO USE
--   * Local development:  npx supabase db reset     (runs this file automatically after the migrations)
--   * Hosted project:     paste the whole file into the Supabase SQL Editor and run it.
--   The file is idempotent: running it twice does not create duplicates.
--
-- !! SECURITY: every demo account has the SAME well-known password (see README). Use this seed for local
-- !! development and private demos only. Before you make a deployed instance public, remove the demo users
-- !! (delete from auth.users where email like '%@mueller-logistik.example';) or change their passwords.

-- 1. Demo accounts ----------------------------------------------------------------------------------------
-- Rows in auth.users are normally created by Supabase Auth. Here we create them directly: the password
-- is stored as a bcrypt hash, and an "identity" row is needed so that e-mail login works. The trigger
-- handle_new_user then creates the matching profile; afterwards we only raise the role.
do $$
declare
  demo   record;
  new_id uuid;
begin
  for demo in
    select * from (values
      ('anna.weber@mueller-logistik.example',      'Anna Weber',      'user'),
      ('markus.schulz@mueller-logistik.example',   'Markus Schulz',   'user'),
      ('tim.becker@mueller-logistik.example',      'Tim Becker',      'user'),
      ('jonas.keller@mueller-logistik.example',    'Jonas Keller',    'agent'),
      ('sabine.hoffmann@mueller-logistik.example', 'Sabine Hoffmann', 'admin')
    ) as t (email, full_name, user_role)
  loop
    continue when exists (select 1 from auth.users u where u.email = demo.email);

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', demo.email,
      extensions.crypt('HelpHub-Demo-2026!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', demo.full_name), now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), new_id, new_id::text,
      jsonb_build_object('sub', new_id::text, 'email', demo.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    update public.profiles set role = demo.user_role::public.user_role where id = new_id;
  end loop;
end
$$;

-- 2. Articles ---------------------------------------------------------------------------------------------------
-- Author = the first agent/admin account (Jonas Keller after step 1).
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

-- More articles ----------------------------------------------------------------------------------------
insert into public.articles (title, slug, summary, content, category_id, tags, status, author_id)
select v.title, v.slug, v.summary, v.content,
       (select id from public.categories where slug = v.cat),
       v.tags::text[], 'published',
       (select id from public.profiles where role in ('agent', 'admin') order by role, created_at limit 1)
from (values

-- Konten & Passwörter ------------------------------------------------------------------------------
('Konto gesperrt: Was tun nach mehreren Fehlversuchen?', 'konto-gesperrt-fehlversuche',
 'Nach fünf falschen Eingaben sperrt Windows dein Konto automatisch. So hebst du die Sperre auf.',
 $md$Wenn du dein Passwort mehrmals falsch eingegeben hast, sperrt das System dein Konto aus Sicherheitsgründen. Du siehst dann die Meldung „Das Konto wurde gesperrt".

## So geht es weiter

1. **Warte 30 Minuten.** Danach hebt sich die Sperre automatisch auf.
2. Gib dein Passwort in Ruhe und mit kontrollierter Feststelltaste ein.
3. Hast du es vergessen, setze es über `passwort.mueller-logistik.de` zurück.

> [!NOTE]
> Wenn du die Sperre sofort aufheben möchtest, ruf das IT-Team an: Telefon **1234**. Wir prüfen kurz deine Identität und entsperren dein Konto.

## Warum wurde mein Konto gesperrt?

Oft ist ein **altes Passwort** auf einem zweiten Gerät gespeichert, zum Beispiel auf dem Smartphone (E-Mail-App) oder in einem Netzlaufwerk. Dieses Gerät versucht ständig, sich mit dem alten Passwort anzumelden. Aktualisiere das Passwort auch dort.$md$,
 'konten-passwoerter', '{Konto gesperrt,Passwort,Anmeldung,Sperre}'),

('Zwei-Faktor-Authentifizierung (MFA) einrichten', 'zwei-faktor-authentifizierung-einrichten',
 'So richtest du die Authenticator-App für die sichere Anmeldung ein – in fünf Minuten.',
 $md$Für den Zugriff auf Firmendaten brauchst du neben dem Passwort einen zweiten Faktor: einen Code aus der **Authenticator-App** auf deinem Smartphone.

## Einrichtung

1. Installiere die **Microsoft Authenticator**-App aus dem App Store oder Google Play.
2. Öffne auf dem Laptop `mysignins.microsoft.com` und melde dich an.
3. Wähle **Sicherheitsinformationen** und dann **Anmeldemethode hinzufügen**.
4. Wähle **Authenticator-App** und scanne den angezeigten **QR-Code** mit der App.
5. Gib den sechsstelligen Code zur Bestätigung ein.

> [!WARNING]
> Wenn du ein neues Handy bekommst, übertrage die App **vorher**. Ohne Zugriff auf den zweiten Faktor kannst du dich nicht mehr anmelden und das IT-Team muss ihn zurücksetzen.

## Der Code wird nicht akzeptiert?

Meist stimmt die **Uhrzeit auf dem Smartphone** nicht. Stelle in den Einstellungen die automatische Zeit ein und versuche es erneut.$md$,
 'konten-passwoerter', '{MFA,Authenticator,Zwei-Faktor,Sicherheit}'),

('Anmeldung am Laptop außerhalb des Büros', 'anmeldung-ausserhalb-des-buero',
 'Ohne Netzwerkverbindung klappt die Anmeldung nur mit dem zuletzt gültigen Passwort. So gehst du vor.',
 $md$Im Homeoffice, im Zug oder beim Kunden hat dein Laptop oft keine Verbindung zum Firmennetz. Windows merkt sich dann dein **zuletzt verwendetes Passwort**.

## Anmelden ohne Netzwerk

1. Schalte den Laptop ein und warte auf den Anmeldebildschirm.
2. Gib das Passwort ein, das du **zuletzt im Büro oder per VPN** benutzt hast.
3. Verbinde dich danach mit dem WLAN und starte das VPN.

## Du hast dein Passwort geändert?

Hast du dein Passwort zu Hause über die Webseite geändert, gilt auf dem Laptop **noch das alte**, bis er einmal mit dem Firmennetz verbunden war. Melde dich also zuerst mit dem alten Passwort an, starte das VPN und sperre den Laptop kurz (Windows-Taste + `L`). Danach gilt das neue.

> [!NOTE]
> Kommst du nicht an den Laptop heran, ruf uns an: Telefon **1234**.$md$,
 'konten-passwoerter', '{Anmeldung,Homeoffice,Offline,Passwort}'),

('Passwort ändern, bevor es abläuft', 'passwort-aendern-vor-ablauf',
 'Dein Passwort läuft nach 90 Tagen ab. So änderst du es rechtzeitig und ohne Stress.',
 $md$Aus Sicherheitsgründen läuft dein Passwort alle **90 Tage** ab. Windows erinnert dich 14 Tage vorher. Du kannst es jederzeit selbst ändern.

## Passwort am PC ändern

1. Drücke `Strg` + `Alt` + `Entf`.
2. Wähle **Kennwort ändern**.
3. Gib dein altes Kennwort und zweimal das neue ein.
4. Bestätige mit **Enter**.

## Tipps für ein gutes Passwort

- Nimm einen **Satz**, zum Beispiel „Im Lager stehen 12 grüne Paletten!".
- Verwende es nur für die Arbeit.
- Aktualisiere es danach auf allen Geräten, auf denen du dich anmeldest (Smartphone-Mail, Netzlaufwerke).$md$,
 'konten-passwoerter', '{Passwort,Ablauf,Ändern}'),

-- Netzwerk & VPN ----------------------------------------------------------------------------------
('WLAN für Gäste einrichten', 'wlan-gast-verbinden',
 'Besucher und Kunden können über das Gast-WLAN ins Internet – getrennt vom Firmennetz.',
 $md$Besucher dürfen sich nie mit dem Firmen-WLAN verbinden. Dafür gibt es das Netzwerk **MuellerLogistik-Gast**.

## Gast verbinden

1. Wähle auf dem Gerät des Gastes das WLAN **MuellerLogistik-Gast**.
2. Öffne einen Browser. Die Anmeldeseite erscheint automatisch.
3. Gib den **Gast-Code** ein. Du bekommst ihn am Empfang oder von deiner Abteilung.
4. Akzeptiere die Nutzungsbedingungen.

> [!NOTE]
> Der Gast-Code gilt **24 Stunden**. Danach braucht der Gast einen neuen Code.

## Es klappt nicht?

- Erscheint keine Anmeldeseite, öffne manuell `http://neverssl.com`.
- Das Gast-WLAN hat **keinen Zugriff** auf Firmenserver und Drucker. Das ist so gewollt.$md$,
 'netzwerk-vpn', '{WLAN,Gast,Besucher,Internet}'),

('Netzlaufwerk Z: wird nicht angezeigt', 'netzlaufwerk-z-fehlt',
 'Das Laufwerk Z: fehlt im Explorer? Meist ist die Verbindung zum Firmennetz unterbrochen.',
 $md$Dein Abteilungslaufwerk **Z:** erscheint normalerweise automatisch im Explorer. Fehlt es, hast du keine Verbindung zum Dateiserver.

## Schritte

1. Prüfe, ob du im **Firmennetz** bist oder das **VPN** verbunden ist.
2. Öffne den Explorer und klicke auf **Dieser PC**.
3. Wähle **Netzlaufwerk verbinden** und gib ein:

```
\\fs01\abteilung
```

4. Setze das Häkchen bei **Verbindung bei Anmeldung wiederherstellen**.

> [!NOTE]
> Nach der Anmeldung dauert es bis zu 30 Sekunden, bis die Laufwerke da sind.

## Zugriff verweigert?

Dann hast du keine Berechtigung für den Ordner. Frag deine Teamleitung, ob du freigeschaltet werden sollst, und erstelle ein Ticket.$md$,
 'netzwerk-vpn', '{Netzlaufwerk,Dateiserver,Laufwerk Z,Explorer}'),

('Internet ist langsam', 'internet-langsam',
 'Webseiten laden nur schleppend? Mit diesen Schritten findest du die Ursache.',
 $md$Wenn alles langsam ist, liegt es selten am Laptop. Prüfe zuerst die Verbindung.

## Schnelltest

1. Öffne `speedtest.net` und starte den Test. Unter **10 Mbit/s** ist die Leitung zu schwach.
2. Gehe näher an den **WLAN-Router** heran oder nutze ein Netzwerkkabel.
3. Schließe Programme, die viel Daten brauchen (Videokonferenz, Cloud-Synchronisation).
4. Starte den Laptop neu.

## Im Homeoffice

- Starte den **Router** neu: Netzstecker 30 Sekunden ziehen.
- Wenn mehrere Personen streamen, ist die Leitung oft ausgelastet.
- Verbinde dich mit dem **5-GHz-WLAN**, falls vorhanden – es ist schneller als 2,4 GHz.

> [!TIP]
> Ist nur das **VPN** langsam, aber normales Internet schnell, melde es uns mit einem Ticket und nenne die Uhrzeit.$md$,
 'netzwerk-vpn', '{Internet,langsam,WLAN,Verbindung}'),

-- Drucker ------------------------------------------------------------------------------------------
('Drucker druckt nicht', 'drucker-druckt-nicht',
 'Der Druckauftrag verschwindet oder hängt in der Warteschlange? So bringst du den Drucker wieder zum Laufen.',
 $md$Bevor du das IT-Team anrufst, kannst du die häufigsten Ursachen selbst beheben.

## 1. Am Drucker prüfen

- Ist der Drucker **eingeschaltet** und zeigt er eine **Fehlermeldung**? Beheben, zum Beispiel Papier nachlegen oder Toner wechseln.
- Zeigt das Display „Bereit"?

## 2. Warteschlange leeren

1. Öffne **Einstellungen**, **Bluetooth & Geräte**, **Drucker & Scanner**.
2. Wähle den Drucker und klicke auf **Druckwarteschlange öffnen**.
3. Lösche alle Aufträge mit dem Status **Fehler** oder **Wird gedruckt**.
4. Drucke erneut.

## 3. Richtigen Drucker gewählt?

Im Druckdialog steht manchmal ein anderer Drucker (zum Beispiel „Microsoft Print to PDF"). Wähle den richtigen und setze ihn als **Standard**.

> [!WARNING]
> Druckt der Drucker nur Unsinn (Zeichensalat), schalte ihn aus und wieder an. Hilft das nicht, erstelle ein Ticket.$md$,
 'drucker', '{Drucker,Druckauftrag,Warteschlange}'),

('Papierstau im Drucker beheben', 'drucker-papierstau',
 'Das Papier klemmt im Drucker? So entfernst du den Stau sicher, ohne etwas zu beschädigen.',
 $md$Ein Papierstau ist der häufigste Druckerfehler. Mit etwas Ruhe löst du ihn schnell.

## Stau entfernen

1. **Schalte den Drucker aus** und ziehe bei großen Geräten den Stecker.
2. Öffne die **Seitenklappe** und die Papierfächer. Die Anzeige am Display sagt, wo das Papier klemmt.
3. Ziehe das Papier **langsam und gleichmäßig** in Richtung der Papierführung heraus. Nicht ruckartig reißen.
4. Entferne auch kleine **Papierreste**.
5. Schließe alle Klappen und schalte den Drucker wieder ein.

> [!WARNING]
> Greife nie in heiße Teile (Fixiereinheit) und benutze kein Werkzeug. Ist das Papier abgerissen und du erreichst den Rest nicht, melde es uns.

## Staus vermeiden

- Verwende **trockenes, glattes Papier** und fächere den Stapel vor dem Einlegen auf.
- Lege nicht zu viel Papier ein.$md$,
 'drucker', '{Papierstau,Drucker,Papier}'),

('Scannen in den Ordner', 'scannen-in-ordner',
 'Dokumente am Multifunktionsgerät scannen und direkt in deinen Netzwerkordner speichern.',
 $md$Die Multifunktionsgeräte im Büro scannen direkt in deinen persönlichen **Scan-Ordner** auf dem Dateiserver.

## Scan starten

1. Lege das Dokument in den **Einzug** oder auf das Glas.
2. Tippe am Display auf **Scannen** und wähle **In Ordner**.
3. Melde dich mit deinem **Mitarbeiterausweis** oder deinem Benutzernamen an.
4. Wähle **Schwarz-Weiß** oder **Farbe** und tippe auf **Start**.

Deine Datei liegt danach in `\\fs01\scan\dein.name`.

## Der Scan kommt nicht an?

- Prüfe, ob du den **richtigen Benutzernamen** eingegeben hast.
- Öffne den Ordner einmal im Explorer. Ist die Meldung „Zugriff verweigert", erstelle ein Ticket.
- Sehr große Scans (über 20 MB) werden abgelehnt. Wähle eine niedrigere Auflösung.$md$,
 'drucker', '{Scannen,Multifunktionsgerät,Scan-Ordner}'),

-- Software -----------------------------------------------------------------------------------------
('Software-Installation beantragen', 'software-installation-beantragen',
 'Du brauchst ein Programm, das nicht installiert ist? So beantragst du es richtig.',
 $md$Aus Sicherheitsgründen darfst du selbst keine Programme installieren. Das IT-Team prüft und installiert sie für dich.

## So geht es

1. Prüfe, ob das Programm im **Software-Katalog** (Startmenü, „Unternehmensportal") steht. Dann kannst du es dort mit einem Klick installieren.
2. Steht es nicht dort, erstelle ein **Ticket** mit:
   - Name und Version des Programms,
   - Wofür du es brauchst,
   - Wer in deinem Team es noch braucht.
3. Deine Teamleitung muss die Anfrage freigeben. Danach installieren wir es meist innerhalb von zwei Arbeitstagen.

> [!WARNING]
> Lade keine Programme aus dem Internet herunter. Sie können Schadsoftware enthalten und werden vom System blockiert.

## Kostenpflichtige Software

Bei Lizenzkosten entscheidet die Abteilungsleitung. Plane dafür mehr Zeit ein.$md$,
 'software', '{Software,Installation,Antrag,Lizenz}'),

('Windows-Updates und Neustart', 'windows-updates-neustart',
 'Windows meldet „Neustart erforderlich"? Warum Updates wichtig sind und wie du sie sinnvoll planst.',
 $md$Updates schließen Sicherheitslücken. Deshalb installiert Windows sie automatisch und fordert danach einen **Neustart**.

## Neustart planen

1. Öffne **Einstellungen**, **Windows Update**.
2. Wähle **Neustart planen** und lege eine Zeit fest, zum Beispiel nach Feierabend.
3. Speichere vorher deine Arbeit und lass den Laptop am Strom angeschlossen.

> [!NOTE]
> Wird der Neustart mehrere Tage verschoben, erzwingt das System ihn. Du bekommst vorher eine Warnung.

## Der Laptop hängt bei „Updates werden installiert"

Warte **bis zu 30 Minuten** und schalte den Laptop nicht aus. Erst wenn sich nach einer Stunde nichts tut, halte den Ein/Aus-Knopf zehn Sekunden gedrückt und starte neu. Meldet er danach wieder einen Fehler, erstelle ein Ticket.$md$,
 'software', '{Windows,Updates,Neustart}'),

('Webseite lädt nicht richtig: Browser-Cache leeren', 'browser-cache-leeren',
 'Eine Webseite sieht falsch aus oder zeigt alte Daten? Leere den Cache und die Cookies.',
 $md$Wenn eine Webseite komisch aussieht, Buttons fehlen oder alte Informationen zeigt, hilft oft das Leeren des Browser-Caches.

## In Edge oder Chrome

1. Drücke `Strg` + `Umschalt` + `Entf`.
2. Wähle als Zeitraum **Gesamte Zeit**.
3. Setze Häkchen bei **Bilder und Dateien im Cache** (Cookies nur bei Bedarf).
4. Klicke auf **Jetzt löschen**.
5. Schließe den Browser und öffne die Seite neu.

> [!TIP]
> Probiere zuerst `Strg` + `F5`. Das lädt die Seite ohne Cache neu und löst viele Fälle in Sekunden.

## Hilft nichts?

Öffne die Seite in einem **privaten Fenster** (`Strg` + `Umschalt` + `N`). Klappt es dort, ist eine **Erweiterung** die Ursache. Deaktiviere sie nacheinander.$md$,
 'software', '{Browser,Cache,Edge,Chrome,Webseite}'),

('Microsoft 365: „Produkt nicht aktiviert"', 'microsoft-365-nicht-aktiviert',
 'Word oder Excel zeigen „Nicht lizenziertes Produkt"? So meldest du dich neu an.',
 $md$Die Meldung erscheint, wenn die Anmeldung bei Microsoft 365 abgelaufen ist. Deine Lizenz ist meist weiterhin gültig.

## Neu anmelden

1. Öffne Word und wähle **Datei**, **Konto**.
2. Klicke auf **Abmelden** und schließe alle Office-Programme.
3. Starte Word erneut und melde dich mit deiner **Firmen-E-Mail-Adresse** an.
4. Bestätige die Anmeldung mit dem Code aus der Authenticator-App.

> [!NOTE]
> Du musst dafür mit dem Internet verbunden sein, im Homeoffice also mit dem VPN.

## Es erscheint weiter die Meldung

Prüfe über das Unternehmensportal, ob dir eine **Microsoft-365-Lizenz** zugewiesen ist. Wenn nicht, erstelle ein Ticket.$md$,
 'software', '{Microsoft 365,Office,Word,Excel,Aktivierung}'),

-- Hardware -----------------------------------------------------------------------------------------
('Bildschirm bleibt schwarz nach dem Einschalten', 'bildschirm-bleibt-schwarz',
 'Der PC läuft, aber der Monitor zeigt nichts an? Prüfe Kabel, Eingang und Energiesparmodus.',
 $md$Ein schwarzer Bildschirm ist meist harmlos. Gehe diese Punkte der Reihe nach durch.

## Monitor prüfen

1. Leuchtet die **Betriebsanzeige** am Monitor? Wenn nicht, prüfe das Netzkabel.
2. Drücke eine Taste oder bewege die Maus. Der PC könnte im **Energiesparmodus** sein.
3. Wähle am Monitor mit der Menütaste den richtigen **Eingang** (HDMI, DisplayPort).
4. Stecke das **Bildschirmkabel** an beiden Enden fest ein.

## Laptop

Bleibt der Laptop-Bildschirm schwarz, aber die Tastatur leuchtet, drücke `Windows` + `P` und wähle **Nur PC-Bildschirm**. Eventuell wurde ein externer Monitor als Hauptanzeige gewählt.

## Hilft nichts?

Probiere ein anderes Kabel oder einen anderen Monitor. Läuft es damit, ist das Kabel oder der Monitor defekt. Erstelle ein Ticket mit der Inventarnummer.$md$,
 'hardware', '{Monitor,Bildschirm,schwarz,Kabel}'),

('Dockingstation erkennt Monitor nicht', 'dockingstation-erkennt-monitor-nicht',
 'Der externe Monitor an der Dockingstation bleibt dunkel? So bekommst du das Bild zurück.',
 $md$Wenn der Monitor an der Dockingstation kein Bild zeigt, liegt es meist an der Verbindung oder einer Einstellung.

## Schritte

1. Ziehe das **Docking-Kabel** vom Laptop ab und stecke es nach zehn Sekunden wieder an.
2. Prüfe, ob die Dockingstation **Strom** hat (Leuchte).
3. Drücke `Windows` + `P` und wähle **Erweitern** oder **Duplizieren**.
4. Öffne **Einstellungen**, **System**, **Bildschirm** und klicke auf **Erkennen**.
5. Starte den Laptop neu, während er an der Dockingstation hängt.

> [!TIP]
> Nutze am Monitor nur **ein** Kabel. Zwei gleichzeitig angeschlossene Kabel (HDMI und DisplayPort) verwirren oft die Erkennung.

## Bleibt es dunkel?

Notiere die **Modellnummer der Dockingstation** (Aufkleber unten) und erstelle ein Ticket. Eventuell fehlt ein Treiber.$md$,
 'hardware', '{Dockingstation,Monitor,Bildschirm,Erkennung}'),

('Maus oder Tastatur reagiert nicht', 'maus-tastatur-reagiert-nicht',
 'Eingabegeräte reagieren nicht mehr? Batterie, USB-Anschluss und Bluetooth prüfen.',
 $md$Wenn Maus oder Tastatur plötzlich nichts mehr tun, sind es fast immer einfache Ursachen.

## Kabelgebundene Geräte

1. Ziehe das Gerät ab und stecke es an einen **anderen USB-Anschluss**.
2. Stecke es direkt an den Laptop statt an einen USB-Hub.

## Kabellose Geräte

1. **Tausche die Batterien** oder lade das Gerät auf.
2. Prüfe, ob der kleine **USB-Empfänger** fest steckt.
3. Bei **Bluetooth**: Öffne die Einstellungen, **Bluetooth & Geräte**, entferne das Gerät und füge es neu hinzu.

> [!NOTE]
> Reagiert auch die **eingebaute Tastatur** am Laptop nicht, starte ihn mit gedrücktem Ein/Aus-Knopf (zehn Sekunden) neu.

Hilft nichts davon, tausche das Gerät im IT-Lager aus. Du bekommst es am selben Tag.$md$,
 'hardware', '{Maus,Tastatur,Bluetooth,USB}'),

('Headset mit dem Laptop koppeln', 'headset-koppeln',
 'So verbindest du ein Bluetooth-Headset und stellst es als Standardgerät für Meetings ein.',
 $md$Für Videokonferenzen eignet sich ein Headset besser als Laptop-Lautsprecher und Mikrofon.

## Koppeln

1. Schalte das Headset ein und halte die **Bluetooth-Taste** gedrückt, bis es blinkt.
2. Öffne auf dem Laptop **Einstellungen**, **Bluetooth & Geräte** und klicke auf **Gerät hinzufügen**.
3. Wähle **Bluetooth** und dann dein Headset.

## Als Standard festlegen

1. Klicke unten rechts auf das **Lautsprecher-Symbol** und wähle dein Headset als Ausgabe.
2. Öffne die **Soundeinstellungen** und wähle es auch als **Eingabegerät** (Mikrofon).
3. Wähle in Teams unter **Einstellungen**, **Geräte** das Headset aus.

> [!TIP]
> Klingt das Headset „blechern", ist meist das falsche Profil gewählt. Wähle in den Soundeinstellungen die Variante **Stereo** zum Hören.$md$,
 'hardware', '{Headset,Bluetooth,Mikrofon,Audio}'),

-- E-Mail & Teams -----------------------------------------------------------------------------------
('Teams: Kein Ton oder Mikrofon in Meetings', 'teams-kein-ton-mikrofon',
 'Niemand hört dich oder du hörst die anderen nicht? So stellst du Ton und Mikrofon in Teams richtig ein.',
 $md$Probleme mit dem Ton in Teams haben fast immer mit der **falschen Geräteauswahl** zu tun.

## Während des Meetings

1. Klicke in der Meeting-Leiste auf **Mehr** (drei Punkte) und wähle **Geräteeinstellungen**.
2. Wähle bei **Lautsprecher** und **Mikrofon** dein Headset oder die Laptop-Geräte.
3. Mache einen **Testanruf**, um den Ton zu prüfen.

## Mikrofon ist stumm?

- Prüfe, ob in Teams das Mikrofon-Symbol **durchgestrichen** ist.
- Manche Headsets haben einen **Stummschalter** am Kabel oder Bügel.
- Öffne die Windows-Einstellungen, **Datenschutz**, **Mikrofon** und erlaube Teams den Zugriff.

> [!NOTE]
> Teams neu starten (über das Symbol in der Taskleiste beenden und neu öffnen) behebt viele Tonprobleme sofort.

## Echo oder Rückkopplung

Mehrere Personen im selben Raum sollten **nur ein Mikrofon** nutzen und die Lautsprecher der anderen ausschalten.$md$,
 'email-teams', '{Teams,Ton,Mikrofon,Meeting,Headset}'),

('Teams: Kamera funktioniert nicht', 'teams-kamera-funktioniert-nicht',
 'Das Bild bleibt schwarz oder die Kamera wird nicht gefunden? So holst du das Videobild zurück.',
 $md$Wenn dich im Meeting niemand sieht, ist die Kamera meist in einem anderen Programm geöffnet oder gesperrt.

## Schritte

1. Schließe andere Programme, die die Kamera nutzen (Zoom, Skype, Browser-Tabs).
2. Prüfe in Teams unter **Einstellungen**, **Geräte**, ob die richtige **Kamera** gewählt ist.
3. Öffne die Windows-Einstellungen, **Datenschutz**, **Kamera** und erlaube Teams den Zugriff.
4. Hat deine Kamera eine **Abdeckung** oder einen Schalter? Öffne sie.
5. Starte Teams und notfalls den Laptop neu.

> [!TIP]
> Bei externen Webcams: Stecke sie in einen anderen **USB-Anschluss**, am besten direkt am Laptop und nicht an einem Hub.

Läuft die Kamera weiter nicht, erstelle ein Ticket mit dem Namen der Kamera.$md$,
 'email-teams', '{Teams,Kamera,Webcam,Video}'),

('Abwesenheitsnotiz in Outlook einrichten', 'outlook-abwesenheitsnotiz',
 'Urlaub oder Krankheit? So richtest du eine automatische Antwort ein, die auch intern und extern funktioniert.',
 $md$Mit der automatischen Antwort informierst du Absender, wenn du nicht erreichbar bist.

## Einrichten

1. Öffne Outlook und wähle **Datei**, **Automatische Antworten**.
2. Aktiviere **Automatische Antworten senden**.
3. Setze Häkchen bei **Nur während dieses Zeitraums senden** und wähle Start und Ende.
4. Schreibe auf den Reitern **Innerhalb meiner Organisation** und **Außerhalb meiner Organisation** deinen Text.
5. Bestätige mit **OK**.

> [!TIP]
> Nenne in der Nachricht eine **Vertretung** mit E-Mail-Adresse und Telefonnummer, damit dringende Anfragen nicht liegen bleiben.

## Auch im Browser

Du kannst die Abwesenheit auch auf `outlook.office.com` einstellen: **Einstellungen**, **Konto**, **Automatische Antworten**. Das geht auch vom Smartphone aus.$md$,
 'email-teams', '{Outlook,Abwesenheit,Urlaub,Automatische Antwort}'),

('Outlook-Postfach ist voll', 'outlook-postfach-voll',
 'Du kannst keine Mails mehr senden oder empfangen, weil dein Postfach voll ist? So schaffst du Platz.',
 $md$Dein Postfach hat **50 GB** Speicher. Ist es voll, kannst du nichts mehr senden. Du bekommst vorher eine Warnung.

## Platz schaffen

1. Öffne in Outlook den Ordner **Gelöschte Elemente** und leere ihn.
2. Leere auch **Junk-E-Mail**.
3. Wähle **Datei**, **Tools**, **Postfachbereinigung** und lass dir die **größten Elemente** anzeigen.
4. Lösche große Mails mit **Anhängen** oder speichere die Anhänge im Netzlaufwerk.
5. Leere danach **Gelöschte Elemente** erneut, denn dort liegen sie noch.

> [!NOTE]
> Wichtige alte Mails kannst du ins **Online-Archiv** verschieben. Es hat zusätzlichen Platz und du findest die Mails weiter mit der Suche.

Reicht das nicht, erstelle ein Ticket. Wir erhöhen den Speicher in begründeten Fällen.$md$,
 'email-teams', '{Outlook,Postfach,Speicher,Archiv}')

) as v(title, slug, summary, content, cat, tags)
on conflict (slug) do nothing;

-- 3. Votes and tickets ------------------------------------------------------------------------------------
-- A few votes from the three demo employees. One vote per person and article (unique constraint).
insert into public.article_feedback (article_id, user_id, helpful, comment)
select a.id, u.id, v.helpful, v.comment
from (values
  ('windows-passwort-zuruecksetzen',           'anna.weber@mueller-logistik.example',    true,  ''),
  ('windows-passwort-zuruecksetzen',           'markus.schulz@mueller-logistik.example', true,  ''),
  ('windows-passwort-zuruecksetzen',           'tim.becker@mueller-logistik.example',    true,  ''),
  ('vpn-verbindet-nicht-fehler-809',           'anna.weber@mueller-logistik.example',    true,  ''),
  ('vpn-verbindet-nicht-fehler-809',           'markus.schulz@mueller-logistik.example', true,  ''),
  ('vpn-verbindet-nicht-fehler-809',           'tim.becker@mueller-logistik.example',    false, 'Bei mir hilft auch der Hotspot nicht.'),
  ('drucker-druckt-nicht',                     'anna.weber@mueller-logistik.example',    true,  ''),
  ('drucker-druckt-nicht',                     'markus.schulz@mueller-logistik.example', true,  ''),
  ('outlook-startet-nicht-oder-haengt',        'anna.weber@mueller-logistik.example',    false, 'Der abgesicherte Modus startet bei mir auch nicht.'),
  ('outlook-startet-nicht-oder-haengt',        'markus.schulz@mueller-logistik.example', false, ''),
  ('outlook-startet-nicht-oder-haengt',        'tim.becker@mueller-logistik.example',    true,  ''),
  ('teams-kein-ton-mikrofon',                  'anna.weber@mueller-logistik.example',    true,  ''),
  ('teams-kein-ton-mikrofon',                  'tim.becker@mueller-logistik.example',    false, 'Mein Headset taucht in Teams gar nicht auf.'),
  ('laptop-laedt-nicht-netzteil-akku',         'markus.schulz@mueller-logistik.example', true,  ''),
  ('zwei-faktor-authentifizierung-einrichten', 'tim.becker@mueller-logistik.example',    true,  ''),
  ('wlan-gast-verbinden',                      'anna.weber@mueller-logistik.example',    true,  '')
) as v (slug, email, helpful, comment)
join public.articles a on a.slug = v.slug
join auth.users u on u.email = v.email
on conflict (article_id, user_id) do nothing;

-- Three support tickets in different states (they come from searches that found no answer).
insert into public.ticket_requests (user_id, title, description, priority, source_query, status)
select u.id, v.title, v.description, v.priority::public.ticket_priority, v.source_query, v.status::public.ticket_status
from (values
  ('anna.weber@mueller-logistik.example',    'Docking Station erkennt Monitor nicht',
   'Seit dem Windows-Update bleibt der zweite Monitor an der Dockingstation schwarz. Kabel habe ich schon getauscht.',
   'normal', 'docking station erkennt monitor nicht', 'open'),
  ('markus.schulz@mueller-logistik.example', 'Zugriff auf Scanner-Ordner verweigert',
   'Der Scan vom Multifunktionsgerät im Lager landet nicht in meinem Ordner, es kommt "Zugriff verweigert".',
   'high',   'scanner ordner zugriff verweigert', 'in_progress'),
  ('tim.becker@mueller-logistik.example',    'SAP-Anmeldung sehr langsam',
   'Die Anmeldung an SAP dauert seit Montag über zwei Minuten, vorher ging es in Sekunden.',
   'normal', 'sap anmeldung langsam', 'done')
) as v (email, title, description, priority, source_query, status)
join auth.users u on u.email = v.email
where not exists (
  select 1 from public.ticket_requests t where t.user_id = u.id and t.title = v.title
);
