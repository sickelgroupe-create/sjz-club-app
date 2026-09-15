export const SENSITIVE_CONSENT_VERSION = 'IDENTITY-20260910-v1'
export function confirmSensitiveConsent(scene) {
  return new Promise(resolve => uni.showModal({
    title: '敏感个人信息单独同意',
    content: '绵阳市涪城区品奢电竞科技网咖(个人独资)将处理真实姓名、身份证号码，用于'+(scene==='application'?'打手入驻审核及复用已有认证资料':'实名认证审核')+'。身份证号码属于敏感个人信息，泄露或滥用可能影响身份与财产安全。资料仅限必要审核人员处理，不向普通用户公开。拒绝仅影响本次认证或申请，不影响公开内容浏览。保存与删除规则见隐私政策；权利申请邮箱：m19915375856@163.com。是否单独同意本次处理？',
    confirmText: '单独同意', cancelText: '不同意',
    success: result => resolve(result.confirm === true),
    fail: () => resolve(false)
  }))
}
