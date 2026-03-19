export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '',
      navigationStyle: 'custom',
      navigationBarTextStyle: 'black'
    })
  : { 
      navigationBarTitleText: '',
      navigationStyle: 'custom',
      navigationBarTextStyle: 'black'
    }
