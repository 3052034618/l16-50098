import { AccountService } from './services/AccountService.js'
import { EventSourcingService } from './services/EventSourcingService.js'
import { EventStore } from './store/EventStore.js'
import { generateBusinessNo } from './utils/format.js'

const accountService = AccountService.getInstance()
const eventSourcingService = EventSourcingService.getInstance()
const eventStore = EventStore.getInstance()

async function initDemoData() {
  console.log('开始初始化演示数据...')
  
  const currentEvents = eventStore.getEventCount()
  if (currentEvents > 0) {
    console.log(`已有 ${currentEvents} 条事件记录，跳过初始化`)
    return
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  try {
    await accountService.recharge({
      amount: 10000,
      businessNo: generateBusinessNo('INIT'),
      operator: 'system',
      description: '初始账户资金'
    })
    console.log('✓ 初始充值 ¥10,000.00')

    await accountService.recharge({
      amount: 5000,
      businessNo: generateBusinessNo('REC'),
      operator: 'admin',
      description: '经营收入'
    })
    console.log('✓ 经营收入充值 ¥5,000.00')

    await accountService.consume({
      amount: 2500,
      businessNo: generateBusinessNo('PAY'),
      operator: 'admin',
      description: '采购办公用品'
    })
    console.log('✓ 消费支出 ¥2,500.00')

    await accountService.consume({
      amount: 1800,
      businessNo: generateBusinessNo('PAY'),
      operator: 'admin',
      description: '支付供应商货款'
    })
    console.log('✓ 消费支出 ¥1,800.00')

    const consumeEvent = await accountService.consume({
      amount: 3000,
      businessNo: generateBusinessNo('PAY'),
      operator: 'admin',
      description: '采购设备'
    })
    console.log('✓ 消费支出 ¥3,000.00')

    await accountService.refund({
      amount: 500,
      businessNo: generateBusinessNo('REF'),
      operator: 'admin',
      description: '设备退货退款',
      relatedEventId: consumeEvent.id
    })
    console.log('✓ 退款 ¥500.00')

    await accountService.freeze({
      amount: 4000,
      businessNo: generateBusinessNo('FRZ'),
      operator: 'admin',
      description: '订单保证金冻结'
    })
    console.log('✓ 冻结 ¥4,000.00')

    await accountService.recharge({
      amount: 8000,
      businessNo: generateBusinessNo('REC'),
      operator: 'admin',
      description: '客户预付款'
    })
    console.log('✓ 客户预付款充值 ¥8,000.00')

    await accountService.consume({
      amount: 1200,
      businessNo: generateBusinessNo('PAY'),
      operator: 'admin',
      description: '水电费支出'
    })
    console.log('✓ 消费支出 ¥1,200.00')

    await accountService.unfreeze({
      amount: 2000,
      businessNo: generateBusinessNo('UFR'),
      operator: 'admin',
      description: '部分保证金解冻'
    })
    console.log('✓ 解冻 ¥2,000.00')

    const snapshot = eventSourcingService.createSnapshot()
    console.log(`✓ 创建快照，当前总余额: ¥${(10000 + 5000 - 2500 - 1800 - 3000 + 500 - 4000 + 8000 - 1200).toFixed(2)}`)

    console.log('\n演示数据初始化完成！')
    console.log(`总计 ${eventStore.getEventCount()} 条事件记录`)
    
    const balance = accountService.getBalance()
    console.log(`\n当前账户状态:`)
    console.log(`  总余额: ¥${balance.totalBalance.toFixed(2)}`)
    console.log(`  可用余额: ¥${balance.availableBalance.toFixed(2)}`)
    console.log(`  冻结余额: ¥${balance.frozenBalance.toFixed(2)}`)
    console.log(`  账户状态: ${balance.isFrozen ? '冻结' : '正常'}`)
    console.log(`  计算方式: 从${balance.calculatedFrom === 'snapshot' ? '快照' : '初始状态'}计算，回放 ${balance.eventReplayed} 个事件`)

  } catch (error) {
    console.error('初始化数据失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

initDemoData()
