/// <reference path="./svelte-modules.d.ts" />
export { Icon, StatusIcon, Spinner, ICON_PX } from './components/icon'
export type { IconSize, StatusName } from './components/icon'
export { Button } from './components/button'
export { Badge } from './components/badge'
export type { BadgeTone } from './components/badge'
export { Surface, Card } from './components/surface'
export type { SurfaceDensity, SurfaceElevation, SurfaceTone } from './components/surface'
export { Panel } from './components/panel'
export { Menu } from './components/menu'
export type { MenuItem, MenuSeparator, MenuTriggerProps } from './components/menu'
export { Popover } from './components/popover'
export type { PopoverSide, PopoverTriggerProps } from './components/popover'
export { Tabs } from './components/tabs'
export type { TabItem } from './components/tabs'
export { Dialog } from './components/dialog'
export type { DialogProps, DialogPanelAttributes } from './components/dialog'
export { ContextMenu } from './components/context-menu'
export type { ContextMenuItem, ContextMenuSeparator, ContextMenuProps } from './components/context-menu'
export { ToastProvider, useToast } from './components/toast'
export type { ToastInput, ToastTone, ToastController } from './components/toast'
export { TreeView } from './components/tree'
export type { TreeNode, TreeViewProps } from './components/tree'
export { DiceRoller, D10, D20 } from './components/dice'
export type { DiceKind } from './components/dice'
export {
  DataTable, TableToolbar, TablePager, TableColumnsMenu,
  DataFilterControls, InfiniteRows, DataMasonry, WorkspaceGrid,
  MediaWorkspace, EventReviewControls, CollectionWorkbench,
} from './components/table'
export type { DataTableProps, TableColumn, TableEditConfig, TableEditAdapter,
  WorkspaceDocument, WorkspaceCommand, WorkspaceItem, WorkspaceCollisionMode, MediaRelease,
  EventReviewOption, EventReviewHistoryDate } from './components/table'
export * from './components/table'
export { ProgressBar } from './components/progress'
export { ScrollingLabel } from './components/scrolling-label'
export { Skeleton, EmptyState, ErrorState, ConnectionStatus } from './components/status'
export { shine } from './actions'
export {
  TintFluidForm, FormLayout, FormControl,
  TextField, TextAreaField, NumberField, PasswordField, SelectField,
  ToggleField, SliderField, FileField, TagsField,
  GroupEditor, PersonaEditor, RegexRulesEditor, ImportReview,
  Token, Typeahead, Tokenizer,
} from './form'
export type {
  GroupFields, GroupCharacterOption, GroupEditorProps,
  PersonaFields, PersonaEditorProps,
  RegexRuleDocument, RegexRulesEditorProps, ImportReviewRow,
} from './form'
export type { ChoiceOption, FieldShared } from './form'
export * from './form'
export {
  IdentifierSignInForm, CredentialRecoveryForm, PasswordCredentialInput, OAuthButtons,
  ProviderMark, AuthDivider, AuthLayout, LoginForm, RegistrationForm,
  AUTH_PROVIDERS, createLastUsedStore, isKnownProvider, providerName, validateRegistration,
} from './components/auth'
export type {
  IdentifierSignInFormLabels, LoginFormLabels, OAuthOption, RegistrationFormLabels,
  AuthMethodId, KnownAuthProviderId, LastUsedStore, RegistrationErrorCode, RegistrationErrors,
  RegistrationInput, RegistrationPolicy,
} from './components/auth'
export { CharacterCardEditorForm, CharacterDocumentEditor, CharacterLibrary } from './components/character-card'
export type { CharacterCardFormValues, CharacterDocument, CharacterLibraryItem } from './components/character-card'
export { HighlightedCode, CodeTabs } from './components/code'
export type { CodeTab } from './components/code'
export * from './components/chat'
export { CalendarMonthView, CalendarToolbar } from './components/calendar'
export type { CalendarMonthViewProps, CalendarToolbarProps } from './components/calendar'
export { BoardCard, BoardDetail, BoardLayout, BoardLayoutToggle } from './components/board'
export type {
  BoardCardProps, BoardDetailProps, BoardLayoutProps, BoardLayoutToggleProps,
  BoardCardModel, BoardCardId, BoardCardKind, BoardCardPreview, BoardCommand,
  BoardDocument, BoardId, BoardLane, BoardLaneId, BoardLayoutVariant,
} from './components/board'
export {
  Slider, MediaPlaceholder, Waveform, MediaScrubber, VolumeControl,
  PlaybackQueue, MediaPlayer, VideoPlayer, SettingsPopout,
} from './components/media'
export type {
  PlaybackQueueItem, PlaybackQueueStatus, MediaPlayerProps,
  MediaPlayerAudioProps, MediaPlayerVideoProps, MediaTextTrack, RemoteMediaController,
  MediaSize, SettingsPopoutItem,
} from './components/media'
export { GalleryGrid, MediaLightbox, UploadDropzone, UploadQueue } from './components/media-assets'
export type { MediaAsset, FileRejection } from './components/media-assets'
export { TerminalConsole } from './components/terminal'
export type {
  TerminalConsoleProps, TerminalOutput, TerminalSession,
  TerminalSize, TerminalStatus, TintTerminalOptions,
} from './components/terminal'
export { CodeEditor } from './components/code-editor'
export type { CodeEditorProps } from './components/code-editor'
export { Editor, CodeTabsExtension, editorDocumentToHTML, editorHTMLToDocument, defaultSlashCommands, DEFAULT_EDITOR_CODE_TABS, codeTabsContent } from './components/editor'
export type { EditorProps, EditorDocument, EditorSerializationOptions, EditorCommandContext, EditorSlashCommand, EditorCodeTab } from './components/editor'
export { ThemePicker, ThemeToggle, themeNameStore, colorSchemeStore, DEFAULT_THEME, THEME_STORAGE_KEY, COLOR_SCHEME_STORAGE_KEY } from './components/theme'
export type { ThemePickerProps, ThemeToggleProps, ColorSchemePreference, ResolvedColorScheme, ColorSchemeState, ThemeNameState, ThemeOption } from './components/theme'
export { AudioInput } from './components/audio-input'
export type { AudioTranscriber, TranscriptChunk, AudioCaptureMeta } from './components/audio-input'
export { ReleaseChart } from './components/release-chart'
export type { ReleaseScore } from './components/release-chart'
export { ScatterPlot } from './components/scatter-plot'
export type { ScatterPoint } from './components/scatter-plot'
export { Framebuffer } from './components/framebuffer'
export type { FrameEncoding, FrameMode } from './components/framebuffer'
export * from './components/charts'
export * from './components/telemetry'
export {
  AutomationQueuePanel,
  FeedEntryCard, FeedEntryRow, FeedLayout, HighlightLayer,
  NarrationTransport, ReaderPane, SelectionToolbar, SourceHealthBadge,
  SplitPane, ViewModeToggle,
} from './components/feed'
export type {
  AutomationQueueItem, AutomationQueuePanelProps,
  FeedEntryCardProps, FeedEntryRowProps, FeedLayoutProps, HighlightLayerProps,
  NarrationTransportProps, ReaderPaneProps, SelectionToolbarAction,
  SelectionToolbarProps, SourceHealthBadgeProps, SplitPaneProps,
  ViewModeToggleProps, ArtifactStatus, AutomationStep, Channel, ContentKind,
  DownloadProgress, FeedDocument, FeedEntry, FeedId, FeedLayoutVariant,
  PolicyDisposition, PolicyMatch, ReadState, RevisionToken as FeedRevisionToken,
  Source, SourceHealth, SourcePlatform, TextHighlight,
} from './components/feed'
export { ActivityFeed, ActivityFeedRow } from './components/activity'
export type {
  ActivityFeedProps, ActivityFeedRowProps, ActivityDocument, ActivityEvent,
  ActivityId, ActivitySignal, ActivitySort, CrossPost, ForumChannel,
  ForumPost, ForumThread, RevisionToken as ActivityRevisionToken,
} from './components/activity'
export * from './components/notify'
export * from './components/identity'
export {
  PolicyEditor, PolicyDryRun, PolicyTable, applyPolicyCommand,
  countMatches, matchClause, matchEntry, mockDryRun,
} from './components/policy'
export type {
  PolicyEditorProps, PolicyDryRunProps, PolicyTableProps, DryRunResult,
  MatchClause, MatchCriteria, MatchField, MatchOperator, PolicyCommand,
  PolicyDisposition as RulePolicyDisposition, PolicyDocument, PolicyId,
  PolicyRule, WorkflowEdge,
} from './components/policy'
export * from './components/tile-map'
export { AnnotationCanvas, interpolateGeometry, splitTrack, joinTracks } from './components/annotation'
export type {
  AnnotationRegion, AnnotationTool, RegionGeometry, AnnotationImage,
  Point as AnnotationPoint, VectorGeometry, TrackKeyframe,
} from './components/annotation'
export * from './components/graph'
export * from './components/dj'
export { WaveformCanvas, BeatGridOverlay, TransitionRegion, AutomationLane, resolveCanvasColor } from './components/timeline'
export * from './components/audio-engine'
export * from './components/audio-workspace'
export {
  AppShell, NavRail, ResponsiveNavRail, TopNav, WorkspaceHeader,
  CommandPalette, CommandMenu, StatusBar, ErrorBanner, EmptyState as ShellEmptyState,
  LoadingState, WorkspaceLayout, WorkspaceSplit, WorkspaceTabs,
  MetadataPanel, DetailSheet, FilterBar,
} from './components/shell'
export type {
  NavRailItem, NavGroup, CommandPaletteItem, WorkspaceBreadcrumb,
  StatusItem, ConnectionStateValue, ConnectionState, WorkspaceTab,
  WorkspaceSplitMode, WorkspaceSplitDirection, WorkspaceSplitPrimary,
} from './components/shell'
export { AppShell as NavigationAppShell, Breadcrumbs, NavigationList } from './components/navigation'
export type {
  AppShellProps as NavigationAppShellProps, BreadcrumbItem, BreadcrumbsProps,
  NavigationContent, NavigationItem, NavigationListProps,
} from './components/navigation'
export {
  provideTintClient, useTintClient,
  useClientStatus, useAuth, useSession, useConnection, useUploads,
  useNavigation, usePlayback, useOperations, useCapability,
} from './client'
export type { ReactiveSnapshot, ReactiveCapability } from './client'
export * from '../core/collab'
