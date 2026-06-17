import { Router, Request, Response } from 'express'
import { ApiResponse, EventListResponse, EventType } from '../../shared/types.js'
import { EventStore } from '../store/EventStore.js'
import { ArchiveService } from '../services/ArchiveService.js'

const router = Router()
const eventStore = EventStore.getInstance()
const archiveService = ArchiveService.getInstance()

router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const type = req.query.type as EventType | undefined
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined

    const result = eventStore.getEventsPaginated(page, pageSize, type, startDate, endDate)
    const response: ApiResponse<EventListResponse> = {
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

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const event = eventStore.getEventById(id)

    if (!event) {
      const response: ApiResponse<null> = {
        success: false,
        error: '事件不存在'
      }
      return res.status(404).json(response)
    }

    const response: ApiResponse<typeof event> = {
      success: true,
      data: event
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

router.get('/type/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params
    const events = eventStore.getEventsByType(type as EventType)
    const response: ApiResponse<typeof events> = {
      success: true,
      data: events
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

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = {
      totalEvents: eventStore.getEventCount(),
      lastVersion: eventStore.getLastVersion(),
      storageStats: archiveService.getStorageStats()
    }
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

export default router
