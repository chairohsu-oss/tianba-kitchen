export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '录入菜品' })
  : { navigationBarTitleText: '录入菜品' }
