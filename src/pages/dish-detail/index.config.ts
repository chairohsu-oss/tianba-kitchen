export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '菜品详情' })
  : { navigationBarTitleText: '菜品详情' }
