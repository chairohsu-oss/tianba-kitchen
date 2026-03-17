export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '菜品库' })
  : { navigationBarTitleText: '菜品库' }
