export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '天霸私厨',
      navigationBarBackgroundColor: '#FFF7ED',
    })
  : {
      navigationBarTitleText: '天霸私厨',
      navigationBarBackgroundColor: '#FFF7ED',
    }
