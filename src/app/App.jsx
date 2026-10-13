import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SettingsProvider, useSettings } from './SettingsContext.jsx';
import { NavigationProvider, useNavigation } from './NavigationContext.jsx';
import { LibraryProvider, useLibrary } from './LibraryContext.jsx';
import { ContextMenuProvider, DialogProvider, Toasts } from './Overlays.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { PlayerBar } from '../components/PlayerBar.jsx';
import { QueueDrawer } from '../components/QueueList.jsx';
import { ScrollContext } from '../components/TrackList.jsx';
import { HomeView } from '../features/home/HomeView.jsx';
import { SongsView } from '../features/library/SongsView.jsx';
import { AlbumsView, AlbumDetailView } from '../features/albums/AlbumsView.jsx';
import { ArtistsView, ArtistDetailView } from '../features/artists/ArtistsView.jsx';
import { PlaylistsView, PlaylistDetailView, FavoritesView } from '../features/playlists/PlaylistsView.jsx';
import { SearchView } from '../features/search/SearchView.jsx';
import { SettingsView } from '../features/settings/SettingsView.jsx';
import { NowPlaying } from '../features/now-playing/NowPlaying.jsx';
import { Onboarding } from '../features/onboarding/Onboarding.jsx';
import { usePlayer, player } from '../hooks/usePlayer.js';
import { applyPalette } from '../services/themeService.js';
import { api } from '../services/api.js';
import { PageTitleProvider } from './PageTitleContext.jsx';
import { withViewTransition } from './motion.js';
import { CommandPalette } from '../components/CommandPalette.jsx';
import { ShortcutSheet } from '../components/ShortcutSheet.jsx';

export function App({ settings }) {
  return (
    <SettingsProvider initial={settings}>
      <NavigationProvider>
        <PageTitleProvider>
        <LibraryProvider>
          <DialogProvider>
            <ContextMenuProvider>
              <Shell />
              <Toasts />
            </ContextMenuProvider>
          </DialogProvider>
        </LibraryProvider>
        </PageTitleProvider>
      </NavigationProvider>
    </SettingsProvider>
  );
}

function routeView(route) {
  const p = route.params ?? {};
  switch (route.name) {
    case 'songs':
      return <SongsView />;
    case 'albums':
      return <AlbumsView />;
    case 'album':
      return <AlbumDetailView id={p.id} preview={p.preview} />;
    case 'artists':
      return <ArtistsView />;
    case 'artist':
      return <ArtistDetailView id={p.id} preview={p.preview} />;
    case 'playlists':
      return <PlaylistsView />;
    case 'playlist':
      return <PlaylistDetailView id={p.id} smart={p.smart} />;
    case 'favorites':
      return <FavoritesView />;
    case 'search':
      return <SearchView q={p.q} />;
    case 'settings':
      return <SettingsView />;
    default:
      return <HomeView />;
  }
}

function Shell() {
  const { settings, update } = useSettings();
  const { route, navigate, goBack, goForward } = useNavigation();
  const { folders, stats, scanning } = useLibrary();
  const palette = usePlayer((s) => s.current?.palette ?? null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(false);
  const [miniVisible, setMiniVisible] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);
  const searchRef = useRef(null);

  // Album-art driven accent and ambient light.
  useEffect(() => {
    applyPalette(palette, settings);
  }, [palette, settings.dynamicAccent, settings.accentColor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    player.applySettings(settings);
  }, [settings]);

  useEffect(() => {
    api.windows.miniVisible().then(setMiniVisible).catch(() => {});
    return api.windows.onMiniVisibility(setMiniVisible);
  }, []);

  // Reset scroll position on navigation (layout effect: before the View Transition snapshot).
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [route]);

  // Once music exists, the welcome screen has done its job.
  useEffect(() => {
    if (stats?.tracks > 0 && !settings.onboardingDismissed) update('onboardingDismissed', true);
  }, [stats?.tracks, settings.onboardingDismissed, update]);

  const showOnboarding = stats && !settings.onboardingDismissed && (folders.length === 0 || (scanning && !stats.tracks));

  // Now Playing opens/closes inside a View Transition: the player art morphs into the big art.
  const openNowPlaying = useCallback(() => withViewTransition(() => setNowPlaying(true), { direction: 'up' }), []);
  const closeNowPlaying = useCallback(() => withViewTransition(() => setNowPlaying(false), { direction: 'down' }), []);
  const toggleMini = () => api.windows.toggleMini();

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      const typing = el.closest?.('input, textarea, select, [contenteditable="true"]');
      const interactive = typing || el.closest?.('button, [role="slider"], [role="menu"], [role="dialog"] form, [role="row"]');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === '?' && !typing) {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (e.key === ' ' && !interactive) {
        e.preventDefault();
        player.toggle();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (nowPlaying) closeNowPlaying();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight' && !typing) {
        e.preventDefault();
        player.next();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft' && !typing) {
        e.preventDefault();
        player.previous();
      } else if (e.altKey && e.key === 'ArrowLeft' && !typing) {
        e.preventDefault();
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight' && !typing) {
        e.preventDefault();
        goForward();
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        navigate('settings');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        api.app.quit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack, goForward, navigate, nowPlaying, closeNowPlaying]);

  // Mouse back/forward buttons.
  useEffect(() => {
    const onMouse = (e) => {
      if (e.button === 3) goBack();
      if (e.button === 4) goForward();
    };
    window.addEventListener('mouseup', onMouse);
    return () => window.removeEventListener('mouseup', onMouse);
  }, [goBack, goForward]);

  return (
    <div className={`app-shell${queueOpen ? ' has-queue' : ''}`} data-scrolled={scrolled || undefined}>
      <div className="ambient" aria-hidden />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="main-column">
        <TopBar searchRef={searchRef} />
        <main
          id="main"
          className="content"
          ref={scrollRef}
          tabIndex={-1}
          onScroll={(e) => {
            const next = e.currentTarget.scrollTop > 4;
            if (next !== scrolled) setScrolled(next);
          }}
        >
          <ScrollContext.Provider value={scrollRef}>
            {showOnboarding ? <Onboarding onSkip={() => update('onboardingDismissed', true)} /> : routeView(route)}
          </ScrollContext.Provider>
        </main>
      </div>
      {queueOpen && <QueueDrawer onClose={() => setQueueOpen(false)} />}
      <PlayerBar
        queueOpen={queueOpen}
        onToggleQueue={() => setQueueOpen((v) => !v)}
        onOpenNowPlaying={openNowPlaying}
        nowPlayingOpen={nowPlaying}
        miniVisible={miniVisible}
        onToggleMini={toggleMini}
      />
      {nowPlaying && <NowPlaying onClose={closeNowPlaying} />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onOpenNowPlaying={openNowPlaying} onShowShortcuts={() => setShortcutsOpen(true)} />}
      {shortcutsOpen && <ShortcutSheet onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
