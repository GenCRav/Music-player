/* ═══════════════════════════════════════════════════════
   Music Player — app.js
   Features: Album Folders · Genre Auto-detect · Artist
             Auto-detect · Dark / Light Theme Toggle
═══════════════════════════════════════════════════════ */
'use strict';

// ── DOM refs ──────────────────────────────────────────
var audio          = document.getElementById('audioEl');
var playBtn        = document.getElementById('playBtn');
var playIcon       = document.getElementById('playIcon');
var pauseIcon      = document.getElementById('pauseIcon');
var prevBtn        = document.getElementById('prevBtn');
var nextBtn        = document.getElementById('nextBtn');
var shuffleBtn     = document.getElementById('shuffleBtn');
var repeatBtn      = document.getElementById('repeatBtn');
var repeatBadge    = document.getElementById('repeatBadge');
var progressTrack  = document.getElementById('progressTrack');
var progressFill   = document.getElementById('progressFill');
var currentTimeEl  = document.getElementById('currentTime');
var totalTimeEl    = document.getElementById('totalTime');
var volumeSlider   = document.getElementById('volumeSlider');
var volPct         = document.getElementById('volPct');
var muteBtn        = document.getElementById('muteBtn');
var volIcon        = document.getElementById('volIcon');
var npTitle        = document.getElementById('npTitle');
var npArtist       = document.getElementById('npArtist');
var npTags         = document.getElementById('npTags');
var npArt          = document.getElementById('npArt');
var playerHeart    = document.getElementById('playerHeart');
var trackList      = document.getElementById('trackList');
var allEmpty       = document.getElementById('allEmpty');
var favList        = document.getElementById('favList');
var favEmpty       = document.getElementById('favEmpty');
var favMeta        = document.getElementById('favMeta');
var recentList     = document.getElementById('recentList');
var recentEmpty    = document.getElementById('recentEmpty');
var recentMeta     = document.getElementById('recentMeta');
var allMeta        = document.getElementById('allMeta');
var centerColTitle = document.getElementById('centerColTitle');
var searchInput    = document.getElementById('searchInput');
var fileInput      = document.getElementById('fileInput');
var clearBtn       = document.getElementById('clearBtn');
var dropOverlay    = document.getElementById('dropOverlay');
var toast          = document.getElementById('toast');
var sortPills      = document.querySelectorAll('.sort-pill');
var themeBtn       = document.getElementById('themeBtn');
var themeIcon      = document.getElementById('themeIcon');
var newFolderBtn   = document.getElementById('newFolderBtn');
var modalOverlay   = document.getElementById('modalOverlay');
var modalClose     = document.getElementById('modalClose');
var modalCancel    = document.getElementById('modalCancel');
var modalCreate    = document.getElementById('modalCreate');
var folderNameInput= document.getElementById('folderNameInput');
var colorSwatches  = document.getElementById('colorSwatches');
var foldersList    = document.getElementById('foldersList');
var foldersEmpty   = document.getElementById('foldersEmpty');
var foldersCount   = document.getElementById('foldersCount');
var folderFilterBar= document.getElementById('folderFilterBar');
var folderFilterName=document.getElementById('folderFilterName');
var folderFilterClear=document.getElementById('folderFilterClear');

// ── State ─────────────────────────────────────────────
var playlist      = [];
var currentIdx    = -1;
var shuffle       = false;
var repeat        = 0;
var isMuted       = false;
var isPlaying     = false;
var shuffleQueue  = [];
var toastTimer    = null;
var nextId        = 0;
var imageMap      = {};
var favorites     = new Set();
var recentPlayed  = [];
var sortKey       = 'title';
var isDragging    = false;
var albumFolders  = [];   // [{id, name, color, trackIds:[]}]
var activeFolderId= null; // null = show all
var selectedColor = '#111111';
var ctxMenu       = null; // active context-menu element
var ctxTrackId    = null;

var LS_PLAYLIST  = 'mp_v2_playlist';
var LS_FAVORITES = 'mp_v2_favorites';
var LS_RECENT    = 'mp_v2_recent';
var LS_FOLDERS   = 'mp_v2_folders';
var LS_THEME     = 'mp_v2_theme';

// ── LocalStorage ──────────────────────────────────────
var _ls = (function () { try { return window.localStorage; } catch (e) { return null; } }());
function lsGet(k)    { try { return _ls ? _ls.getItem(k)    : null; } catch (e) { return null; } }
function lsSet(k, v) { try { if (_ls) _ls.setItem(k, v);           } catch (e) {} }
function lsDel(k)    { try { if (_ls) _ls.removeItem(k);            } catch (e) {} }

// ── Theme ─────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  lsSet(LS_THEME, theme);
  if (theme === 'dark') {
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/>'
      + '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>'
      + '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>'
      + '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>'
      + '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    themeBtn.title = 'Switch to light mode';
  } else {
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    themeBtn.title = 'Switch to dark mode';
  }
}
themeBtn.addEventListener('click', function () {
  var cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ── Comprehensive Genre Detection ────────────────────
// Ordered by priority — more specific first
var GENRE_MAP = [
  // Metal sub-genres
  { label: 'Heavy Metal',    words: ['heavy metal','thrash metal','death metal','black metal','doom metal','power metal','speed metal','metalcore','deathcore','symphonic metal','nu-metal','nu metal','djent'] },
  { label: 'Metal',          words: ['metal','metallica','slayer','megadeth','anthrax','iron maiden','pantera','tool','slipknot','korn','disturbed'] },
  // Rock sub-genres
  { label: 'Punk Rock',      words: ['punk','hardcore punk','post-punk','pop punk','ska punk','anarcho'] },
  { label: 'Grunge',         words: ['grunge','nirvana','pearl jam','soundgarden','alice in chains','mudhoney'] },
  { label: 'Hard Rock',      words: ['hard rock','classic rock','arena rock','ac/dc','aerosmith','guns n roses','led zeppelin','deep purple','black sabbath','ozzy'] },
  { label: 'Indie Rock',     words: ['indie rock','indie pop','lo-fi','lo fi','bedroom pop','dream pop','shoegaze','post-rock','math rock'] },
  { label: 'Alternative',    words: ['alternative','alt-rock','alt rock','radiohead','the cure','depeche','smashing pumpkins','nine inch nails','placebo'] },
  { label: 'Rock',           words: ['rock','guitar','riff','band','rollingstones','rolling stones','beatles','u2','coldplay','oasis','blur','muse'] },
  // Pop
  { label: 'K-Pop',          words: ['k-pop','kpop','bts','blackpink','twice','exo','stray kids','ive','aespa','newjeans','itzy','nct','seventeen','txt','got7','monsta x'] },
  { label: 'J-Pop',          words: ['j-pop','jpop','j pop','anime','vocaloid','hatsune','utaite','ado','yoasobi','yorushika'] },
  { label: 'Synth-Pop',      words: ['synth pop','synthpop','synth-pop','electropop','electro pop','new wave','80s pop','retrowave','darksynth'] },
  { label: 'Dance Pop',      words: ['dance pop','dancepop','bubblegum','girl group','boy band','boyband'] },
  { label: 'Pop',            words: ['pop','taylor swift','ariana grande','billie eilish','dua lipa','ed sheeran','shawn mendes','selena gomez','olivia rodrigo','harry styles','the weeknd','charlie puth','sia','adele','beyonce','rihanna'] },
  // Hip-Hop / R&B
  { label: 'Trap',           words: ['trap','mumble rap','drill','pluggnb','plugg','rage','phonk'] },
  { label: 'R&B',            words: ['r&b','rnb','rhythm and blues','soul','neo soul','new jack swing','contemporary r&b','frank ocean','sza','bryson tiller','h.e.r','usher','chris brown','miguel'] },
  { label: 'Hip-Hop',        words: ['hip hop','hip-hop','rap','hiphop','freestyle','bars','flow','verse','hook','kendrick','drake','kanye','jay-z','nas','eminem','lil wayne','cardi b','nicki minaj','travis scott','j cole','21 savage','future','metro boomin','gunna','young thug','asap rocky','tyler the creator','logic','chance the rapper','mac miller','post malone','juice wrld','xxxtentacion','lil uzi','playboi carti'] },
  // Electronic
  { label: 'Ambient',        words: ['ambient','atmospheric','drone','meditation','relaxation','sleep','nature sounds','binaural','asmr','Brian Eno','Stars of the Lid'] },
  { label: 'Lo-Fi',          words: ['lo-fi','lofi','lo fi','chillhop','study beats','coffee shop beats','late night'] },
  { label: 'House',          words: ['house','deep house','tech house','progressive house','afrohouse','afro house','funky house','disco house','chicago house','daft punk','disclosure','fisher','chris lake','john summit','fred again'] },
  { label: 'Techno',         words: ['techno','industrial techno','acid techno','detroit techno','minimal techno','berghain'] },
  { label: 'Trance',         words: ['trance','psytrance','psy trance','progressive trance','uplifting trance','goa','armin van buuren','tiesto','above & beyond'] },
  { label: 'Dubstep',        words: ['dubstep','brostep','riddim','skrillex','excision','zomboy','12th planet'] },
  { label: 'Drum & Bass',    words: ['drum and bass','drum & bass','dnb','d&b','jungle','liquid dnb','neurofunk','liquid drum'] },
  { label: 'EDM',            words: ['edm','electronic dance','big room','future house','future bass','electro house','complextro','avicii','marshmello','alan walker','zedd','martin garrix','david guetta','calvin harris','chainsmokers','illenium','odesza','flume','porter robinson'] },
  { label: 'Electronic',     words: ['electronic','electronica','synth','sequencer','808','arp','modular','moog','synthesizer','midi'] },
  // Jazz & Soul
  { label: 'Blues',          words: ['blues','twelve bar','bb king','muddy waters','robert johnson','eric clapton blues','stevie ray vaughan'] },
  { label: 'Soul',           words: ['soul','motown','sam cooke','marvin gaye','stevie wonder','aretha franklin','otis redding','james brown','al green'] },
  { label: 'Funk',           words: ['funk','funky','james brown','parliament','funkadelic','sly and the family stone','prince','bootsy'] },
  { label: 'Jazz',           words: ['jazz','bebop','swing','bossa nova','bossanova','smooth jazz','cool jazz','free jazz','coltrane','miles davis','bill evans','herbie hancock','thelonious monk','duke ellington','louis armstrong','charlie parker'] },
  // Classical
  { label: 'Classical',      words: ['classical','symphony','concerto','sonata','opus','orchestra','philharmonic','bach','beethoven','mozart','chopin','brahms','schubert','vivaldi','handel','debussy','ravel','mahler','tchaikovsky','dvorak','liszt','handel'] },
  { label: 'Opera',          words: ['opera','aria','libretto','soprano','tenor','baritone','verdi','puccini','wagner'] },
  // Country & Folk
  { label: 'Bluegrass',      words: ['bluegrass','banjo','mandolin','appalachian'] },
  { label: 'Country',        words: ['country','nashville','honky tonk','outlaw country','luke combs','morgan wallen','zach bryan','kenny rogers','dolly parton','johnny cash','garth brooks','hank williams','willie nelson'] },
  { label: 'Folk',           words: ['folk','acoustic folk','singer-songwriter','americana','bob dylan','simon & garfunkel','joni mitchell','neil young','mumford','fleet foxes','bon iver','iron and wine','sufjan'] },
  // Reggae & Caribbean
  { label: 'Dancehall',      words: ['dancehall','soca','caribbean','bashment'] },
  { label: 'Reggaeton',      words: ['reggaeton','dembow','perreo','bad bunny','j balvin','ozuna','daddy yankee','maluma','anuel','karol g','rauw alejandro','myke towers'] },
  { label: 'Reggae',         words: ['reggae','ska','rocksteady','bob marley','peter tosh','bunny wailer','burning spear','toots','the wailers','damian marley','ziggy marley','chronixx'] },
  // Latin
  { label: 'Latin',          words: ['latin','salsa','merengue','cumbia','bachata','bolero','tango','flamenco','mariachi','corrido','grupero','norteño','banda','marc anthony','celia cruz','shakira','ricky martin','enrique iglesias','pitbull','jennifer lopez','gloria estefan'] },
  // Gospel & Christian
  { label: 'Gospel',         words: ['gospel','christian','worship','praise','hymn','church','kirk franklin','tasha cobbs','maverick city','hillsong','elevation worship','bethel'] },
  // World Music
  { label: 'Afrobeats',      words: ['afrobeats','afrobeat','afropop','highlife','burna boy','wizkid','davido','tiwa savage','ckay','rema','tems','omah lay'] },
  { label: 'World',          words: ['world music','worldbeat','ethnic','traditional','indigenous','tribal','celtic','arabic','indian classical','bollywood','flamenco','fado'] },
  // Emo / Scene
  { label: 'Emo',            words: ['emo','screamo','post-hardcore','my chemical romance','fall out boy','paramore','panic at the disco','dashboard confessional','brand new','taking back sunday','hawthorne heights'] },
  // Miscellaneous
  { label: 'Soundtrack',     words: ['ost','soundtrack','score','theme','film score','movie','anime ost','game ost','video game','john williams','hans zimmer','ennio morricone','howard shore'] },
  { label: 'Children\'s',    words: ['children','kids','nursery','lullaby','baby shark','cocomelon','sesame street','disney','cartoon'] }
];

// Clean up raw genre tags from ID3 (e.g. "(17)" → "Rock")
var ID3_GENRE_NUMS = ['Blues','Classic Rock','Country','Dance','Disco','Funk','Grunge','Hip-Hop','Jazz','Metal','New Age','Oldies','Other','Pop','R&B','Rap','Reggae','Rock','Techno','Industrial','Alternative','Ska','Death Metal','Pranks','Soundtrack','Euro-Techno','Ambient','Trip-Hop','Vocal','Jazz+Funk','Fusion','Trance','Classical','Instrumental','Acid','House','Game','Sound Clip','Gospel','Noise','Alt. Rock','Bass','Soul','Punk','Space','Meditative','Instrumental Pop','Instrumental Rock','Ethnic','Gothic','Darkwave','Techno-Industrial','Electronic','Pop-Folk','Eurodance','Dream','Southern Rock','Comedy','Cult','Gangsta Rap','Top 40','Christian Rap','Pop/Funk','Jungle','Native American','Cabaret','New Wave','Psychedelic','Rave','Showtunes','Trailer','Lo-Fi','Tribal','Acid Punk','Acid Jazz','Polka','Retro','Musical','Rock & Roll','Hard Rock'];

function cleanRawGenre(raw) {
  if (!raw) return '';
  raw = raw.trim();
  // ID3v1 numeric genre like "(17)" or "17"
  var m = raw.match(/^\(?(\d+)\)?$/);
  if (m) {
    var idx = parseInt(m[1]);
    return ID3_GENRE_NUMS[idx] || '';
  }
  // Strip wrapping parens like "(Rock)"
  m = raw.match(/^\((.+)\)$/);
  if (m) return m[1].trim();
  // "Other" is useless
  if (raw.toLowerCase() === 'other' || raw.toLowerCase() === 'unknown') return '';
  return raw;
}

function inferGenre(title, artist, album, rawGenre) {
  // 1. Trust a clean ID3 genre tag first
  var cleaned = cleanRawGenre(rawGenre);
  if (cleaned) return cleaned;

  // 2. Scan all text for keyword matches (ordered, most-specific first)
  var haystack = (title + ' ' + artist + ' ' + album).toLowerCase();
  for (var gi = 0; gi < GENRE_MAP.length; gi++) {
    var entry = GENRE_MAP[gi];
    for (var wi = 0; wi < entry.words.length; wi++) {
      if (haystack.indexOf(entry.words[wi].toLowerCase()) !== -1) {
        return entry.label;
      }
    }
  }
  return '';
}

// ── Artist & Title inference from filename ────────────
// Common patterns:
//   "Artist - Title"
//   "Artist – Title" (en-dash)
//   "Artist — Title" (em-dash)
//   "01. Artist - Title"
//   "Track01 Artist - Title"
//   "Title (feat. Artist)"
//   "Title ft. Artist"
//   "Title [feat Artist]"
function parseFilename(filename) {
  var base = filename.replace(/\.[^.]+$/, '').trim();

  // Strip leading track number: "01 ", "01. ", "Track 01 - "
  base = base.replace(/^(?:track\s*)?\d{1,3}[\s.\-_]+/i, '').trim();

  var title  = null;
  var artist = null;

  // Pattern 1: "Artist - Title" / "Artist – Title" / "Artist — Title"
  var m = base.match(/^(.+?)\s+[-–—]+\s+(.+)$/);
  if (m) {
    artist = m[1].trim();
    title  = m[2].trim();
    // Strip feat from title: "Title (feat. X)" → keep title clean, note feat in artist
    var featM = title.match(/^(.+?)\s+(?:\(feat\.?|ft\.?|featuring)\s+([^)]+)\)?/i);
    if (featM) title = featM[1].trim();
    return { title: title, artist: artist };
  }

  // Pattern 2: "Title - Artist" sometimes used, but we can't tell direction
  // So try: if second part looks like a name (1-3 words, Title Case) treat as artist
  m = base.match(/^(.+?)\s+[-–—]+\s+(.+)$/);
  if (m) {
    // Already handled above
  }

  // Pattern 3: "Title (Artist)" or "Title [Artist]"
  m = base.match(/^(.+?)\s+[\[(]([^\])]+)[\])]$/);
  if (m && !/feat|ft\.|featuring|remix|version|edit|live|cover/i.test(m[2])) {
    title  = m[1].trim();
    artist = m[2].trim();
    return { title: title, artist: artist };
  }

  // Pattern 4: feat. inside title — extract featured artist
  m = base.match(/^(.+?)\s+(?:\(feat\.?|ft\.?|featuring)\s+([^)]+)\)?/i);
  if (m) {
    title  = m[1].trim();
    artist = m[2].trim();
    return { title: title, artist: artist };
  }

  // No pattern matched — filename is the title only
  return { title: base, artist: null };
}

// ── Utilities ─────────────────────────────────────────
function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
}
function timeAgo(ts) {
  var d = Math.floor((Date.now() - ts) / 1000);
  if (d < 5) return 'just now'; if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}
function showToast(msg, dur) {
  clearTimeout(toastTimer);
  toast.textContent = msg; toast.classList.add('show');
  toastTimer = setTimeout(function () { toast.classList.remove('show'); }, dur || 2200);
}
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function stripExt(n) { return n.replace(/\.[^.]+$/, ''); }

// ── Thumbnail helpers ─────────────────────────────────
function thumbSvg() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">'
       + '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
}
function thumbImg(artUrl) {
  if (artUrl) return '<img src="' + esc(artUrl) + '" alt="">';
  if (imageMap['__folder__']) return '<img src="' + esc(imageMap['__folder__']) + '" alt="">';
  return thumbSvg();
}

// ── ID3 parser ────────────────────────────────────────
function parseTags(file) {
  return new Promise(function (resolve) {
    if (typeof jsmediatags === 'undefined') {
      resolve({ title:null,artist:null,album:null,year:null,genre:null,art:null }); return;
    }
    jsmediatags.read(file, {
      onSuccess: function (tag) {
        var t = tag.tags || {};
        var artUrl = null;
        if (t.picture) {
          try { artUrl = URL.createObjectURL(new Blob([new Uint8Array(t.picture.data)],{type:t.picture.format})); } catch(e){}
        }
        resolve({ title:t.title||null, artist:t.artist||null, album:t.album||null,
                  year:t.year||null, genre:t.genre||null, art:artUrl });
      },
      onError: function () {
        resolve({ title:null,artist:null,album:null,year:null,genre:null,art:null });
      }
    });
  });
}

// ── File picking ──────────────────────────────────────
function pickFiles() {
  if ('showOpenFilePicker' in window) {
    window.showOpenFilePicker({
      multiple: true,
      types: [{ description:'MP3 / Images', accept:{'audio/mpeg':['.mp3'],'image/*':['.jpg','.jpeg','.png','.webp']} }]
    })
    .then(function (handles) { return Promise.all(handles.map(function (h) { return h.getFile(); })); })
    .then(function (files)   { addFiles(files); })
    .catch(function () {});
  } else { fileInput.click(); }
}

async function addFiles(files) {
  if (!files || !files.length) return;
  var IMAGE_EXTS = ['jpg','jpeg','png','webp','gif'];
  var COVERS     = ['cover','folder','albumart','front','artwork'];
  var all  = Array.from(files);
  var mp3s = all.filter(function (f) { return f.type==='audio/mpeg' || f.name.toLowerCase().endsWith('.mp3'); });
  var imgs = all.filter(function (f) { return IMAGE_EXTS.includes(f.name.split('.').pop().toLowerCase()); });

  imgs.forEach(function (img) {
    var key = stripExt(img.name).toLowerCase();
    var url = URL.createObjectURL(img);
    imageMap[key] = url;
    if (COVERS.includes(key) && !imageMap['__folder__']) imageMap['__folder__'] = url;
  });
  if (!mp3s.length && imgs.length) { showToast('Added ' + imgs.length + ' cover image(s).'); return; }
  if (!mp3s.length) { showToast('No MP3 files found.'); return; }

  showToast('Loading ' + mp3s.length + ' file' + (mp3s.length > 1 ? 's' : '') + '…');

  var newTracks = [];
  for (var i = 0; i < mp3s.length; i++) {
    var file    = mp3s[i];
    var objUrl  = URL.createObjectURL(file);
    var tags    = await parseTags(file);
    var base    = stripExt(file.name);
    var sidecar = imageMap[base.toLowerCase()] || imageMap['__folder__'] || null;

    // ── Parse filename for title + artist fallbacks ─
    var fn = parseFilename(file.name);

    // ── Title: ID3 tag → filename parse → bare filename
    var title  = (tags.title  && tags.title.trim())  ? tags.title.trim()  : (fn.title  || base);

    // ── Artist: ID3 tag → filename parse → 'Unknown Artist'
    var artist = (tags.artist && tags.artist.trim()) ? tags.artist.trim() : (fn.artist || 'Unknown Artist');

    // ── Genre: ID3 tag (cleaned) → keyword scan
    var genre  = inferGenre(title, artist, tags.album || '', tags.genre || '');

    newTracks.push({
      id:        nextId++,
      name:      file.name,
      title:     title,
      artist:    artist,
      album:     tags.album  || '',
      genre:     genre,
      year:      tags.year   || '',
      artUrl:    tags.art    || sidecar || null,
      objectUrl: objUrl,
      duration:  null,
      metaOnly:  false
    });
  }

  newTracks.forEach(function (nt) {
    var gi = playlist.findIndex(function (t) { return t.metaOnly && t.name === nt.name; });
    if (gi !== -1) { nt.id = playlist[gi].id; playlist[gi] = nt; }
    else playlist.push(nt);
  });

  renderAll();
  savePlaylist();
  var first = playlist.findIndex(function (t) { return !t.metaOnly; });
  if (currentIdx === -1 && first !== -1) loadTrack(first, false);
  showToast('Added ' + newTracks.length + ' track' + (newTracks.length > 1 ? 's' : '') + '.');
}

// ── Sort ──────────────────────────────────────────────
sortPills.forEach(function (p) {
  p.addEventListener('click', function () {
    sortKey = p.dataset.sort;
    sortPills.forEach(function (x) { x.classList.toggle('active', x === p); });
    renderPlaylist();
  });
});
function sorted(arr) {
  return arr.slice().sort(function (a, b) {
    return (a[sortKey]||'').toLowerCase().localeCompare((b[sortKey]||'').toLowerCase());
  });
}

// ── Render all ────────────────────────────────────────
function renderAll() { renderPlaylist(); renderFavorites(); renderRecent(); renderFolders(); }

// ── Render: Playlist ──────────────────────────────────
function renderPlaylist() {
  Array.from(trackList.querySelectorAll('.track-item')).forEach(function (el) { el.remove(); });
  var q = searchInput.value.toLowerCase().trim();

  var base = playlist.filter(function (t) {
    if (t.metaOnly) return false;
    // Folder filter
    if (activeFolderId !== null) {
      var folder = albumFolders.find(function (f) { return f.id === activeFolderId; });
      if (!folder || folder.trackIds.indexOf(t.id) === -1) return false;
    }
    return !q || [t.title, t.artist, t.album, t.genre].some(function (x) {
      return (x||'').toLowerCase().includes(q);
    });
  });

  var filtered = sorted(base);

  if (!filtered.length) {
    allEmpty.style.display = '';
  } else {
    allEmpty.style.display = 'none';
    filtered.forEach(function (t, pos) {
      trackList.appendChild(buildTrackItem(t, playlist.indexOf(t), pos + 1));
    });
  }

  var total = playlist.filter(function (t) { return !t.metaOnly; }).length;
  allMeta.textContent = total + ' tracks' + (q ? ' · ' + filtered.length + ' match' : '');

  // Folder filter chip
  if (activeFolderId !== null) {
    var af = albumFolders.find(function (f) { return f.id === activeFolderId; });
    folderFilterBar.style.display = '';
    folderFilterName.textContent  = af ? af.name : 'Folder';
    centerColTitle.textContent    = af ? af.name : 'All Songs';
  } else {
    folderFilterBar.style.display = 'none';
    centerColTitle.textContent    = 'All Songs';
  }
}

function buildTrackItem(track, idx, pos) {
  var li = document.createElement('li');
  li.className = 'track-item';
  li.setAttribute('role', 'option');
  li.setAttribute('data-idx', idx);
  li.setAttribute('data-id', track.id);
  li.setAttribute('tabindex', '0');

  if (idx === currentIdx) {
    li.classList.add('playing');
    if (!isPlaying) li.classList.add('paused');
  }

  var loved     = favorites.has(track.id);
  var dur       = track.duration ? fmtTime(track.duration) : '–:––';
  var heartFill = loved ? 'currentColor' : 'none';
  var heartCls  = 'item-heart' + (loved ? ' loved' : '');

  // Genre + artist tags
  var tagHtml = '';
  if (track.genre) tagHtml += '<span class="item-tag">' + esc(track.genre) + '</span>';

  li.innerHTML =
    '<div class="item-num">' + pos + '</div>' +
    '<div class="item-bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>' +
    '<div class="item-thumb">' + thumbImg(track.artUrl) + '</div>' +
    '<div class="item-info">' +
      '<div class="item-title">' + esc(track.title) + '</div>' +
      '<div class="item-sub">' + esc(track.artist) + ' · ' + dur + '</div>' +
      (tagHtml ? '<div class="item-tags">' + tagHtml + '</div>' : '') +
    '</div>' +
    '<div class="item-right">' +
      '<button class="' + heartCls + '" data-id="' + track.id + '" title="Favorite">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="' + heartFill + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

  li.addEventListener('click', function (e) {
    if (e.target.closest('.item-heart')) return;
    if (idx === currentIdx) togglePlay(); else loadTrack(idx, true);
  });
  li.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
  });
  li.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    openCtxMenu(e.clientX, e.clientY, track.id);
  });
  li.querySelector('.item-heart').addEventListener('click', function (e) {
    e.stopPropagation(); toggleFavorite(track.id);
  });
  return li;
}

// ── Render: Favorites ─────────────────────────────────
function renderFavorites() {
  Array.from(favList.querySelectorAll('.side-item')).forEach(function (el) { el.remove(); });
  var faved = playlist.filter(function (t) { return favorites.has(t.id) && !t.metaOnly; });
  favMeta.textContent    = faved.length + ' tracks';
  favEmpty.style.display = faved.length ? 'none' : '';

  faved.forEach(function (track, i) {
    var div = document.createElement('div');
    div.className = 'side-item';
    var dur2 = track.duration ? fmtTime(track.duration) : '–:––';
    div.innerHTML =
      '<div class="side-num">' + (i+1) + '</div>' +
      '<div class="side-thumb">' + thumbImg(track.artUrl) + '</div>' +
      '<div class="side-info">' +
        '<div class="side-title">' + esc(track.title)  + '</div>' +
        '<div class="side-sub">'  + esc(track.artist) + ' · ' + dur2 + '</div>' +
      '</div>' +
      '<button class="unfave-btn" data-id="' + track.id + '" title="Remove">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">' +
          '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
        '</svg>' +
      '</button>';
    div.addEventListener('click', function (e) {
      if (e.target.closest('.unfave-btn')) { toggleFavorite(track.id); return; }
      var idx = playlist.indexOf(track);
      if (idx !== -1) loadTrack(idx, true);
    });
    favList.appendChild(div);
  });
}

// ── Render: Recently Played ───────────────────────────
function renderRecent() {
  Array.from(recentList.querySelectorAll('.side-item')).forEach(function (el) { el.remove(); });
  var vis = recentPlayed.filter(function (r) {
    var t = playlist.find(function (p) { return p.id === r.id; });
    return !t || !t.metaOnly;
  });
  recentMeta.textContent    = vis.length + ' tracks';
  recentEmpty.style.display = vis.length ? 'none' : '';

  vis.forEach(function (entry, i) {
    var track  = playlist.find(function (t) { return t.id === entry.id; });
    var artUrl = track ? track.artUrl : null;
    var dur3   = track && track.duration ? fmtTime(track.duration) : '–:––';
    var div    = document.createElement('div');
    div.className = 'side-item';
    div.innerHTML =
      '<div class="side-num">' + (i+1) + '</div>' +
      '<div class="side-thumb">' + thumbImg(artUrl) + '</div>' +
      '<div class="side-info">' +
        '<div class="side-title">' + esc(entry.title)  + '</div>' +
        '<div class="side-sub">'  + esc(entry.artist) + ' · ' + dur3 + '</div>' +
      '</div>' +
      '<span class="time-chip">' + timeAgo(entry.ts) + '</span>';
    div.addEventListener('click', function () {
      var idx = playlist.findIndex(function (t) { return t.id === entry.id; });
      if (idx !== -1) loadTrack(idx, true); else showToast('Reload file to play.');
    });
    recentList.appendChild(div);
  });
}
setInterval(function () { if (recentPlayed.length) renderRecent(); }, 30000);

// ── Album Folders ─────────────────────────────────────
function renderFolders() {
  // Remove existing folder items (keep foldersEmpty)
  Array.from(foldersList.querySelectorAll('.folder-item')).forEach(function (el) { el.remove(); });
  foldersCount.textContent  = albumFolders.length;
  foldersEmpty.style.display = albumFolders.length ? 'none' : '';

  albumFolders.forEach(function (folder) {
    var count = folder.trackIds.length;
    var div   = document.createElement('div');
    div.className = 'folder-item' + (activeFolderId === folder.id ? ' active' : '');
    div.innerHTML =
      '<div class="folder-dot" style="background:' + esc(folder.color) + '"></div>' +
      '<div class="folder-name">' + esc(folder.name) + '</div>' +
      '<div class="folder-track-count">' + count + '</div>' +
      '<button class="folder-del" data-id="' + folder.id + '" title="Delete folder">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
          '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
        '</svg>' +
      '</button>';

    div.addEventListener('click', function (e) {
      if (e.target.closest('.folder-del')) {
        var fid = parseInt(e.target.closest('.folder-del').dataset.id);
        deleteFolder(fid); return;
      }
      if (activeFolderId === folder.id) {
        activeFolderId = null;
      } else {
        activeFolderId = folder.id;
      }
      renderFolders();
      renderPlaylist();
    });
    foldersList.appendChild(div);
  });
}

function deleteFolder(id) {
  albumFolders = albumFolders.filter(function (f) { return f.id !== id; });
  if (activeFolderId === id) activeFolderId = null;
  saveFolders();
  renderFolders();
  renderPlaylist();
  showToast('Folder deleted.');
}

function addTrackToFolder(folderId, trackId) {
  var folder = albumFolders.find(function (f) { return f.id === folderId; });
  if (!folder) return;
  if (folder.trackIds.indexOf(trackId) === -1) folder.trackIds.push(trackId);
  saveFolders();
  renderFolders();
  showToast('Added to "' + folder.name + '".');
}

// ── Context menu (right-click track → add to folder) ──
function openCtxMenu(x, y, trackId) {
  closeCtxMenu();
  if (!albumFolders.length) { showToast('Create a folder first.'); return; }
  ctxTrackId = trackId;
  ctxMenu = document.createElement('div');
  ctxMenu.className = 'ctx-menu';

  var header = document.createElement('div');
  header.className = 'ctx-item';
  header.style.cssText = 'font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;cursor:default;opacity:0.5;';
  header.textContent = 'Add to folder';
  ctxMenu.appendChild(header);

  var sep = document.createElement('div'); sep.className = 'ctx-sep';
  ctxMenu.appendChild(sep);

  albumFolders.forEach(function (folder) {
    var item = document.createElement('div');
    item.className = 'ctx-item';
    item.innerHTML =
      '<div style="width:9px;height:9px;border-radius:50%;background:' + esc(folder.color) + ';flex-shrink:0;"></div>' +
      '<span>' + esc(folder.name) + '</span>';
    item.addEventListener('click', function () {
      addTrackToFolder(folder.id, ctxTrackId);
      closeCtxMenu();
    });
    ctxMenu.appendChild(item);
  });

  // Position
  var menuW = 170, menuH = 40 + albumFolders.length * 32;
  var left = Math.min(x, window.innerWidth  - menuW - 8);
  var top  = Math.min(y, window.innerHeight - menuH - 8);
  ctxMenu.style.cssText += 'left:' + left + 'px;top:' + top + 'px;';
  document.body.appendChild(ctxMenu);
}
function closeCtxMenu() {
  if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; }
}
document.addEventListener('click', closeCtxMenu);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCtxMenu(); });

// ── Modal: Create Folder ──────────────────────────────
// Color swatch selection
colorSwatches.querySelectorAll('.swatch').forEach(function (sw) {
  sw.addEventListener('click', function () {
    colorSwatches.querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('active'); });
    sw.classList.add('active');
    selectedColor = sw.dataset.color;
  });
});

function openModal() {
  folderNameInput.value = '';
  selectedColor = '#111111';
  colorSwatches.querySelectorAll('.swatch').forEach(function (s) {
    s.classList.toggle('active', s.dataset.color === '#111111');
  });
  modalOverlay.classList.add('open');
  setTimeout(function () { folderNameInput.focus(); }, 80);
}
function closeModal() { modalOverlay.classList.remove('open'); }

newFolderBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
folderNameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') modalCreate.click(); });

modalCreate.addEventListener('click', function () {
  var name = folderNameInput.value.trim();
  if (!name) { folderNameInput.focus(); return; }
  albumFolders.push({ id: Date.now(), name: name, color: selectedColor, trackIds: [] });
  saveFolders();
  renderFolders();
  closeModal();
  showToast('Folder "' + name + '" created.');
});

// Folder filter clear
folderFilterClear.addEventListener('click', function () {
  activeFolderId = null;
  renderFolders();
  renderPlaylist();
});

// ── Load track ────────────────────────────────────────
function loadTrack(idx, autoPlay) {
  if (idx < 0 || idx >= playlist.length) return;
  currentIdx = idx;
  var t = playlist[idx];
  updateNPUI(t);
  renderPlaylist();
  logRecent(t);
  savePlaylist();
  audio.src = t.objectUrl;
  audio.load();
  if (autoPlay) {
    audio.play().then(function () { setPlay(true); }).catch(function () { setPlay(false); });
  } else { setPlay(false); }
}

function updateNPUI(t) {
  npTitle.textContent  = t.title  || 'Unknown';
  npArtist.textContent = t.artist || 'Unknown Artist';

  // Tags (genre) in player bar
  npTags.innerHTML = '';
  if (t.genre) {
    var tag = document.createElement('span');
    tag.className = 'np-tag';
    tag.textContent = t.genre;
    npTags.appendChild(tag);
  }

  if (t.artUrl) {
    npArt.innerHTML = '<img src="' + esc(t.artUrl) + '" alt="" />';
  } else if (imageMap['__folder__']) {
    npArt.innerHTML = '<img src="' + esc(imageMap['__folder__']) + '" alt="" />';
  } else {
    npArt.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">' +
      '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  }
  document.title = t.title ? t.title + ' — Music Player' : 'Music Player';
  updateHeartBtn(favorites.has(t.id));
}

// ── Play / Pause ──────────────────────────────────────
function togglePlay() {
  if (currentIdx === -1) {
    var f = playlist.findIndex(function (t) { return !t.metaOnly; });
    if (f !== -1) loadTrack(f, true);
    return;
  }
  if (audio.paused) {
    audio.play().then(function () { setPlay(true); }).catch(function () {});
  } else { audio.pause(); setPlay(false); }
}
function setPlay(playing) {
  isPlaying = playing;
  playIcon.style.display  = playing ? 'none' : '';
  pauseIcon.style.display = playing ? '' : 'none';
  trackList.querySelectorAll('.track-item').forEach(function (el) {
    if (parseInt(el.dataset.idx) === currentIdx) el.classList.toggle('paused', !playing);
  });
}

// ── Next / Prev ───────────────────────────────────────
function playNext() {
  if (!playlist.length) return;
  if (repeat === 2) { audio.currentTime = 0; audio.play().then(function () { setPlay(true); }).catch(function () {}); return; }
  var ni = shuffle ? getShuffleNext() : currentIdx + 1;
  if (!shuffle && ni >= playlist.length) {
    if (repeat === 0) { audio.pause(); setPlay(false); audio.currentTime = 0; return; }
    ni = 0;
  }
  loadTrack(ni, true);
}
function playPrev() {
  if (!playlist.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack(shuffle ? getShufflePrev() : (currentIdx - 1 + playlist.length) % playlist.length, isPlaying);
}

// ── Shuffle queue ─────────────────────────────────────
function buildQueue() {
  var idx = playlist.map(function (_, i) { return i; }).filter(function (i) { return i !== currentIdx; });
  for (var i = idx.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
  }
  if (currentIdx !== -1) idx.unshift(currentIdx);
  shuffleQueue = idx;
}
function getShuffleNext() {
  if (!shuffleQueue.length) buildQueue();
  var p = shuffleQueue.indexOf(currentIdx);
  if (p === -1 || p === shuffleQueue.length - 1) { buildQueue(); return shuffleQueue[1] !== undefined ? shuffleQueue[1] : shuffleQueue[0]; }
  return shuffleQueue[p + 1];
}
function getShufflePrev() {
  if (!shuffleQueue.length) buildQueue();
  var p = shuffleQueue.indexOf(currentIdx);
  return p <= 0 ? currentIdx : shuffleQueue[p - 1];
}

// ── Volume ────────────────────────────────────────────
function setVolume(v) {
  v = Math.max(0, Math.min(100, v));
  audio.volume = v / 100; volumeSlider.value = v; volPct.textContent = v + '%'; updateVolIcon(v);
}
function updateVolIcon(v) {
  if (v === 0 || isMuted)
    volIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  else if (v < 50)
    volIcon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
  else
    volIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
}
muteBtn.addEventListener('click', function () { isMuted = !isMuted; audio.muted = isMuted; updateVolIcon(isMuted ? 0 : parseInt(volumeSlider.value)); });
volumeSlider.addEventListener('input', function () { isMuted = false; setVolume(parseInt(volumeSlider.value)); });

// ── Progress bar ──────────────────────────────────────
audio.addEventListener('timeupdate', function () {
  if (!isFinite(audio.duration)) return;
  progressFill.style.width  = (audio.currentTime / audio.duration * 100) + '%';
  currentTimeEl.textContent = fmtTime(audio.currentTime);
});
audio.addEventListener('loadedmetadata', function () {
  totalTimeEl.textContent = fmtTime(audio.duration);
  if (currentIdx !== -1 && playlist[currentIdx]) {
    playlist[currentIdx].duration = audio.duration;
    renderPlaylist(); savePlaylist();
  }
});
audio.addEventListener('ended', playNext);

function seekAt(e) {
  var rect = progressTrack.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  if (isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(1, x / rect.width)) * audio.duration;
}
progressTrack.addEventListener('mousedown',  function (e) { isDragging = true; seekAt(e); });
progressTrack.addEventListener('touchstart', function (e) { isDragging = true; seekAt(e); }, { passive: true });
window.addEventListener('mousemove', function (e) { if (isDragging) seekAt(e); });
window.addEventListener('touchmove', function (e) { if (isDragging) seekAt(e); }, { passive: true });
window.addEventListener('mouseup',   function () { isDragging = false; });
window.addEventListener('touchend',  function () { isDragging = false; });

// ── Shuffle / Repeat ──────────────────────────────────
shuffleBtn.addEventListener('click', function () {
  shuffle = !shuffle; shuffleBtn.classList.toggle('active', shuffle);
  if (shuffle) buildQueue();
  showToast(shuffle ? 'Shuffle on' : 'Shuffle off'); savePlaylist();
});
repeatBtn.addEventListener('click', function () {
  repeat = (repeat + 1) % 3; repeatBtn.classList.toggle('active', repeat > 0);
  repeatBadge.style.display = repeat === 2 ? 'flex' : 'none';
  showToast(['Repeat off','Repeat all','Repeat one'][repeat]); savePlaylist();
});

// ── Favorites ─────────────────────────────────────────
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  var loved = favorites.has(id);
  saveFavorites(); renderFavorites(); renderPlaylist();
  if (currentIdx !== -1 && playlist[currentIdx] && playlist[currentIdx].id === id) {
    updateHeartBtn(loved);
    playerHeart.classList.add('pop');
    setTimeout(function () { playerHeart.classList.remove('pop'); }, 350);
  }
  showToast(loved ? '♥ Added to favorites' : 'Removed from favorites');
}
function updateHeartBtn(loved) {
  playerHeart.classList.toggle('loved', loved);
  playerHeart.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="' + (loved ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
}
playerHeart.addEventListener('click', function () {
  if (currentIdx !== -1) toggleFavorite(playlist[currentIdx].id);
});

// ── Recently Played ───────────────────────────────────
function logRecent(track) {
  recentPlayed = recentPlayed.filter(function (r) { return r.id !== track.id; });
  recentPlayed.unshift({ id:track.id, title:track.title, artist:track.artist, artUrl:track.artUrl, ts:Date.now() });
  if (recentPlayed.length > 20) recentPlayed = recentPlayed.slice(0, 20);
  renderRecent(); saveRecent();
}

// ── Controls ──────────────────────────────────────────
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);
fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
searchInput.addEventListener('input', renderPlaylist);

// ── Clear ─────────────────────────────────────────────
clearBtn.addEventListener('click', function () {
  if (!playlist.length) return;
  if (!confirm('Clear the entire playlist?')) return;
  playlist.forEach(function (t) { if (t.objectUrl) URL.revokeObjectURL(t.objectUrl); });
  playlist = []; currentIdx = -1; isPlaying = false;
  audio.pause(); audio.src = '';
  npTitle.textContent  = 'No track';
  npArtist.textContent = 'Load files to begin';
  npTags.innerHTML     = '';
  npArt.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">' +
    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  progressFill.style.width = '0%'; currentTimeEl.textContent = '0:00'; totalTimeEl.textContent = '0:00';
  document.title = 'Music Player'; setPlay(false);
  recentPlayed = []; renderAll(); lsDel(LS_PLAYLIST); lsDel(LS_RECENT);
  showToast('Playlist cleared.');
});

// ── Drag & Drop ───────────────────────────────────────
var dc = 0;
document.addEventListener('dragenter', function (e) { e.preventDefault(); dc++; if (dc===1) dropOverlay.classList.add('active'); });
document.addEventListener('dragleave', function ()  { dc--; if (dc===0) dropOverlay.classList.remove('active'); });
document.addEventListener('dragover',  function (e) { e.preventDefault(); });
document.addEventListener('drop',      function (e) { e.preventDefault(); dc=0; dropOverlay.classList.remove('active'); addFiles(e.dataTransfer.files); });

// ── Keyboard shortcuts ────────────────────────────────
document.addEventListener('keydown', function (e) {
  var tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  switch (e.key) {
    case ' ':          e.preventDefault(); togglePlay(); break;
    case 'ArrowRight': e.preventDefault(); audio.currentTime = Math.min(audio.duration||0, audio.currentTime+5); break;
    case 'ArrowLeft':  e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime-5); break;
    case 'ArrowUp':    e.preventDefault(); setVolume(Math.min(100, parseInt(volumeSlider.value)+5)); break;
    case 'ArrowDown':  e.preventDefault(); setVolume(Math.max(0, parseInt(volumeSlider.value)-5)); break;
    case 'm': case 'M': muteBtn.click(); break;
    case 's': case 'S': shuffleBtn.click(); break;
    case 'r': case 'R': repeatBtn.click(); break;
    case 'f': case 'F': if (currentIdx !== -1) toggleFavorite(playlist[currentIdx].id); break;
  }
});

// ── Persistence ───────────────────────────────────────
function savePlaylist() {
  var data = playlist.map(function (t) {
    return {id:t.id,name:t.name,title:t.title,artist:t.artist,album:t.album,genre:t.genre,year:t.year,duration:t.duration};
  });
  lsSet(LS_PLAYLIST, JSON.stringify({tracks:data,currentIdx:currentIdx,shuffle:shuffle,repeat:repeat}));
}
function saveFavorites() { lsSet(LS_FAVORITES, JSON.stringify(Array.from(favorites))); }
function saveRecent() {
  lsSet(LS_RECENT, JSON.stringify(recentPlayed.map(function (r) {
    return {id:r.id,title:r.title,artist:r.artist,ts:r.ts};
  })));
}
function saveFolders() { lsSet(LS_FOLDERS, JSON.stringify(albumFolders)); }

function loadStorage() {
  try {
    var raw = lsGet(LS_PLAYLIST);
    if (raw) {
      var data = JSON.parse(raw);
      if (Array.isArray(data.tracks)) {
        data.tracks.forEach(function (t) {
          playlist.push({id:t.id,name:t.name,title:t.title,artist:t.artist,album:t.album||'',
            genre:t.genre||'',year:t.year||'',artUrl:null,objectUrl:null,duration:t.duration||null,metaOnly:true});
          if (t.id >= nextId) nextId = t.id + 1;
        });
      }
      if (typeof data.shuffle === 'boolean') shuffle = data.shuffle;
      if (typeof data.repeat  === 'number')  repeat  = data.repeat;
    }
    var fav = lsGet(LS_FAVORITES);
    if (fav) favorites = new Set(JSON.parse(fav));
    var rec = lsGet(LS_RECENT);
    if (rec) recentPlayed = JSON.parse(rec);
    var fld = lsGet(LS_FOLDERS);
    if (fld) albumFolders = JSON.parse(fld);
  } catch (e) {}
}

// ── Init ──────────────────────────────────────────────
(function init() {
  // Restore theme
  var savedTheme = lsGet(LS_THEME) || 'light';
  applyTheme(savedTheme);

  setVolume(50);
  loadStorage();

  // Ghost tracks — clear (blob URLs die on refresh)
  if (playlist.length && playlist.every(function (t) { return t.metaOnly; })) {
    playlist = []; currentIdx = -1; lsDel(LS_PLAYLIST);
  }

  renderAll();

  if (shuffle) shuffleBtn.classList.add('active');
  if (repeat > 0) { repeatBtn.classList.add('active'); if (repeat === 2) repeatBadge.style.display = 'flex'; }
  updateHeartBtn(false);
}());