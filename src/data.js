// ================= DATA =================
const SNAPSHOT_DATE = '2026-11-22T23:40:00-05:00';
const API_UP = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=60&mode=normal';
const API_PAST = 'https://ll.thespacedevs.com/2.3.0/launches/previous/?limit=40&mode=normal';

// Upcoming + recent launches (Launch Library 2 snapshot, Nov 22 2026)
const UPCOMING = __SNAP_UP__;
const PAST = __SNAP_PAST__;

// Milestone launches in history (for the "Historic" layer)
const HISTORIC = [
  {rocket:'R-7 Semyorka',mission:'Sputnik 1',net:'1957-10-04T19:28:00Z',status:'Success',provider:'Soviet space program',pad:'Site 1/5',lat:45.92,lon:63.342,site:'Baikonur Cosmodrome',cc:'KZ',orbit:'LEO',desc:'First artificial satellite. A 58 cm metal sphere that beeped for 21 days and started the Space Age.'},
  {rocket:'Vostok-K',mission:'Vostok 1 (Yuri Gagarin)',net:'1961-04-12T06:07:00Z',status:'Success',provider:'Soviet space program',pad:'Site 1/5',lat:45.92,lon:63.342,site:'Baikonur Cosmodrome',cc:'KZ',orbit:'LEO',desc:'First human in space. Gagarin completed one orbit of Earth in 108 minutes.'},
  {rocket:'Saturn V',mission:'Apollo 11',net:'1969-07-16T13:32:00Z',status:'Success',provider:'NASA',pad:'LC-39A',lat:28.6083,lon:-80.6041,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'TLI',desc:'First crewed Moon landing. Armstrong and Aldrin walked on the Moon on July 20, 1969.'},
  {rocket:'Space Shuttle',mission:'STS-1 Columbia',net:'1981-04-12T12:00:00Z',status:'Success',provider:'NASA',pad:'LC-39A',lat:28.6083,lon:-80.6041,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'LEO',desc:'First flight of the reusable Space Shuttle. The program flew 135 missions until 2011.'},
  {rocket:'Space Shuttle',mission:'STS-31 Hubble Space Telescope',net:'1990-04-24T12:33:00Z',status:'Success',provider:'NASA',pad:'LC-39B',lat:28.6272,lon:-80.6208,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'LEO',desc:'Deployed the Hubble Space Telescope, still observing more than 35 years later.'},
  {rocket:'Proton-K',mission:'Zarya (first ISS module)',net:'1998-11-20T06:40:00Z',status:'Success',provider:'Roscosmos',pad:'Site 81/23',lat:46.074,lon:62.985,site:'Baikonur Cosmodrome',cc:'KZ',orbit:'LEO',desc:'First piece of the International Space Station, continuously crewed since November 2000.'},
  {rocket:'Falcon 1',mission:'Flight 4 (RatSat)',net:'2008-09-28T23:15:00Z',status:'Success',provider:'SpaceX',pad:'Omelek Island',lat:9.048,lon:167.743,site:'Kwajalein Atoll, Marshall Islands',cc:'MH',orbit:'LEO',desc:'First privately developed liquid-fuel rocket to reach orbit. SpaceX had nearly run out of money.'},
  {rocket:'Falcon 9',mission:'ORBCOMM-2 (first booster landing)',net:'2015-12-22T01:29:00Z',status:'Success',provider:'SpaceX',pad:'SLC-40',lat:28.5619,lon:-80.5774,site:'Cape Canaveral SFS, FL, USA',cc:'US',orbit:'LEO',desc:'First time an orbital rocket booster flew back and landed upright. Reusability era begins.'},
  {rocket:'Falcon Heavy',mission:'Demo (Starman Roadster)',net:'2018-02-06T20:45:00Z',status:'Success',provider:'SpaceX',pad:'LC-39A',lat:28.6083,lon:-80.6041,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'Heliocentric',desc:'Two side boosters landed side by side. A Tesla Roadster was sent into orbit around the Sun.'},
  {rocket:'Falcon 9',mission:'Crew Dragon Demo-2',net:'2020-05-30T19:22:00Z',status:'Success',provider:'SpaceX',pad:'LC-39A',lat:28.6083,lon:-80.6041,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'LEO',desc:'First crewed orbital flight by a private company, and first US crew launch since 2011.'},
  {rocket:'Ariane 5',mission:'James Webb Space Telescope',net:'2021-12-25T12:20:00Z',status:'Success',provider:'Arianespace',pad:'ELA-3',lat:5.239,lon:-52.768,site:'Guiana Space Centre, French Guiana',cc:'GF',orbit:'L2',desc:'Largest space telescope ever launched. It orbits the Sun–Earth L2 point, 1.5 million km away.'},
  {rocket:'SLS Block 1',mission:'Artemis I',net:'2022-11-16T06:47:00Z',status:'Success',provider:'NASA',pad:'LC-39B',lat:28.6272,lon:-80.6208,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'Lunar',desc:'Uncrewed test of SLS and Orion around the Moon, setting up the Artemis crewed flights.'},
  {rocket:'LVM3',mission:'Chandrayaan-3',net:'2023-07-14T09:05:00Z',status:'Success',provider:'ISRO',pad:'Second Launch Pad',lat:13.7199,lon:80.2304,site:'Satish Dhawan Space Centre, India',cc:'IN',orbit:'Lunar',desc:'Made India the 4th country to soft-land on the Moon, and the first near the south pole.'},
  {rocket:'Starship',mission:'Flight 5 (first booster catch)',net:'2024-10-13T12:25:00Z',status:'Success',provider:'SpaceX',pad:'Orbital Launch Pad 1',lat:25.9968,lon:-97.1554,site:'SpaceX Starbase, TX, USA',cc:'US',orbit:'Suborbital',desc:'The launch tower’s "chopstick" arms caught the 71 m Super Heavy booster out of the air.'},
  {rocket:'SLS Block 1',mission:'Artemis II (crewed lunar flyby)',net:'2026-04-01T22:35:00Z',status:'Success',provider:'NASA',pad:'LC-39B',lat:28.6272,lon:-80.6208,site:'Kennedy Space Center, FL, USA',cc:'US',orbit:'Lunar flyby',desc:'First crewed Moon mission in over 50 years: Wiseman, Glover, Koch and Hansen flew around the Moon. 695,081 miles in 9 days, 1 hour, 32 minutes.'},
  {rocket:'Starship',mission:'Flight 14 (first orbital flight)',net:'2026-09-28T12:48:00Z',status:'Success',provider:'SpaceX',pad:'Orbital Launch Pad 2',lat:25.99677,lon:-97.15799,site:'SpaceX Starbase, TX, USA',cc:'US',orbit:'LEO',desc:'First Starship to reach orbit and deploy Starlink satellites, despite losing one of its six engines on ascent.'}
];

// ---------- Rocket catalog (approximate public specs) ----------
// geometry: parts stacked bottom→top in meters
const ROCKETS = {
  falcon9:{name:'Falcon 9 Block 5',maker:'SpaceX',country:'US',height:70,dia:3.7,mass:'549 t',leo:'22.8 t (expendable), ~17 t reusable',gto:'8.3 t',engines:'9 × Merlin 1D + 1 × Merlin Vacuum',fuel:'RP-1 (kerosene) + liquid oxygen',stages:2,first:'2010 (Block 5: 2018)',reuse:'First stage lands on a drone ship or landing zone; fairings recovered',fact:'Most-flown rocket today. One booster (B1067) has flown 37 times.',
    parts:[{h:41.2,r:1.85,c:'white',stage:1,label:'1st stage'},{h:6.7,r:1.85,c:'dark',stage:1,label:'Interstage'},{h:12.6,r:1.85,c:'white',stage:2,label:'2nd stage'},{h:13.1,r:2.6,fairing:true,c:'white',stage:3,label:'Payload fairing'}],
    eng:{n:9,layout:'octaweb',bell:.45},legs:4,gridfins:true,logo:'SPACEX'},
  falconheavy:{name:'Falcon Heavy',maker:'SpaceX',country:'US',height:70,dia:12.2,mass:'1,421 t',leo:'63.8 t (expendable)',gto:'26.7 t',engines:'27 × Merlin 1D (3 cores) + 1 × MVac',fuel:'RP-1 + liquid oxygen',stages:2,first:'2018',reuse:'Both side boosters return and land side by side',fact:'Launched a Tesla Roadster to orbit the Sun on its first flight.',
    parts:[{h:41.2,r:1.85,c:'white',stage:1,label:'Center core'},{h:6.7,r:1.85,c:'dark',stage:1},{h:12.6,r:1.85,c:'white',stage:2,label:'2nd stage'},{h:13.1,r:2.6,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:2,r:1.85,h:44,nose:4.5,c:'white',gap:.25,heavy:true},eng:{n:9,layout:'octaweb',bell:.45},legs:4,gridfins:true,logo:'SPACEX'},
  starship:{name:'Starship (V3)',maker:'SpaceX',country:'US',height:124,dia:9,mass:'~5,000 t',leo:'100+ t (fully reusable goal)',gto:'—',engines:'33 × Raptor (Super Heavy) + 6 × Raptor (Ship)',fuel:'Liquid methane + liquid oxygen',stages:2,first:'2023',reuse:'Booster caught by the launch tower’s arms; Ship designed to land too',fact:'Largest and most powerful rocket ever. First reached orbit on Flight 14 (Sept 2026).',
    parts:[{h:72,r:4.5,c:'steel',stage:1,label:'Super Heavy booster'},{h:2,r:4.5,c:'dark',stage:1,label:'Hot-staging ring'},{h:42,r:4.5,c:'steel',stage:2,label:'Starship (upper stage)'},{h:8,r:4.5,nose:true,c:'steel',stage:2}],
    eng:{n:33,layout:'rings',bell:.7},gridfins:true,flaps:true,logo:''},
  electron:{name:'Electron',maker:'Rocket Lab',country:'US/NZ',height:18,dia:1.2,mass:'13 t',leo:'~300 kg',gto:'—',engines:'9 × Rutherford + 1 × Rutherford Vacuum',fuel:'RP-1 + LOX, electric-pump fed',stages:2,first:'2017',reuse:'Some boosters recovered from the ocean after parachute splashdown',fact:'Carbon-fiber body, and its engines use battery-powered electric pumps — a first.',
    parts:[{h:12.1,r:.6,c:'black',stage:1,label:'1st stage'},{h:.8,r:.6,c:'black',stage:1},{h:2.4,r:.6,c:'black',stage:2,label:'2nd stage'},{h:2.7,r:.65,fairing:true,c:'black',stage:3,label:'Fairing'}],
    eng:{n:9,layout:'octaweb',bell:.14},logo:'ROCKET LAB'},
  vulcan:{name:'Vulcan Centaur',maker:'United Launch Alliance',country:'US',height:61.6,dia:5.4,mass:'—',leo:'27.2 t',gto:'~15 t',engines:'2 × BE-4 + up to 6 GEM 63XL boosters; Centaur V: 2 × RL10',fuel:'Liquid methane + LOX; hydrogen upper stage',stages:2,first:'2024',reuse:'Expendable',fact:'Successor to Atlas V and Delta IV. Its first stage burns methane, like Starship.',
    parts:[{h:33.3,r:2.7,c:'tan',stage:1,label:'Core (BE-4)'},{h:3,r:2.7,c:'white',stage:1},{h:11.7,r:2.7,c:'white',stage:2,label:'Centaur V'},{h:15.5,r:2.7,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:6,r:.8,h:22,nose:2.5,c:'white',gap:.05},eng:{n:2,layout:'line',bell:1},logo:'ULA'},
  newglenn:{name:'New Glenn',maker:'Blue Origin',country:'US',height:98,dia:7,mass:'—',leo:'45 t',gto:'13 t',engines:'7 × BE-4 + 2 × BE-3U',fuel:'Liquid methane + LOX; hydrogen upper stage',stages:2,first:'2025',reuse:'First stage designed for 25 flights, lands on a ship',fact:'Its 7 m fairing is twice the volume of standard 5 m fairings.',
    parts:[{h:57.5,r:3.5,c:'white',stage:1,label:'1st stage (GS1)'},{h:3,r:3.5,c:'dark',stage:1},{h:16.5,r:3.5,c:'white',stage:2,label:'2nd stage (GS2)'},{h:21.9,r:3.5,fairing:true,c:'white',stage:3,label:'7 m fairing'}],
    eng:{n:7,layout:'ring',bell:.8},legs:6,strakes:true,logo:'BLUE ORIGIN'},
  sls:{name:'SLS Block 1',maker:'NASA / Boeing',country:'US',height:98,dia:8.4,mass:'2,610 t',leo:'95 t',gto:'—',engines:'4 × RS-25 + 2 five-segment solid boosters',fuel:'Liquid hydrogen + LOX; solid boosters',stages:2,first:'2022 (Artemis I)',reuse:'Expendable',fact:'Launched Artemis II in April 2026, the first crewed Moon mission since 1972.',
    parts:[{h:65,r:4.2,c:'orange',stage:1,label:'Core stage'},{h:9,r:2.5,r2:4.2,c:'white',stage:2,label:'ICPS'},{h:5,r:2.5,c:'white',stage:3,label:'Orion'},{h:17,r:2.5,tower:true,c:'white',stage:3,label:'Launch abort tower'}],
    boosters:{n:2,r:1.85,h:54,nose:6,c:'white',gap:.3},eng:{n:4,layout:'square',bell:1.1},logo:'NASA'},
  ariane6:{name:'Ariane 6 (A64)',maker:'ArianeGroup / Arianespace',country:'EU',height:62,dia:5.4,mass:'~860 t',leo:'21.6 t',gto:'11.5 t',engines:'Vulcain 2.1 + Vinci + 4 × P120C boosters',fuel:'Liquid hydrogen + LOX; solid boosters',stages:2,first:'2024',reuse:'Expendable',fact:'Vinci upper stage can restart several times to drop satellites in different orbits.',
    parts:[{h:30,r:2.7,c:'white',stage:1,label:'Core (Vulcain 2.1)'},{h:2,r:2.7,c:'dark',stage:1},{h:11.6,r:2.7,c:'white',stage:2,label:'Upper stage (Vinci)'},{h:18.4,r:2.7,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:4,r:1.7,h:13.5,nose:3,c:'white',gap:.05},eng:{n:1,layout:'one',bell:1.1},logo:'ARIANE 6'},
  soyuz:{name:'Soyuz-2.1b',maker:'Progress RSC',country:'RU',height:46.3,dia:2.95,mass:'312 t',leo:'8.2 t',gto:'3.25 t',engines:'RD-107A ×4 boosters, RD-108A core, RD-0124 3rd stage',fuel:'Kerosene + LOX',stages:3,first:'2006 (family: 1966)',reuse:'Expendable',fact:'Its 4 boosters separate in the "Korolev Cross" — a ring of four in the sky.',
    parts:[{h:27.1,r:1.47,r2:1.1,c:'grey',stage:1,label:'Core (2nd stage)'},{h:3,r:1.33,c:'dark',stage:1},{h:6.7,r:1.33,c:'grey',stage:2,label:'3rd stage'},{h:9.5,r:1.65,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:4,r:1.0,h:19.6,nose:5,c:'grey',gap:-.4,cone:true},eng:{n:4,layout:'square',bell:.4},logo:''},
  lm5:{name:'Long March 5',maker:'CALT / CASC',country:'CN',height:57,dia:5,mass:'869 t',leo:'25 t',gto:'14 t',engines:'2 × YF-77 core, 8 × YF-100 boosters, 2 × YF-75D upper',fuel:'LH2/LOX core; kerosene/LOX boosters',stages:2,first:'2016',reuse:'Expendable',fact:'Launched Tianwen-1 to Mars and Chang’e 5 & 6, which brought back Moon samples.',
    parts:[{h:33,r:2.5,c:'white',stage:1,label:'Core stage'},{h:2,r:2.5,c:'dark',stage:1},{h:11.5,r:2.5,c:'white',stage:2,label:'2nd stage'},{h:12.5,r:2.6,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:4,r:1.675,h:27.6,nose:3,c:'white',gap:.05},eng:{n:2,layout:'line',bell:.9},logo:'中国航天'},
  lm2f:{name:'Long March 2F',maker:'CALT / CASC',country:'CN',height:62,dia:3.35,mass:'464 t',leo:'8.4 t',gto:'—',engines:'4+4 × YF-20B, YF-24B upper',fuel:'Hypergolic (N2O4 + UDMH)',stages:2,first:'1999',reuse:'Expendable',fact:'China’s crew launcher: it flies Shenzhou astronauts to the Tiangong space station.',
    parts:[{h:23.7,r:1.675,c:'white',stage:1,label:'1st stage'},{h:2,r:1.675,c:'dark',stage:1},{h:13.5,r:1.675,c:'white',stage:2,label:'2nd stage'},{h:13,r:1.9,fairing:true,c:'white',stage:3,label:'Shenzhou fairing'},{h:9,r:.35,tower:true,c:'white',stage:3,label:'Escape tower'}],
    boosters:{n:4,r:1.125,h:16,nose:3.5,c:'white',gap:.05,cone:true},eng:{n:4,layout:'square',bell:.5},logo:''},
  lm2d:{name:'Long March 2D',maker:'SAST / CASC',country:'CN',height:41,dia:3.35,mass:'~240 t',leo:'3.5 t',gto:'—',engines:'4 × YF-21C, YF-24C upper',fuel:'Hypergolic (N2O4 + UDMH)',stages:2,first:'1992',reuse:'Expendable',fact:'A reliable workhorse for Earth-observation and science satellites.',
    parts:[{h:27.9,r:1.675,c:'white',stage:1,label:'1st stage'},{h:1.5,r:1.675,c:'dark',stage:1},{h:7,r:1.675,c:'white',stage:2,label:'2nd stage'},{h:5,r:1.7,fairing:true,c:'white',stage:3,label:'Fairing'}],
    eng:{n:4,layout:'square',bell:.5},logo:''},
  pslv:{name:'PSLV-XL',maker:'ISRO',country:'IN',height:44,dia:2.8,mass:'320 t',leo:'3.8 t',gto:'1.4 t',engines:'S139 solid, Vikas, PS3 solid, 2 × PS4',fuel:'Alternating solid and liquid stages',stages:4,first:'1993',reuse:'Expendable',fact:'Launched India’s Mars Orbiter Mission and, once, 104 satellites in a single flight (2017).',
    parts:[{h:20,r:1.4,c:'white',stage:1,label:'PS1 (solid)'},{h:12.8,r:1.4,c:'white',stage:2,label:'PS2 (Vikas)'},{h:3.6,r:1.0,r2:1.4,c:'dark',stage:2,label:'PS3'},{h:3,r:1.0,c:'grey',stage:2,label:'PS4'},{h:4.6,r:1.6,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:6,r:.5,h:13.5,nose:1.8,c:'white',gap:.05},eng:{n:1,layout:'one',bell:.9},logo:'ISRO'},
  lvm3:{name:'LVM3 (GSLV Mk III)',maker:'ISRO',country:'IN',height:43.5,dia:4,mass:'640 t',leo:'~10 t',gto:'4 t',engines:'2 × S200 solid boosters, 2 × Vikas, CE-20 cryogenic',fuel:'Solid + hypergolic + LH2/LOX',stages:3,first:'2014 (orbital 2017)',reuse:'Expendable',fact:'Launched Chandrayaan-3, which landed near the Moon’s south pole in 2023.',
    parts:[{h:21,r:2,c:'white',stage:1,label:'L110 core'},{h:13.5,r:2,c:'white',stage:2,label:'C25 cryo stage'},{h:9,r:2.5,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:2,r:1.6,h:25,nose:4,c:'grey',gap:.15},eng:{n:2,layout:'line',bell:.6},logo:'ISRO'},
  h3:{name:'H3',maker:'JAXA / Mitsubishi Heavy Industries',country:'JP',height:63,dia:5.2,mass:'—',leo:'—',gto:'6.5 t',engines:'2–3 × LE-9 + 0/2/4 SRB-3; LE-5B-3 upper',fuel:'Liquid hydrogen + LOX',stages:2,first:'2023 (first success 2024)',reuse:'Expendable',fact:'Japan’s new flagship rocket, designed to halve launch costs versus H-IIA.',
    parts:[{h:37,r:2.6,c:'orange2',stage:1,label:'1st stage (LE-9)'},{h:2,r:2.6,c:'white',stage:1},{h:11,r:2.6,c:'white',stage:2,label:'2nd stage'},{h:13,r:2.6,fairing:true,c:'white',stage:3,label:'Fairing'}],
    boosters:{n:2,r:1.25,h:15,nose:2.2,c:'white',gap:.05},eng:{n:2,layout:'line',bell:.9},logo:'JAXA'},
  saturnv:{name:'Saturn V',maker:'NASA (Boeing, North American, Douglas)',country:'US',height:110.6,dia:10.1,mass:'2,970 t',leo:'140 t',gto:'—',engines:'5 × F-1, 5 × J-2, 1 × J-2',fuel:'RP-1/LOX first stage; LH2/LOX upper stages',stages:3,first:'1967 (last flight 1973)',reuse:'Expendable',fact:'Carried all 24 Apollo astronauts who traveled to the Moon. Still one of the tallest rockets ever flown.',
    parts:[{h:42,r:5.05,c:'whiteblack',stage:1,label:'S-IC (5 × F-1)'},{h:5,r:5.05,c:'white',stage:1},{h:20,r:5.05,c:'white',stage:2,label:'S-II'},{h:3,r:3.3,r2:5.05,c:'white',stage:2},{h:17.8,r:3.3,c:'whiteblack',stage:3,label:'S-IVB'},{h:9,r:3.3,c:'white',stage:3,label:'Lunar Module adapter'},{h:4,r:2,r2:3.3,c:'white',stage:3,label:'Command/Service Module'},{h:10,r:.35,tower:true,c:'white',stage:3,label:'Launch escape tower'}],
    eng:{n:5,layout:'cross',bell:1.8},fins:true,logo:'USA'},
  generic:{name:'Small launcher',maker:'—',country:'',height:30,dia:2,mass:'—',leo:'~1 t',gto:'—',engines:'—',fuel:'—',stages:2,first:'—',reuse:'—',fact:'Generic model used when the exact rocket isn’t in the catalog yet.',
    parts:[{h:17,r:1,c:'white',stage:1,label:'1st stage'},{h:1,r:1,c:'dark',stage:1},{h:6,r:1,c:'white',stage:2,label:'Upper stage'},{h:6,r:1.15,fairing:true,c:'white',stage:3,label:'Fairing'}],
    eng:{n:4,layout:'square',bell:.3},logo:''}
};
function rocketKey(name){ const n=(name||'').toLowerCase();
  if(n.includes('starship')) return 'starship';
  if(n.includes('falcon heavy')) return 'falconheavy';
  if(n.includes('falcon')) return 'falcon9';
  if(n.includes('electron')) return 'electron';
  if(n.includes('vulcan')||n.includes('atlas')) return 'vulcan';
  if(n.includes('new glenn')) return 'newglenn';
  if(n.includes('sls')) return 'sls';
  if(n.includes('saturn')) return 'saturnv';
  if(n.includes('ariane')) return 'ariane6';
  if(n.includes('soyuz')||n.includes('r-7')||n.includes('vostok')) return 'soyuz';
  if(/long march (5|7)/.test(n)) return 'lm5';
  if(n.includes('long march 2f')) return 'lm2f';
  if(n.includes('long march')) return 'lm2d';
  if(n.includes('pslv')||n.includes('gslv mk ii')) return 'pslv';
  if(n.includes('lvm3')||n.includes('gslv')) return 'lvm3';
  if(/\bh3\b/.test(n)) return 'h3';
  return 'generic'; }

// ---------- Moon landings ----------
const MOON = [
  {n:'Luna 9',y:1966,lat:7.08,lon:-64.37,who:'USSR',crew:false,d:'First soft landing on the Moon and first photos from its surface.'},
  {n:'Surveyor 1',y:1966,lat:-2.47,lon:-43.34,who:'USA',crew:false,d:'First US soft landing; proved the surface could support a lander.'},
  {n:'Apollo 11',y:1969,lat:0.674,lon:23.473,who:'USA',crew:true,d:'Armstrong and Aldrin: the first humans on the Moon (Sea of Tranquility), July 20, 1969.'},
  {n:'Apollo 12',y:1969,lat:-3.012,lon:-23.422,who:'USA',crew:true,d:'Pinpoint landing next to the Surveyor 3 probe.'},
  {n:'Luna 16',y:1970,lat:-0.513,lon:56.364,who:'USSR',crew:false,d:'First robotic sample return from the Moon.'},
  {n:'Luna 17 / Lunokhod 1',y:1970,lat:38.24,lon:-35.0,who:'USSR',crew:false,d:'First remote-controlled rover on another world.'},
  {n:'Apollo 14',y:1971,lat:-3.645,lon:-17.471,who:'USA',crew:true,d:'Alan Shepard hit golf balls on the Moon.'},
  {n:'Apollo 15',y:1971,lat:26.132,lon:3.634,who:'USA',crew:true,d:'First use of the Lunar Roving Vehicle.'},
  {n:'Apollo 16',y:1972,lat:-8.973,lon:15.5,who:'USA',crew:true,d:'Only Apollo landing in the lunar highlands.'},
  {n:'Apollo 17',y:1972,lat:20.191,lon:30.772,who:'USA',crew:true,d:'Last humans on the Moon (so far). Geologist Harrison Schmitt flew on it.'},
  {n:'Luna 24',y:1976,lat:12.71,lon:62.21,who:'USSR',crew:false,d:'Last Soviet Moon mission; returned 170 g of soil.'},
  {n:'Chang’e 3 / Yutu',y:2013,lat:44.12,lon:-19.51,who:'China',crew:false,d:'First soft landing since 1976.'},
  {n:'Chang’e 4 / Yutu-2',y:2019,lat:-45.44,lon:177.6,who:'China',crew:false,d:'First landing on the far side of the Moon.'},
  {n:'Chang’e 5',y:2020,lat:43.06,lon:-51.92,who:'China',crew:false,d:'Returned 1.7 kg of young lunar rock to Earth.'},
  {n:'Chandrayaan-3',y:2023,lat:-69.37,lon:32.32,who:'India',crew:false,d:'India’s first soft landing, the closest to the south pole at the time.'},
  {n:'SLIM',y:2024,lat:-13.32,lon:25.25,who:'Japan',crew:false,d:'"Moon sniper": landed within ~10 m of its target, though upside down.'},
  {n:'IM-1 Odysseus',y:2024,lat:-80.13,lon:1.44,who:'USA (Intuitive Machines)',crew:false,d:'First commercial lander to reach the surface; tipped on its side.'},
  {n:'Chang’e 6',y:2024,lat:-41.64,lon:-153.99,who:'China',crew:false,d:'First samples ever returned from the far side.'},
  {n:'Blue Ghost Mission 1',y:2025,lat:18.56,lon:61.81,who:'USA (Firefly)',crew:false,d:'First fully successful, upright commercial Moon landing (Mare Crisium).'},
  {n:'IM-2 Athena',y:2025,lat:-84.8,lon:29.2,who:'USA (Intuitive Machines)',crew:false,d:'Reached the south-pole region but ended up on its side.'}
];
const MOON_NEXT = [
  {n:'Chang’e 7 (target)',lat:-88.8,lon:123.4,who:'China',d:'Orbiter, lander, rover and hopper to hunt for water ice at Shackleton Crater. Launch slipped from Aug 2026 to 2027.'},
  {n:'Blue Moon MK1 “Endurance” (target)',lat:-89.4,lon:-130,who:'USA (Blue Origin / NASA Moon Base I)',d:'Uncrewed cargo lander for NASA’s Moon Base I mission, aiming near the south pole. Blue Origin has not announced an official launch date.'}
];

// ---------- Solar system ----------
// J2000 mean longitude (deg), period (days), semi-major axis (AU)
const PLANETS = [
  {n:'Mercury',a:.387,L0:252.25,P:87.969,r:.28,c:0x9d978f,info:'Smallest planet. The European-Japanese BepiColombo mission was scheduled to enter orbit around it on Nov 21, 2026.'},
  {n:'Venus',a:.723,L0:181.98,P:224.701,r:.45,c:0xe8c27a,info:'Hottest planet (~465 °C) because of its thick CO₂ atmosphere.'},
  {n:'Earth',a:1,L0:100.46,P:365.256,r:.47,c:0x3f7dff,info:'Home. ~17,000 active satellites orbit it right now.'},
  {n:'Mars',a:1.524,L0:355.45,P:686.98,r:.36,c:0xd2603a,info:'Rovers Perseverance and Curiosity are driving here; ~7 orbiters circle it.'},
  {n:'Jupiter',a:5.203,L0:34.40,P:4332.59,r:1.1,c:0xd9b38c,info:'Largest planet. NASA’s Juno orbits it; Europa Clipper arrives in 2030, JUICE in 2031.'},
  {n:'Saturn',a:9.537,L0:49.94,P:10759.22,r:.95,c:0xe6d4a3,ring:true,info:'Its moon Titan will get the Dragonfly drone (launch planned 2028).'},
  {n:'Uranus',a:19.19,L0:313.23,P:30688.5,r:.65,c:0x9fe3e8,info:'Tipped on its side; visited only once, by Voyager 2 in 1986.'},
  {n:'Neptune',a:30.07,L0:304.88,P:60182,r:.63,c:0x4a6cff,info:'Farthest planet. Voyager 2 flew past it in 1989.'}
];
// ecliptic longitude/latitude for spacecraft outside planet frames (approximate)
const CRAFT = [
  {n:'Voyager 1',at:{lon:255,lat:35,au:173.2},launched:'Sep 5, 1977, Titan IIIE',agency:'NASA',info:'Farthest human-made object. Reached one light-day (25.9 billion km) from Earth on Nov 18, 2026. In interstellar space since 2012.',live:{km:25902068356,t:'2026-11-18T10:16:07Z',kms:16.9}},
  {n:'Voyager 2',at:{lon:289,lat:-35,au:144},launched:'Aug 20, 1977, Titan IIIE',agency:'NASA',info:'Only spacecraft to visit Uranus and Neptune. Interstellar since 2018; travels ~3.2 AU per year and should hit one light-day around 2035.',live:{km:144*149597870.7,t:'2026-11-22T00:00:00Z',kms:15.2},approx:true},
  {n:'New Horizons',at:{lon:290,lat:2,au:64},launched:'Jan 19, 2006, Atlas V',agency:'NASA',info:'Flew past Pluto (2015) and Arrokoth (2019), the most distant object ever explored up close.',approx:true},
  {n:'Juno',planet:'Jupiter',off:[1.6,.4],launched:'Aug 5, 2011, Atlas V',agency:'NASA',info:'Orbiting Jupiter since 2016, studying its interior, poles and moons.'},
  {n:'Europa Clipper',planet:'Earth',off:[1.0,.6],launched:'Oct 14, 2024, Falcon Heavy',agency:'NASA',info:'Biggest planetary probe NASA has built. Gets an Earth gravity assist in early December 2026, then arrives at Jupiter in April 2030 to study Europa’s ocean.'},
  {n:'JUICE',planet:'Earth',off:[-1.2,.5],launched:'Apr 14, 2023, Ariane 5',agency:'ESA',info:'Jupiter Icy Moons Explorer. Using Earth/Venus flybys to reach Jupiter in 2031; later becomes the first spacecraft to orbit another planet’s moon (Ganymede).'},
  {n:'Psyche',near:'Mars',dlon:35,au:1.9,launched:'Oct 13, 2023, Falcon Heavy',agency:'NASA',info:'Used a gravity assist from Mars on May 15, 2026, and is now headed for the metal-rich asteroid 16 Psyche, arriving in 2029. It cruises on solar-electric thrusters.',approx:true},
  {n:'Lucy',near:'Jupiter',dlon:60,au:5.2,launched:'Oct 16, 2021, Atlas V',agency:'NASA',info:'Reached the Trojan asteroids that lead Jupiter around the Sun in October 2026. Its first Trojan flyby, Eurybates and its moon Queta, is in August 2027.',approx:true},
  {n:'BepiColombo',planet:'Mercury',off:[.7,.3],launched:'Oct 20, 2018, Ariane 5',agency:'ESA / JAXA',info:'Scheduled to be captured into orbit around Mercury on Nov 21, 2026, after eight years in flight. The two orbiters separate in December and science begins in April 2027.'},
  {n:'Parker Solar Probe',at:{lon:40,lat:3,au:.12},launched:'Aug 12, 2018, Delta IV Heavy',agency:'NASA',info:'Fastest human-made object (~690,000 km/h at closest approach), flying through the Sun’s outer atmosphere.',approx:true},
  {n:'JWST',planet:'Earth',off:[.55,-.5],launched:'Dec 25, 2021, Ariane 5',agency:'NASA / ESA / CSA',info:'Orbits the Sun–Earth L2 point, 1.5 million km from Earth, observing in infrared.'},
  {n:'Perseverance & Curiosity',planet:'Mars',off:[.6,.5],launched:'2020 & 2011, Atlas V',agency:'NASA',info:'Two rovers on Mars. Perseverance is caching rock samples in Jezero Crater; Curiosity is climbing Mount Sharp.'}
];

// ---------- Numbers (sourced, Nov 2026) ----------
const STATS = [
  {v:'17,099',k:'Active satellites',s:'McDowell catalog, Oct 26 2026'},
  {v:'11,148',k:'of them Starlink',s:'about 2 in every 3'},
  {v:'34,946',k:'Tracked objects in orbit',s:'satellites, rocket bodies, debris'},
  {v:'170',k:'SpaceX launches in 2025',s:'165 Falcon 9, 5 Starship'},
  {v:'37',k:'Flights by one booster',s:'B1067 record, Aug 2026'},
  {v:'600+',k:'Falcon booster landings',s:'600th in April 2026'},
  {v:'695,081 mi',k:'Artemis II round trip',s:'crewed lunar flyby, April 2026'},
  {v:'1 light-day',k:'Voyager 1 distance',s:'reached Nov 18, 2026'}
];

const GLOSSARY = [
  ['LEO','Low Earth Orbit, about 160–2,000 km up. ISS (~400 km) and Starlink live here. Orbital speed ≈ 7.8 km/s (28,000 km/h).'],
  ['SSO','Sun-synchronous orbit: a near-polar LEO that passes over each place at the same local time. Ideal for imaging.'],
  ['PO','Polar orbit: passes over both poles, so it sees the whole planet. Launched southward from Vandenberg.'],
  ['MEO','Medium Earth Orbit (~2,000–35,786 km). GPS, Galileo and GLONASS navigation satellites.'],
  ['GTO / GEO','Geostationary orbit at 35,786 km: one orbit per day, so a satellite “hovers” over one spot. GTO is the transfer orbit used to get there.'],
  ['Max-Q','Moment of maximum aerodynamic pressure on the rocket, usually ~1 minute after liftoff at ~11–14 km altitude.'],
  ['MECO / SECO','Main Engine Cut-Off (first stage done) / Second Engine Cut-Off (orbit reached).'],
  ['Staging','Dropping empty tanks and engines mid-flight so the rest of the rocket is lighter. Why most rockets have 2–3 stages.'],
  ['Δv (delta-v)','“Change in velocity” budget. Reaching LEO costs ~9.4 km/s including gravity and drag losses.'],
  ['Escape velocity','11.2 km/s from Earth’s surface: fast enough to leave Earth’s gravity for good (Moon, Mars, deep space).'],
  ['NET','“No Earlier Than”: launch dates are targets that often slip.'],
  ['RTLS / ASDS','Return To Launch Site landing vs Autonomous Spaceport Drone Ship landing at sea (SpaceX boosters).'],
  ['Gravity assist','Flying close to a planet to steal some of its orbital momentum and change speed or direction for free.'],
  ['Light-day','Distance light travels in 24 h: ~25.9 billion km. Voyager 1 just passed it.']
];

// ---------- Constellations (Satellites tab) ----------
// shells: [altitude km, inclination deg, share of dots]
const CONSTELLATIONS = [
  {id:'starlink',name:'Starlink',owner:'SpaceX',cc:'US',kind:'private',count:'11,148',countNote:'working satellites, Oct 26 2026',color:0xeaf2ff,dots:2787,size:.0085,
   shells:[[550,53,.34],[540,53.2,.24],[530,43,.24],[570,70,.09],[560,97.6,.09]],alt:'about 480–570 km',inc:'43°, 53°, 70° and 97.6°',
   purpose:'Internet for homes, ships, planes and remote sites. About 650 of the satellites also connect directly to ordinary phones.',
   facts:'About two of every three working satellites in orbit belong to SpaceX. Each one is designed to be steered down to burn up in the atmosphere at the end of its roughly five-year life.'},
  {id:'oneweb',name:'Eutelsat OneWeb',owner:'Eutelsat',cc:'FR',kind:'private',count:'~650',countNote:'mid-2026',color:0x7fd1ff,dots:650,size:.009,
   shells:[[1200,87.9,1]],planes:18,alt:'1,200 km',inc:'87.9° (near-polar)',
   purpose:'Broadband for businesses, governments, airlines and ships rather than individual homes.',
   facts:'Its higher, near-polar orbits give it good coverage of the Arctic. It was the second-largest constellation until Amazon started catching up.'},
  {id:'amazon',name:'Amazon Leo',owner:'Amazon',cc:'US',kind:'private',count:'396',countNote:'launched as of Nov 9 2026',color:0xffb347,dots:396,size:.01,
   shells:[[630,51.9,.45],[610,42,.35],[590,33,.2]],alt:'590–630 km',inc:'33°, 42° and 51.9°',
   purpose:'Consumer and business broadband, built to compete with Starlink. Amazon says service starts before the end of 2026 in the US, UK, France, Germany and Canada.',
   facts:'Formerly Project Kuiper, renamed in November 2025. Licensed for 3,236 satellites, it missed the FCC’s target of 1,616 by July 2026, and 40 satellites were lost when Vulcan failed on Nov 15 2026.'},
  {id:'ast',name:'AST SpaceMobile BlueBird',owner:'AST SpaceMobile',cc:'US',kind:'private',count:'13',countNote:'launched as of Aug 2026',color:0xff7aa8,dots:13,size:.035,
   shells:[[520,53,1]],alt:'about 520 km',inc:'53°',
   purpose:'Cell service from space straight to unmodified smartphones, with partners including AT&T and Verizon.',
   facts:'Each next-generation BlueBird unfolds an antenna array of about 2,400 sq ft (223 m²), the largest commercial communications arrays in low orbit.'},
  {id:'iridium',name:'Iridium NEXT',owner:'Iridium',cc:'US',kind:'private',count:'66',countNote:'active, plus in-orbit spares',color:0x9cff9c,dots:66,size:.018,
   shells:[[780,86.4,1]],planes:6,alt:'780 km',inc:'86.4° (polar)',
   purpose:'Satellite phones, messaging and tracking for ships, aircraft and remote workers.',
   facts:'Six planes of eleven satellites cover the whole planet, poles included, and pass calls between each other in space.'},
  {id:'qianfan',name:'Qianfan (Thousand Sails)',owner:'Shanghai Spacecom (state-backed)',cc:'CN',kind:'state',count:'248',countNote:'in orbit, Nov 2026',color:0xff6b5b,dots:248,size:.01,
   shells:[[1000,89,1]],planes:14,alt:'high LEO, polar (drawn at ~1,000 km)',inc:'near-polar',
   purpose:'Chinese broadband constellation aiming for up to about 15,000 satellites by the 2030s.',
   facts:'Run by a Shanghai government-backed company. Its launches come in batches of 18 satellites, mostly on Long March 6A and 8 rockets.'},
  {id:'guowang',name:'Guowang (SatNet)',owner:'China Satellite Network Group (state-owned)',cc:'CN',kind:'state',count:'231',countNote:'in orbit, Nov 2026',color:0xffd35b,dots:231,size:.01,
   shells:[[1145,50,.5],[590,86,.5]],alt:'two layers: ~1,145 km and roughly half that',inc:'drawn at 50° and 86° (illustrative)',
   purpose:'China’s national broadband network, planned at around 13,000 satellites.',
   facts:'Several test satellites suggest government and military uses alongside internet service, such as signals intelligence and positioning.'}
];
const ISS_TLE = ['1 25544U 98067A   26326.55861648  .00009004  00000+0  16808-3 0  9990','2 25544  51.6321 236.3579 0007404  53.9088 306.2585 15.49552037596306'];
const ISS_CREW = [
  ['Pyotr Dubrov','Roscosmos, commander'],['Anna Kikina','Roscosmos'],['Anil Menon','NASA'],
  ['Jessica Watkins','NASA'],['Luke Delaney','NASA'],['Joshua Kutryk','CSA (Canada)'],['Sergey Teteryatnikov','Roscosmos']];
