export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '编辑菜品' })
  : { navigationBarTitleText: '编辑菜品' }
