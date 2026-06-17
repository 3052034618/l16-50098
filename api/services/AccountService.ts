import { EventType, AccountEvent, OperationRequest, BalanceResponse } from '../../shared/types.js'
import { EventStore } from '../store/EventStore.js'
import { EventSourcingService } from './EventSourcingService.js'

export class AccountService {
  private static instance: AccountService
  private eventStore: EventStore
  private eventSourcingService: EventSourcingService

  private constructor() {
    this.eventStore = EventStore.getInstance()
    this.eventSourcingService = EventSourcingService.getInstance()
  }

  static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService()
    }
    return AccountService.instance
  }

  async recharge(request: OperationRequest): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('充值金额必须大于0')
    }

    const event = this.eventStore.append(
      EventType.RECHARGE,
      request.amount,
      request.businessNo,
      request.operator,
      request.description,
      request.relatedEventId
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async consume(request: OperationRequest): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('消费金额必须大于0')
    }

    const state = await this.eventSourcingService.getAccountState()
    
    if (state.isFrozen) {
      throw new Error('账户处于冻结状态，无法进行消费操作')
    }

    if (state.availableBalance < request.amount) {
      throw new Error(`可用余额不足，当前可用余额: ${state.availableBalance}`)
    }

    const event = this.eventStore.append(
      EventType.CONSUME,
      request.amount,
      request.businessNo,
      request.operator,
      request.description,
      request.relatedEventId
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async refund(request: OperationRequest): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('退款金额必须大于0')
    }

    if (!request.relatedEventId) {
      throw new Error('退款操作必须关联原消费事件ID')
    }

    const relatedEvent = this.eventStore.getEventById(request.relatedEventId)
    if (!relatedEvent) {
      throw new Error('关联的消费事件不存在')
    }

    if (relatedEvent.type !== EventType.CONSUME) {
      throw new Error('只能对消费事件进行退款')
    }

    const event = this.eventStore.append(
      EventType.REFUND,
      request.amount,
      request.businessNo,
      request.operator,
      request.description,
      request.relatedEventId
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async freeze(request: OperationRequest): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('冻结金额必须大于0')
    }

    const state = await this.eventSourcingService.getAccountState()
    
    if (state.availableBalance < request.amount) {
      throw new Error(`可用余额不足，当前可用余额: ${state.availableBalance}`)
    }

    const event = this.eventStore.append(
      EventType.FREEZE,
      request.amount,
      request.businessNo,
      request.operator,
      request.description,
      request.relatedEventId,
      { freezeReason: request.description || '系统冻结' }
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async unfreeze(request: OperationRequest): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('解冻金额必须大于0')
    }

    const state = await this.eventSourcingService.getAccountState()
    
    if (state.frozenBalance < request.amount) {
      throw new Error(`冻结余额不足，当前冻结余额: ${state.frozenBalance}`)
    }

    const event = this.eventStore.append(
      EventType.UNFREEZE,
      request.amount,
      request.businessNo,
      request.operator,
      request.description,
      request.relatedEventId
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async compensate(request: OperationRequest, compensateType: EventType): Promise<AccountEvent> {
    if (request.amount <= 0) {
      throw new Error('补偿金额必须大于0')
    }

    if (!request.relatedEventId) {
      throw new Error('补偿操作必须关联原事件ID')
    }

    const relatedEvent = this.eventStore.getEventById(request.relatedEventId)
    if (!relatedEvent) {
      throw new Error('关联的事件不存在')
    }

    const event = this.eventStore.append(
      EventType.COMPENSATE,
      request.amount,
      request.businessNo,
      request.operator,
      request.description || `补偿事件: ${relatedEvent.id}`,
      request.relatedEventId,
      {
        compensateType,
        originalEventType: relatedEvent.type,
        originalEventAmount: relatedEvent.amount
      }
    )

    await this.checkAndCreateSnapshot()
    return event
  }

  async getBalance(timestamp?: string): Promise<BalanceResponse> {
    return this.eventSourcingService.calculateBalance(timestamp)
  }

  private async checkAndCreateSnapshot(): Promise<void> {
    if (await this.eventSourcingService.shouldCreateSnapshot(50)) {
      await this.eventSourcingService.createSnapshot()
    }
  }
}
