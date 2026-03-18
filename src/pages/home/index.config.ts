export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '好帮手' })
  : { navigationBarTitleText: '好帮手' }
