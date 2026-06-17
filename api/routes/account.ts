import { Router, Request, Response } from 'express'
import { ApiResponse, OperationRequest, EventType } from '../../shared/types.js'
import { AccountService } from '../services/AccountService.js'
import { EventSourcingService } from '../services/EventSourcingService.js'

const router = Router()
const accountService = AccountService.getInstance()
const eventSourcingService = EventSourcingService.getInstance()

router.get('/balance', (req: Request, res: Response) => {
  try {
    const balance = accountService.getBalance()
    const response: ApiResponse<typeof balance> = {
      success: true,
      data: balance
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

router.get('/balance/:timestamp', (req: Request, res: Response) => {
  try {
    const { timestamp } = req.params
    const balance = accountService.getBalance(timestamp)
    const response: ApiResponse<typeof balance> = {
      success: true,
      data: balance,
      message: `已查询到 ${new Date(timestamp).toLocaleString()} 的账户余额`
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

router.post('/recharge', (req: Request, res: Response) => {
  try {
    const request: OperationRequest = req.body
    const event = accountService.recharge(request)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '充值成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

router.post('/consume', (req: Request, res: Response) => {
  try {
    const request: OperationRequest = req.body
    const event = accountService.consume(request)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '消费成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

router.post('/refund', (req: Request, res: Response) => {
  try {
    const request: OperationRequest = req.body
    const event = accountService.refund(request)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '退款成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

router.post('/freeze', (req: Request, res: Response) => {
  try {
    const request: OperationRequest = req.body
    const event = accountService.freeze(request)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '冻结成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

router.post('/unfreeze', (req: Request, res: Response) => {
  try {
    const request: OperationRequest = req.body
    const event = accountService.unfreeze(request)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '解冻成功'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

router.post('/compensate', (req: Request, res: Response) => {
  try {
    const { request, compensateType } = req.body as {
      request: OperationRequest
      compensateType: EventType
    }
    const event = accountService.compensate(request, compensateType)
    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: '补偿事件已追加'
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
    res.status(400).json(response)
  }
})

export default router
