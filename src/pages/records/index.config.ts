export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '美味记录' })
  : { navigationBarTitleText: '美味记录' }
