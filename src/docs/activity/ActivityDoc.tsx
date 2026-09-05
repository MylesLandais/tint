import { useState } from 'react'
import {
  ActivityFeed,
  type ActivitySort,
  type ForumPost,
} from '../../components/activity'
import { DEMO_ACTIVITY } from '../fixtures/demoDocuments'
import { Badge } from '../../components/badge'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'

const usage = `import { ActivityFeed, ActivityFeedRow, sortActivityEvents } from 'tint/activity'`

export function ActivityDoc() {
  const [sort, setSort] = useState<ActivitySort>('hot')
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_ACTIVITY.events[0]?.id ?? null)

  const selected = DEMO_ACTIVITY.events.find((event) => event.id === selectedId)
  const thread = selected?.threadId
    ? DEMO_ACTIVITY.threads.find((item) => item.id === selected.threadId)
    : undefined
  const posts: readonly ForumPost[] = thread
    ? DEMO_ACTIVITY.posts.filter((post) => post.threadId === thread.id)
    : []

  return (
    <DocsPage
      route="components/activity"
      title="Activity"
      intro="Digg-style ranked activity stream with optional Level1Techs-shaped forum expansion. Separate document from Feed — different rows, different sort."
    >
      <DocsSection id="preview" title="Workbench">
        <DocsPreview className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <ActivityFeed
            events={DEMO_ACTIVITY.events}
            sort={sort}
            onSortChange={setSort}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <aside className="rounded-xl border border-tint-border bg-tint-surface p-3">
            <h3 className="mt-0 mb-2 text-sm font-semibold text-tint-ink">
              {thread ? thread.title : 'Forum rail'}
            </h3>
            {posts.length === 0 ? (
              <p className="m-0 text-sm text-tint-muted">
                Select a row with a threadId to load fixture posts here.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-lg border border-tint-border bg-tint-panel p-2"
                    style={{ marginLeft: post.depth * 12 }}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-tint-muted">
                      <Badge tone="neutral">{typeof post.author === 'string' ? post.author : post.author.name}</Badge>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="m-0 text-sm text-tint-ink">{post.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable
          rows={[
            {
              name: 'events',
              type: 'readonly ActivityEvent[]',
              required: true,
              description: 'Host-owned activity rows.',
            },
            {
              name: 'sort',
              type: "'hot' | 'new' | 'top'",
              description: 'Controlled ranking mode.',
            },
            {
              name: 'onSortChange',
              type: '(sort: ActivitySort) => void',
              description: 'Sort intent from the hot/new/top controls.',
            },
            {
              name: 'selectedId',
              type: 'string | null',
              description: 'Highlighted row id.',
            },
            {
              name: 'onSelect',
              type: '(eventId: string) => void',
              description: 'Row selection intent.',
            },
            {
              name: 'renderActions',
              type: '(event: ActivityEvent) => ReactNode',
              description: 'Optional trailing actions per row.',
            },
            {
              name: 'empty',
              type: 'ReactNode',
              description: 'Empty-state copy.',
            },
            {
              name: 'now',
              type: 'number',
              description: 'Clock override for hot ranking in tests.',
            },
            {
              name: 'event',
              type: 'ActivityEvent',
              required: true,
              description: 'ActivityFeedRow event document.',
            },
            {
              name: 'selected',
              type: 'boolean',
              description: 'Row selected chrome.',
            },
            {
              name: 'actions',
              type: 'ReactNode',
              description: 'Trailing actions slot on ActivityFeedRow.',
            },
            { name: 'className', type: 'string', description: 'Appended to the root element.' },
          ]}
        />
      </DocsSection>
    </DocsPage>
  )
}
