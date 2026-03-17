export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '智能推荐' })
  : { navigationBarTitleText: '智能推荐' }
