-- ============================================================
-- SEED DATA - Gym Directory (Real Fight Clubs)
-- Run after COMPLETE-SCHEMA.sql to populate the gym directory
-- ============================================================

-- ============================================================
-- ESTONIA (EE)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Kevin Renno Combat Sports Academy', 'EE', 'Estonia', 'Tallinn', NULL, 59.4370, 24.7536, 'https://taipoks.ee', 'krva_tallinn', '{boxing,mma,muay_thai,kickboxing}', 'manual', true),
('Estonian Academy of Kickboxing', 'EE', 'Estonia', 'Tallinn', 'Mahtra 1, Tallinn', 59.4390, 24.7280, 'http://www.kickboxing.ee', NULL, '{kickboxing,mma,muay_thai}', 'manual', true),
('AK Gym', 'EE', 'Estonia', 'Tallinn', NULL, 59.4270, 24.7440, 'https://www.akgym.ee', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Tokon Mixed Martial Arts', 'EE', 'Estonia', 'Tallinn', 'Punane 69, Tallinn', 59.4230, 24.7850, NULL, NULL, '{mma}', 'manual', true),
('Sparta Sports Club', 'EE', 'Estonia', 'Tallinn', NULL, 59.4350, 24.7500, NULL, NULL, '{mma,boxing}', 'manual', false),
('Fight Club Tallinn', 'EE', 'Estonia', 'Tallinn', NULL, 59.4370, 24.7450, 'https://www.fight.ee', NULL, '{mma,boxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LATVIA (LV)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Berserk MMA Team', 'LV', 'Latvia', 'Riga', 'Ganību dambis 22d-korpuss 2, Riga', 56.9620, 24.0980, 'https://www.berserk.lv', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Latvian Top Fighters', 'LV', 'Latvia', 'Riga', 'Liepājas iela 3b, Riga', 56.9480, 24.0870, 'https://www.mmalatvia.eu', 'latviatopteam', '{mma}', 'manual', true),
('TOP RING Latvia', 'LV', 'Latvia', 'Riga', NULL, 56.9500, 24.1050, NULL, 'top_ring_latvia', '{muay_thai,kickboxing,mma,boxing}', 'manual', true),
('Rīgas Rīngs / Gladiator', 'LV', 'Latvia', 'Riga', 'Katoļu iela 8, Riga', 56.9510, 24.1130, 'https://www.gladiator.lv', NULL, '{boxing,kickboxing}', 'manual', true),
('Profesionālis MMA BJJ', 'LV', 'Latvia', 'Riga', NULL, 56.9530, 24.1080, NULL, NULL, '{mma}', 'manual', true),
('Prime MMA Imanta', 'LV', 'Latvia', 'Riga', NULL, 56.9450, 24.0300, NULL, NULL, '{mma,boxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LITHUANIA (LT)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Jasiūnas Team', 'LT', 'Lithuania', 'Vilnius', 'Žemynos g. 14, Vilnius', 54.6920, 25.2650, NULL, 'jasiunasteam', '{muay_thai,kickboxing}', 'manual', true),
('Fighters Gym', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6870, 25.2800, 'https://fightersgym.lt', NULL, '{kickboxing,muay_thai}', 'manual', true),
('Daugirdas Gym', 'LT', 'Lithuania', 'Kaunas', 'Jonavos g. 68-1, Kaunas', 54.9120, 23.9450, 'https://www.daugirdasgym.lt', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Forum Palace Muay Thai', 'LT', 'Lithuania', 'Vilnius', 'Konstitucijos pr. 26, Vilnius', 54.6980, 25.2730, 'https://www.forumpalace.lt', NULL, '{muay_thai,boxing}', 'manual', true),
('Blade Fights Gym', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6890, 25.2750, 'https://bladefights.com', NULL, '{mma,kickboxing}', 'manual', true),
('UTMA Lithuania', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6860, 25.2790, 'https://uniquetma.com', NULL, '{muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FINLAND (FI)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Helsinki Thaiboxing Club', 'FI', 'Finland', 'Helsinki', 'Kallio, Helsinki', 60.1840, 24.9500, 'http://www.htbc.fi', 'helsinkithaiboxingclub', '{muay_thai,kickboxing,boxing}', 'manual', true),
('TK Sports MMA', 'FI', 'Finland', 'Helsinki', NULL, 60.1700, 24.9410, 'https://tksportsmma.net', NULL, '{mma,boxing,kickboxing,muay_thai}', 'manual', true),
('GB Gym', 'FI', 'Finland', 'Helsinki', NULL, 60.1720, 24.9380, 'https://www.gbgym.com', NULL, '{mma,kickboxing,muay_thai,boxing}', 'manual', true),
('Crest Helsinki', 'FI', 'Finland', 'Helsinki', NULL, 60.1690, 24.9350, NULL, NULL, '{muay_thai,mma,boxing}', 'manual', true),
('Muay Tribe', 'FI', 'Finland', 'Helsinki', 'Mäkelänkatu 54 A 501, Helsinki', 60.1980, 24.9470, 'https://muaytribe.fi', NULL, '{muay_thai}', 'manual', true),
('King of the Ring', 'FI', 'Finland', 'Helsinki', NULL, 60.1750, 24.9420, 'https://kingofthering.fi', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Combat Gym', 'FI', 'Finland', 'Helsinki', NULL, 60.1710, 24.9390, 'https://www.combat.fi', NULL, '{muay_thai,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- POLAND (PL)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Palestra Warszawa', 'PL', 'Poland', 'Warsaw', NULL, 52.2300, 21.0120, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('WCA Fight Team', 'PL', 'Poland', 'Warsaw', NULL, 52.2250, 21.0200, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Berkut WCA Fight Team', 'PL', 'Poland', 'Warsaw', NULL, 52.2200, 21.0700, NULL, 'berkutwca', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('Academia Gorila Warsaw', 'PL', 'Poland', 'Warsaw', NULL, 52.2350, 21.0050, NULL, NULL, '{muay_thai,boxing}', 'manual', true),
('Bellator Warszawa', 'PL', 'Poland', 'Warsaw', NULL, 52.2290, 21.0150, NULL, NULL, '{mma,boxing}', 'manual', true),
('Sparta Gym Warsaw', 'PL', 'Poland', 'Warsaw', NULL, 52.2280, 21.0180, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('MMA Academy Kraków', 'PL', 'Poland', 'Krakow', NULL, 50.0614, 19.9372, NULL, NULL, '{mma,boxing}', 'manual', true),
('Power Fight House', 'PL', 'Poland', 'Krakow', NULL, 50.0650, 19.9400, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Puncher Wrocław', 'PL', 'Poland', 'Wroclaw', NULL, 51.1079, 17.0385, 'https://puncher.pl', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Arrachion', 'PL', 'Poland', 'Warsaw', NULL, 52.2297, 21.0122, 'https://www.arrachion.pl', NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CZECH REPUBLIC (CZ)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('MMA Gym Praha', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0755, 14.4378, NULL, NULL, '{mma,boxing}', 'manual', true),
('Gorila MMA', 'CZ', 'Czech Republic', 'Prague', 'K Žižkovu 282/9, Prague', 50.0900, 14.4550, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('MSM Fight Academy', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0780, 14.4400, 'https://msmsport.eu', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Penta Gym Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0525, 14.4260, 'https://www.pentagym.cz', 'pentagymprague', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('SBG Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0800, 14.4500, NULL, 'sbgprague', '{mma,boxing}', 'manual', true),
('Shooters MMA Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0820, 14.4480, NULL, NULL, '{mma,boxing,muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- HUNGARY (HU)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('FITE Club Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.4979, 19.0402, 'https://fiteclub.hu', NULL, '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('The Playground Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.5000, 19.0450, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Budapest Top Team', 'HU', 'Hungary', 'Budapest', NULL, 47.4950, 19.0380, NULL, NULL, '{mma,boxing}', 'manual', true),
('Flex Gym Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.5020, 19.0500, NULL, NULL, '{boxing,mma}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SLOVAKIA (SK)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('CHAOS Bratislava', 'SK', 'Slovakia', 'Bratislava', 'Májová 21, Bratislava', 48.1486, 17.1077, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Octagon Fighting Academy', 'SK', 'Slovakia', 'Bratislava', 'Ivanská Cesta 10, Bratislava', 48.1530, 17.1750, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('Spartans Muay Thai Bratislava', 'SK', 'Slovakia', 'Bratislava', NULL, 48.1500, 17.1100, 'https://www.spartans.sk', NULL, '{muay_thai,boxing,kickboxing}', 'manual', true),
('Spartakus Fight Gym', 'SK', 'Slovakia', 'Trnava', NULL, 48.3774, 17.5878, 'https://sfg.sk', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('MMA Top Team Košice', 'SK', 'Slovakia', 'Košice', NULL, 48.7164, 21.2611, NULL, NULL, '{mma,boxing}', 'manual', true),
('Free Fight Academy Košice', 'SK', 'Slovakia', 'Košice', NULL, 48.7200, 21.2580, NULL, NULL, '{mma,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SERBIA (RS)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Kaizen MMA Belgrade', 'RS', 'Serbia', 'Belgrade', NULL, 44.8176, 20.4633, 'https://kaizenmma.com', NULL, '{mma,boxing}', 'manual', true),
('Secutor MMA Academy', 'RS', 'Serbia', 'Belgrade', 'Omladinskih brigada 31, Belgrade', 44.8100, 20.4200, NULL, NULL, '{mma}', 'manual', true),
('Fight Company MMA', 'RS', 'Serbia', 'Belgrade', 'Cvetanova Ćuprija 117, Belgrade', 44.8250, 20.4700, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Skill Boxing', 'RS', 'Serbia', 'Belgrade', NULL, 44.8200, 20.4600, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('CDS Martial Arts Club', 'RS', 'Serbia', 'Novi Sad', 'Temerinska 95, Novi Sad', 45.2600, 19.8350, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('Mega Gym Fighting', 'RS', 'Serbia', 'Belgrade', NULL, 44.8150, 20.4550, 'https://megagym.rs', NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CROATIA (HR)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Mash Gym Zagreb', 'HR', 'Croatia', 'Zagreb', NULL, 45.8150, 15.9819, 'https://www.mashgym.com', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('American Top Team Zagreb', 'HR', 'Croatia', 'Zagreb', 'Zagrebačka Avenija 108, Zagreb', 45.7950, 15.9200, 'https://www.americantopteam.eu', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Spartan Gym Zagreb', 'HR', 'Croatia', 'Zagreb', NULL, 45.8100, 15.9750, 'https://spartangym.hr', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Orlando Fit Zagreb', 'HR', 'Croatia', 'Zagreb', 'Radnička cesta 52, Zagreb', 45.8000, 15.9900, NULL, NULL, '{kickboxing,muay_thai}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SLOVENIA (SI)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Fight Club Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0569, 14.5058, 'https://www.fcl.si', 'fcl.ljubljana', '{boxing,kickboxing,mma}', 'manual', true),
('Klub Center Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0550, 14.5100, 'https://www.klubcenter.com', NULL, '{boxing,kickboxing,muay_thai,mma}', 'manual', true),
('T''n''T Gym Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0520, 14.5080, 'https://www.tnt-gym.si', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('BK Knockout Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0540, 14.5050, NULL, 'boksarskiklubknockout', '{boxing}', 'manual', true),
('Simba Fight Club', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0530, 14.5070, 'http://simbafightclub.com', NULL, '{boxing,muay_thai}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- BULGARIA (BG)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Bulgarian Top Team', 'BG', 'Bulgaria', 'Sofia', 'Shipchenska Epopeia 12, Sofia', 42.6977, 23.3219, NULL, NULL, '{mma,boxing}', 'manual', true),
('ABC Fight Club', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6950, 23.3250, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('Sport Center Pulev', 'BG', 'Bulgaria', 'Sofia', NULL, 42.7000, 23.3200, NULL, NULL, '{boxing}', 'manual', true),
('Champions Academy Bulgaria', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6930, 23.3280, NULL, NULL, '{boxing}', 'manual', true),
('STEEL STYLE Boxing Gym', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6960, 23.3240, NULL, NULL, '{boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROMANIA (RO)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Combatant MMA Club', 'RO', 'Romania', 'Bucharest', NULL, 44.4268, 26.1025, 'https://combatant.ro', NULL, '{mma,boxing}', 'manual', true),
('Absoluto Fighting Center', 'RO', 'Romania', 'Bucharest', 'Splaiul Unirii nr. 96, Bucharest', 44.4200, 26.1100, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Prince Gym K-1', 'RO', 'Romania', 'Bucharest', NULL, 44.4350, 26.0400, NULL, NULL, '{kickboxing,mma}', 'manual', true),
('Profesional Fight Gym', 'RO', 'Romania', 'Bistrița', 'Str. Cloșca nr. 1-3, Bistrița', 47.1350, 24.4900, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RUSSIA (RU)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Fight Nights Team', 'RU', 'Russia', 'Moscow', NULL, 55.7558, 37.6173, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Eagles MMA', 'RU', 'Russia', 'Moscow', NULL, 55.7600, 37.6200, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Club No. 1', 'RU', 'Russia', 'Moscow', NULL, 55.7520, 37.6150, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('RCC Boxing', 'RU', 'Russia', 'Yekaterinburg', NULL, 56.8389, 60.6057, NULL, NULL, '{boxing}', 'manual', true),
('Rati Gym Moscow', 'RU', 'Russia', 'Moscow', NULL, 55.7580, 37.6100, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Alexander Nevsky Fight Club', 'RU', 'Russia', 'Saint Petersburg', NULL, 59.9343, 30.3351, NULL, NULL, '{boxing,mma,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- GEORGIA (GE)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Gymnasia Sports', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7151, 44.8271, 'https://gymnasia.ge', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Georgia Pro MMA', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7180, 44.8300, 'https://www.gapromma.com', NULL, '{mma,muay_thai,boxing}', 'manual', true),
('Mix Fight Georgia', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7200, 44.8250, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Factory Tbilisi', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7160, 44.8280, NULL, NULL, '{kickboxing,mma}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SWEDEN (SE)
-- ============================================================

INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Allstars Training Center', 'SE', 'Sweden', 'Stockholm', 'Svetsarvägen 22, Solna', 59.3626, 17.8725, 'https://www.allstarsgym.se', 'allstarstrainingcenter', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('Pancrase Gym Stockholm', 'SE', 'Sweden', 'Stockholm', NULL, 59.3170, 18.0649, NULL, 'pancrasegym', '{mma,muay_thai,boxing}', 'manual', true),
('Nexus STHLM', 'SE', 'Sweden', 'Stockholm', NULL, 59.3300, 18.0700, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('GBG MMA', 'SE', 'Sweden', 'Gothenburg', NULL, 57.7089, 11.9746, NULL, 'gbgmma', '{mma,boxing,muay_thai}', 'manual', true),
('Redline Training Center', 'SE', 'Sweden', 'Malmö', NULL, 55.6050, 13.0038, NULL, NULL, '{mma,muay_thai,kickboxing}', 'manual', true),
('Malmö Muay Thai', 'SE', 'Sweden', 'Malmö', NULL, 55.6070, 13.0050, NULL, 'malmomuaythai', '{muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;