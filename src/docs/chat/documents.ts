import accessibility from '../../../docs/chat/04-accessibility-ux.md?raw'
import architecture from '../../../docs/chat/02-architecture.md?raw'
import patterns from '../../../docs/chat/01-patterns.md?raw'
import roadmap from '../../../docs/chat/05-roadmap.md?raw'
import typescriptApi from '../../../docs/chat/03-typescript-api.md?raw'
import liveApiSource from '../../components/chat/types.ts?raw'
import usageFixtureSource from './usage-fixture.ts?raw'

export type ChatDocument = {
  slug: string
  title: string
  shortTitle: string
  description: string
  content: string
  sources?: readonly {
    label: string
    language: string
    code: string
  }[]
}

export const chatDocuments: readonly ChatDocument[] = [
  {
    slug: 'patterns',
    title: 'Interface patterns',
    shortTitle: 'Patterns',
    description: 'The durable abstractions behind transcript, message, composer, and rich activity.',
    content: patterns,
  },
  {
    slug: 'architecture',
    title: 'Tint architecture',
    shortTitle: 'Architecture',
    description: 'Controlled presentation boundaries, component hierarchy, and customization.',
    content: architecture,
  },
  {
    slug: 'typescript-api',
    title: 'TypeScript API',
    shortTitle: 'TypeScript API',
    description: 'The exported, compile-checked data contract and controlled component props.',
    content: typescriptApi,
    sources: [
      {
        label: 'Exported API contract',
        language: 'ts',
        code: liveApiSource,
      },
      {
        label: 'Compile-checked usage fixture',
        language: 'ts',
        code: usageFixtureSource,
      },
    ],
  },
  {
    slug: 'accessibility-ux',
    title: 'Accessibility and UX',
    shortTitle: 'Accessibility',
    description: 'Focus, announcements, scrolling, composer behavior, safety, and performance.',
    content: accessibility,
  },
  {
    slug: 'roadmap',
    title: 'Implementation roadmap',
    shortTitle: 'Roadmap',
    description: 'Review gates, rich-agent milestones, recipes, and deferred social messaging.',
    content: roadmap,
  },
]

export const defaultChatDocument = chatDocuments[0]
