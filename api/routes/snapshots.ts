import { Router, Request, Response } from 'express'
import { ApiResponse } from '../../shared/types.js'
import { SnapshotStore } from '../store/SnapshotStore.js'
import { EventSourcingService } from '../services/EventSourcingService.js'
import { ArchiveService } from '../services/ArchiveService.js'

const router = Router()
const snapshotStore = SnapshotStore.getInstance()
const eventSourcingService = EventSourcingService.getInstance()
const archiveService = ArchiveService.getInstance()

router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    const result = snapshotStore.getPaginated(page, pageSize)
    const response: ApiResponse<{ items: typeof result.items; total: number; page: number; pageSize: number }> = {
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page,
        pageSize
      }
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.get('/latest', (req: Request, res: Response) => {
  try {
    const snapshot = snapshotStore.getLatest()
    const response: ApiResponse<typeof snapshot> = {
      success: true,
      data: snapshot
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const snapshot = snapshotStore.getById(id)

    if (!snapshot) {
      const response: ApiResponse<null> = {
        success: false,
        error: '快照不存在'
      }
      return res.status(404).json(response)
    }

    const response: ApiResponse<typeof snapshot> = {
      success: true,
      data: snapshot
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.post('/', (req: Request, res: Response) => {
  try {
    const snapshot = eventSourcingService.createSnapshot()
    const response: ApiResponse<typeof snapshot> = {
      success: true,
      data: snapshot,
      message: '快照创建成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.post('/archive', async (req: Request, res: Response) => {
  try {
    const archiveInfo = await archiveService.createArchive()
    if (!archiveInfo) {
      const response: ApiResponse<null> = {
        success: false,
        error: '没有可归档的快照或已归档'
      }
      return res.status(400).json(response)
    }

    const response: ApiResponse<typeof archiveInfo> = {
      success: true,
      data: archiveInfo,
      message: `归档成功，压缩率 ${archiveInfo.originalSize > 0 
        ? ((archiveInfo.originalSize - archiveInfo.compressedSize) / archiveInfo.originalSize * 100).toFixed(2) 
        : 0}%`
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.get('/archive/list', (req: Request, res: Response) => {
  try {
    const archives = archiveService.listArchives()
    const response: ApiResponse<typeof archives> = {
      success: true,
      data: archives
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.get('/archive/stats', (req: Request, res: Response) => {
  try {
    const stats = archiveService.getStorageStats()
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

router.get('/nearest/:timestamp', (req: Request, res: Response) => {
  try {
    const { timestamp } = req.params
    const snapshot = snapshotStore.getNearestBefore(timestamp)
    const response: ApiResponse<typeof snapshot> = {
      success: true,
      data: snapshot
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(500).json(response)
  }
})

export default router
