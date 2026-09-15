// Single-locale i18n (zh-CN only). Keep the same `t(key)` API so feature
// screens stay typed without a compile step. Type-safety: extra keys are
// rejected by `as const`; missing lookups fail at the call site.
import { create } from 'zustand';

const zh = {
  'app.name': '经期记录',
  'app.tagline': '面向个人与伴侣的经期与周期记录，隐私优先。',
  'app.smoke-test': '冒烟测试，设计令牌已加载。',

  // Auth — fields
  'auth.field.username': '账号',
  'auth.field.username.placeholder': '英文字母开头，可含数字或下划线',
  'auth.field.username.hint': '英文字母开头，可含数字或下划线。',
  'auth.field.password': '密码',
  'auth.field.password-confirm': '确认密码',

  // Auth — login
  'auth.login.title': '登录',
  'auth.login.description': '使用账号和密码登录。',
  'auth.login.submit': '登录',
  'auth.login.submitting': '登录中…',
  'auth.login.no-account': '还没有账号？',

  // Auth — signup
  'auth.signup.title': '注册',
  'auth.signup.description': '账号和密码即可开始使用。账号名称和头像可稍后在「我的」里设置。',
  'auth.signup.submit': '注册',
  'auth.signup.submitting': '注册中…',
  'auth.signup.has-account': '已有账号？',
  'auth.signup.success-title': '账号已创建',
  'auth.signup.success-body': '请使用账号和密码登录。',
  'auth.signup.success-back-login': '返回登录',
  'auth.signup.privacy-prefix': '注册即表示你已阅读',

  'not-found.title': '404',
  'not-found.message': '页面不存在，链接可能输错了。',
  'not-found.back-home': '返回首页',

  // Common
  'common.loading': '加载中…',
  'common.close': '关闭',
  'common.retry': '重试',
  'error.load-failed': '网络连接失败，请稍后重试',
  'error.config': '应用还没有配置完成，暂时无法连接。',
  'error.household': '还不能开始记录，请刷新页面后再试。',
  'error.crash': '页面出了点问题',
  'error.crash-body': '不用担心，数据还在。重新加载即可继续。',
  'error.reload': '重新加载',
  'auth.error.invalid': '账号或密码错误',
  'auth.error.taken': '该账号已注册',
  'calendar.a11y.day': '周期第 {day} 天，共 {total} 天，阶段：{phase}',
  'logs.flow-label': '经血量',
  'couple.invite.code-a11y': '邀请码',

  // Home (protected)
  'home.signed-in-as': '当前登录',
  'home.sign-out': '退出登录',
  'home.signing-out': '退出中…',
  'home.fallback-name': '你好',

  // Couple — setup page
  'couple.setup.title': '关联伴侣账号',
  'couple.setup.description':
    '可用 6 位邀请码把账号和伴侣连在一起。也可以先自己记录。',
  'couple.setup.skip': '先去记录',

  // Couple — invitation create
  'couple.invite.title': '发起邀请',
  'couple.invite.description':
    '生成 6 位邀请码，通过微信等方式发给伴侣。',
  'couple.invite.create-button': '生成新邀请码',
  'couple.invite.creating': '生成中…',
  'couple.invite.your-code': '你的邀请码：',
  'couple.invite.copy': '复制',
  'couple.invite.copied': '已复制',
  'couple.invite.expires': '邀请码 7 天内有效。',
  'couple.invite.cancel': '取消',
  'couple.invite.cancelling': '取消中…',
  'couple.invite.cancel-confirm':
    '确定取消这个邀请码？伴侣将无法再使用旧码。',

  // Couple — accept invitation
  'couple.accept.title': '已有邀请码？',
  'couple.accept.description': '在这里输入伴侣发给你的邀请码。',
  'couple.accept.code-label': '6 位邀请码',
  'couple.accept.submit': '关联',
  'couple.accept.submitting': '关联中…',

  // Couple — status (home display)
  'couple.partner-prefix': '与',
  'couple.unlink': '解除关联',

  // Cycles — idle state
  'cycles.idle.title': '当前未在经期',
  'cycles.idle.description': '月经开始时点下面的按钮即可。',

  // Cycles — active state
  'cycles.active.title': '正在经期',
  'cycles.active.since': '开始于',
  'cycles.active.day-prefix': '第 ',
  'cycles.active.day-suffix': ' 天',

  // Cycles — actions
  'cycles.action.start-today': '今天来月经了',
  'cycles.action.starting': '记录中…',
  'cycles.action.end-today': '月经结束了',
  'cycles.action.ending': '记录中…',

  // Cycles — history list
  'cycles.history.title': '历史记录',
  'cycles.history.empty': '还没有经期记录。第一次记录后会出现在这里。',
  'cycles.history.ongoing': '（进行中）',
  'cycles.history.days-suffix': '天',
  'cycles.history.arrow': '→',

  // Prediction
  'prediction.title': '预测',
  'prediction.insufficient-data':
    '至少需要 2 次经期记录才能预测。先记下一次吧。',
  'prediction.next-start': '下次月经',
  'prediction.ovulation': '排卵',
  'prediction.fertile': '易孕期',
  'prediction.avg-cycle': '平均周期',
  'prediction.days-suffix': '天',
  'prediction.based-on': '基于',
  'prediction.cycles-suffix': '个近期周期',
  'prediction.confidence-prefix': '±',

  // Calendar
  'calendar.title': '日历',
  'calendar.day.full-format': 'yyyy年M月d日 EEEE',
  'calendar.day.period': '经期日',
  'calendar.day.no-period': '非经期日',
  'calendar.day.today-suffix': '（今天）',
  'calendar.a11y.prev-month': '上个月',
  'calendar.a11y.next-month': '下个月',
  'calendar.day.edit-cycle': '编辑这次经期',
  'calendar.day.start-here': '从这天开始记录经期',
  'calendar.day.close': '关闭',

  // Charts
  'chart.cycle-trend.title': '周期长度趋势',
  'chart.cycle-trend.empty': '至少需要 2 个周期才能看趋势。',
  'chart.cycle-trend.tooltip-length': '周期长度',
  'chart.cycle-trend.avg-line': '平均',
  'chart.symptom-freq.title': '常见症状',
  'chart.symptom-freq.empty': '还没有症状记录。在每日记录里记下后即可看到趋势。',
  'chart.symptom-freq.count-suffix': '次',

  // Insights
  'insights.title': '洞察',
  'insights.avg-cycle': '平均周期',
  'insights.variability': '波动',
  'insights.regularity': '规律性',
  'insights.regular': '规律',
  'insights.irregular': '不规律',
  'insights.regular-hint': '波动小于 7 天，一般视为规律。',
  'insights.irregular-hint': '波动超过 7 天。若你担心，建议咨询医生。',
  'insights.days-suffix': '天',
  'insights.daily.title': '今日小贴士',

  // Cycle wheel
  'wheel.day-prefix': '第 ',
  'wheel.of': '/',
  'wheel.phase.period': '经期',
  'wheel.phase.follicular': '卵泡期',
  'wheel.phase.fertile': '易孕期',
  'wheel.phase.ovulation': '排卵',
  'wheel.phase.luteal': '黄体期',
  'wheel.empty': '还没有周期数据。记下第一次月经即可开始。',

  // Daily log form
  'daily-log.section.cycle': '周期',
  'daily-log.section.flow': '经血量',
  'daily-log.section.symptoms': '症状',
  'daily-log.section.moods': '心情',
  'daily-log.section.notes': '笔记',
  'daily-log.notes.placeholder': '今天感觉怎么样？（选填）',
  'daily-log.flow.0': '没有',
  'daily-log.flow.1': '点滴',
  'daily-log.flow.2': '较少',
  'daily-log.flow.3': '中等',
  'daily-log.flow.4': '较多',
  'daily-log.save': '保存记录',
  'daily-log.saving': '保存中…',
  'daily-log.delete': '删除记录',
  'daily-log.delete-confirm': '删除今天的记录？',
  'daily-log.empty-state': '这一天还没有记录。',
  'daily-log.partner-readonly': '这是对方的记录，只能查看，不能修改。',

  // Logs page
  'logs.title': '全部记录',
  'logs.search.placeholder': '搜索笔记…',
  'logs.filter.symptoms': '按症状筛选',
  'logs.filter.clear': '清除筛选',
  'logs.results-count': '条记录',
  'logs.empty': '没有匹配的记录。',
  'logs.empty-none': '还没有记录。',
  'logs.view-all': '查看全部记录',

  // Data export
  'export.title': '导出数据',
  'export.description': '导出你本人的全部周期与记录（分页拉取，不含亲密活动明文）。',
  'export.button': '下载 CSV',
  'export.exporting': '导出中…',

  // PWA install
  'install.title': '安装经期记录',
  'install.description':
    '添加到主屏幕，可全屏打开并支持离线使用。',
  'install.button': '安装应用',
  'install.installed': '已安装 ✓',
  'install.ios.title': '在 iPhone 上安装',
  'install.ios.body':
    '用 Safari 打开，点分享按钮，再选择「添加到主屏幕」。',

  // Bottom tab navigation
  'nav.home': '今天',
  'nav.calendar': '日历',
  'nav.insights': '洞察',
  'nav.settings': '我的',

  // Page-level titles
  'page.calendar.title': '日历',
  'page.insights.title': '洞察',

  // Home — slim prediction snapshot
  'home.snapshot.next-period-in': '下次月经还有',
  'home.snapshot.days-suffix': '天',
  'home.snapshot.starts-on': '预计',
  'home.snapshot.see-insights': '查看全部洞察',
  'home.snapshot.no-data': '预测数据还不够',

  // Home — quick log card
  'home.today-log.title': '今日记录',
  'home.today-log.empty': '今天还没有记录。',
  'home.today-log.has-flow': '已记经血量',
  'home.today-log.symptoms-count': '个症状',
  'home.today-log.moods-count': '种心情',
  'home.today-log.has-notes': '+ 笔记',
  'home.today-log.button.add': '现在记录',
  'home.today-log.button.edit': '编辑记录',

  // Home greeting
  'home.greeting.morning': '早上好',
  'home.greeting.afternoon': '下午好',
  'home.greeting.evening': '晚上好',
  'home.greeting.night': '夜深了',
  'home.role.tracker': '周期记录',
  'home.role.supporter': '伴侣陪伴',
  'home.role.solo': '独自使用',
  'home.partner-pill.linked': '已关联',
  'home.partner-pill.solo': '独自记录',

  // Toast notifications
  'toast.period.started': '已记下月经开始',
  'toast.period.ended': '已记下月经结束',
  'toast.daily-log.saved': '记录已保存',
  'toast.daily-log.deleted': '记录已删除',
  'toast.cycle.saved': '经期已保存',
  'toast.cycle.deleted': '经期已删除',
  'toast.profile.saved': '资料已保存',
  'toast.couple.unlinked': '已解除伴侣关联',
  'toast.error.generic': '出错了，请再试一次。',

  // Sexual activity (E2EE-gated)
  'sexual-activity.section.title': '亲密活动（端到端加密）',
  'sexual-activity.gate.not-setup':
    '此栏位会在本机加密。请先在设置中开启端到端加密。',
  'sexual-activity.gate.locked':
    '端到端加密已锁定。请先到设置中解锁。',
  'sexual-activity.gate.go-to-settings': '前往设置',
  'sexual-activity.field.active': '今天有亲密活动吗？',
  'sexual-activity.field.type': '是否采取避孕措施？',
  'sexual-activity.type.protected': '有（保护）',
  'sexual-activity.type.unprotected': '没有（未保护）',
  'sexual-activity.field.intensity': '强度',
  'sexual-activity.intensity.1': '较轻',
  'sexual-activity.intensity.2': '中等',
  'sexual-activity.intensity.3': '较强',
  'sexual-activity.field.notes': '补充说明（选填）',
  'sexual-activity.error.decrypt': '解密失败，口令是否正确？',

  // Push notifications
  'push.title': '推送通知',
  'push.description':
    '下次月经前在锁屏显示提醒。开启后会发送到这台设备。',
  'push.status.subscribed': '已开启',
  'push.status.not-subscribed': '未开启',
  'push.status.permission-denied': '权限被拒绝',
  'push.status.unsupported': '当前浏览器不支持',
  'push.status.no-key': '暂未开通',
  'push.button.enable': '开启通知',
  'push.button.enabling': '开启中…',
  'push.button.disable': '关闭通知',
  'push.permission-denied.help':
    '你之前拒绝了通知。请到浏览器设置 → 网站权限 → 本站，允许通知。',
  'push.no-key.help': '推送暂未开通。',
  'push.privacy-note':
    '隐私：通知内容不含敏感健康数据，只会提示「下次月经还有 N 天」。',

  // E2EE / passphrase flow
  'e2ee.title': '端到端加密',
  'e2ee.description':
    '额外安全层。敏感数据（亲密活动）会在本机加密后再上传，开发者也无法查看。',
  'e2ee.status.not-setup': '未开启',
  'e2ee.status.locked': '已锁定',
  'e2ee.status.unlocked': '已开启',
  'e2ee.status.error': '加密状态加载失败',
  'e2ee.button.retry': '重试',
  'e2ee.button.setup': '开启端到端加密',
  'e2ee.button.unlock': '解锁',
  'e2ee.button.lock': '立即锁定',
  'e2ee.button.change-passphrase': '更换口令',
  'e2ee.button.disable': '关闭加密（清除加密数据）',
  'e2ee.setup.title': '设置加密口令',
  'e2ee.setup.warning':
    '重要：忘记口令后，加密数据无法恢复（没有后门）。请使用强口令并保存在密码管理器中。',
  'e2ee.setup.passphrase-label': '口令（至少 12 位）',
  'e2ee.setup.confirm-label': '确认口令',
  'e2ee.setup.acknowledge':
    '我明白：如果忘记口令，加密数据将永久丢失。',
  'e2ee.setup.submit': '完成设置',
  'e2ee.setup.processing': '正在设置…（PBKDF2 60 万次迭代）',
  'e2ee.setup.mismatch': '两次口令不一致。',
  'e2ee.unlock.title': '解锁端到端加密',
  'e2ee.unlock.passphrase-label': '加密口令',
  'e2ee.unlock.submit': '解锁',
  'e2ee.unlock.processing': '解锁中…',
  'e2ee.unlock.error': '口令不正确，请重试。',
  'e2ee.disable.confirm':
    '确定关闭端到端加密？只会永久清除你自己的加密口令与亲密活动密文，不会改动对方的数据。',

  // Delete account flow
  'delete-account.title': '删除账号',
  'delete-account.description':
    '先停用账号（软删除），30 天后永久清除你本人的数据。无法自助恢复。伴侣仍保留自己的历史，且看不到你的内容。',
  'delete-account.button': '删除我的账号',
  'delete-account.dialog.title': '确定删除账号？',
  'delete-account.dialog.body':
    '账号会立即停用，你本人的周期与记录进入软删除。30 天后永久清除，无法自助恢复。伴侣会回到独自使用，并继续看到自己的历史，看不到你的记录。',
  'delete-account.dialog.confirm-label': '请输入「删除」以确认：',
  'delete-account.dialog.confirm-keyword': '删除',
  'delete-account.dialog.confirm': '是的，删除我的账号',
  'delete-account.dialog.cancel': '取消',
  'delete-account.deleting': '删除中…',

  // MFA / 2FA
  'mfa.title': '两步验证',
  'mfa.description': '使用验证器应用增加一层保护。登录时需输入应用中的 6 位验证码。',
  'mfa.status.enrolled': '已开启',
  'mfa.status.not-enrolled': '未开启',
  'mfa.button.enroll': '开启两步验证',
  'mfa.button.unenroll': '关闭两步验证',
  'mfa.enroll.scan-instruction':
    '用验证器应用扫描下方二维码，再输入 6 位验证码。',
  'mfa.enroll.secret-fallback': '或手动输入密钥：',
  'mfa.enroll.code-label': '应用中的 6 位验证码',
  'mfa.enroll.verify': '验证并开启',
  'mfa.enroll.verifying': '验证中…',
  'mfa.enroll.cancel': '取消',
  'mfa.enroll.success': '两步验证已开启 ✓',
  'mfa.error.invalid-code': '验证码不正确，请重试。',
  'mfa.unenroll.confirm': '确定关闭两步验证？',
  'mfa.challenge.title': '输入两步验证码',
  'mfa.challenge.body': '此账号已开启两步验证，请输入验证器中的 6 位验证码。',
  'mfa.challenge.submit': '继续',
  'mfa.challenge.sign-out': '退出登录',

  // Privacy notice page
  'privacy.title': '隐私与数据',
  'privacy.subtitle': '依据《中华人民共和国个人信息保护法》的隐私说明',
  'privacy.intro':
    '「经期记录」处理生殖健康相关个人信息，属于敏感个人信息。本说明介绍数据如何被处理、存储，以及你作为个人的权利。',
  'privacy.contact': '数据处理者联系方式',
  'privacy.section.controller': '数据处理者',
  'privacy.section.data-types': '处理的数据类型',
  'privacy.section.purposes': '处理目的',
  'privacy.section.legal-basis': '处理依据',
  'privacy.section.retention': '保存期限',
  'privacy.section.transfer': '跨境传输',
  'privacy.section.rights': '你的权利',
  'privacy.section.contact': '联系与问询',
  'privacy.full-text-link': '阅读完整隐私说明',
  'privacy.consent-history': '我的同意记录',
  'privacy.consent-purpose.core_processing': '核心处理（健康数据）',
  'privacy.consent-purpose.cross_border_transfer': '跨境传输（东京 + 全球节点）',
  'privacy.consent-purpose.partner_sharing': '与伴侣共享数据',
  'privacy.consent-purpose.sensitive_data_e2ee': '端到端加密的敏感数据',
  'privacy.consent.granted': '已同意',
  'privacy.consent.withdrawn': '已撤回',
  'privacy.consent.never-set': '尚未设置',
  'privacy.consent.last-event': '最近一次',
  'privacy.controller.name-label': '名称',
  'privacy.controller.email-label': '邮箱',
  'privacy.controller.status-label': '身份',
  'privacy.controller.status-value': '个人开发者（非法人实体）',
  'privacy.controller.placeholder-name': '经期记录运营者',
  'privacy.controller.placeholder-email': '暂未公开联系邮箱',
  'privacy.controller.contact-label': '联系方式',
  'privacy.controller.placeholder-contact': '请通过应用内设置联系',
  'privacy.data.general': '一般信息：',
  'privacy.data.general-1': '账号、昵称、头像表情',
  'privacy.data.general-2': '活动时间（登录、最近使用）',
  'privacy.data.sensitive': '敏感个人信息（生殖健康）：',
  'privacy.data.sensitive-1': '月经起止日期、经血量',
  'privacy.data.sensitive-2': '身体症状（痛经、头痛、痘痘等）',
  'privacy.data.sensitive-3': '情绪记录',
  'privacy.data.sensitive-4': '每日笔记（自由文本）',
  'privacy.purposes.body':
    '你的数据仅用于：（1）周期记录核心功能；（2）与已关联伴侣共享；（3）账号安全通知；（4）备份与恢复。',
  'privacy.purposes.disclaimer':
    '不做广告、不为广告做画像、不向第三方出售，也不用于训练 AI 模型。',
  'privacy.legal.body':
    '因为涉及健康类敏感个人信息，处理依据是你的单独同意，而非合同履行或正当利益。',
  'privacy.retention.1': '账号有效期间持续保存',
  'privacy.retention.2': '删除账号后：软删除 30 天，再永久清除',
  'privacy.retention.3': '数据库时间点恢复备份：滚动 7 天',
  'privacy.retention.4': '登录日志（IP、浏览器信息）：30 天',
  'privacy.transfer.body':
    '数据存储在中国境外的云服务商（主数据库位于东京，边缘加速覆盖全球）。跨境传输需你单独同意。',
  'privacy.rights.1': '查阅权（设置中可导出 CSV）',
  'privacy.rights.2': '更正权（可在应用内直接编辑）',
  'privacy.rights.3': '删除权（设置 → 删除账号）',
  'privacy.rights.4': '可携带权（CSV 格式）',
  'privacy.rights.5': '撤回同意（设置中开关）',
  'privacy.rights.6': '依法投诉或寻求救济',
  'privacy.rights.sla': '查阅请求将在收到邮件后 3×24 小时内回复。',

  // Settings page
  'settings.title': '设置',
  'settings.back': '返回',
  'settings.theme.label': '外观',
  'settings.theme.dark': '深色模式',
  'settings.theme.light': '浅色模式',
  'settings.language.label': '语言',
  'settings.account.title': '账号',
  'settings.account.username': '账号',
  'settings.couple.title': '伴侣',
  'settings.couple.setup': '关联伴侣账号',
  'settings.couple.setup-body': '用邀请码和伴侣连在一起，之后可共享记录。',
  'settings.profile.title': '资料',

  // Profile form
  'profile.field.display-name': '账号名称',
  'profile.field.avatar-emoji': '头像',
  'profile.save': '保存',
  'profile.saving': '保存中…',
  'profile.saved': '已保存 ✓',

  // Couple unlink
  'couple.unlink.button': '解除伴侣关联',
  'couple.unlink.unlinking': '解除中…',
  'couple.unlink.confirm-title': '确定解除关联？',
  'couple.unlink.confirm-body':
    '解除后双方都无法再查看对方数据。历史仍保留在数据库中，但应用内不可见。若要重新关联，需要一方再生成邀请码。',
  'couple.unlink.confirm': '是的，解除',
  'couple.unlink.cancel': '取消',

  // Cycles — backdate link + dialog
  'cycles.action.backdate': '或补记其他日期',
  'cycles.dialog.add-title': '记录经期',
  'cycles.dialog.add-description':
    '填写开始日期和结束日期（选填）。适合事后补记。',
  'cycles.dialog.edit-title': '编辑经期',
  'cycles.dialog.edit-description': '更新日期或删除这条记录。',
  'cycles.dialog.field.start-date': '开始日期',
  'cycles.dialog.field.end-date': '结束日期（选填）',
  'cycles.dialog.field.notes': '备注（选填）',
  'cycles.dialog.save': '保存',
  'cycles.dialog.saving': '保存中…',
  'cycles.dialog.delete': '删除',
  'cycles.dialog.delete-confirm':
    '确定删除这次经期？可从数据库历史恢复，但应用内无法撤销。',
} as const;

export type MessageKey = keyof typeof zh;
export type Locale = 'zh-CN';

const catalog: Record<Locale, Record<MessageKey, string>> = { 'zh-CN': zh };

export const supportedLocales: readonly Locale[] = ['zh-CN'];
export const defaultLocale: Locale = 'zh-CN';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Locale is fixed to zh-CN. Store kept so `<html lang>` sync and existing
// call sites stay typed; switching is a no-op.
export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: defaultLocale,
  setLocale: () => set({ locale: defaultLocale }),
}));

export const useTranslation = () => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = (key: MessageKey): string => catalog[locale][key] ?? catalog[defaultLocale][key];
  return { t, locale, setLocale };
};
