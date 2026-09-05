import { RefreshCw, X } from 'lucide-react'
import { useEffect, useState, type HTMLAttributes } from 'react'
import type { UploadTask } from '../../client'
import { cn } from '../../lib/utils'
import { Button } from '../button'
import { Icon } from '../icon'
import { ProgressBar } from '../progress'

export type UploadQueueProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  tasks: readonly UploadTask[]
  onCancel?(taskId: string): void
  onRetry?(taskId: string): void
  emptyLabel?: string
}

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file.type.startsWith('image/')) return
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url ? <img src={url} alt="" className="size-10 rounded object-cover" /> : null
}

export function UploadQueue({ tasks, onCancel, onRetry, emptyLabel = 'No uploads.', className, ...props }: UploadQueueProps) {
  if (tasks.length === 0) return <p className={cn('text-sm text-tint-muted', className)}>{emptyLabel}</p>
  return (
    <ul data-tint-upload-queue="" className={cn('m-0 grid list-none gap-2 p-0', className)} {...props}>
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 rounded-lg border border-tint-border bg-tint-panel p-2">
          <Preview file={task.file} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium text-tint-ink">{task.file.name}</p>
            <p className="m-0 text-xs text-tint-muted">{task.status}</p>
            {task.status === 'uploading' || task.status === 'queued' ? <ProgressBar value={task.progress} label={`${task.file.name}: ${task.progress}%`} className="mt-1" /> : null}
            {task.problem ? <p role="alert" className="m-0 mt-1 text-xs text-tint-danger-ink">{task.problem.detail ?? task.problem.title}</p> : null}
          </div>
          {task.status === 'error' && onRetry ? <Button size="sm" variant="ghost" aria-label={`Retry ${task.file.name}`} onClick={() => onRetry(task.id)} leading={<Icon icon={RefreshCw} size="sm" />} /> : null}
          {(task.status === 'queued' || task.status === 'uploading') && onCancel ? <Button size="sm" variant="ghost" aria-label={`Cancel ${task.file.name}`} onClick={() => onCancel(task.id)} leading={<Icon icon={X} size="sm" />} /> : null}
        </li>
      ))}
    </ul>
  )
}
