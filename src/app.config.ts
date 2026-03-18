export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/dishes/index',
    'pages/add/index',
    'pages/records/index',
    'pages/dish-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '天霸私厨',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1F2937',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '家人推荐',
        iconPath: './assets/tabbar/sparkles.png',
        selectedIconPath: './assets/tabbar/sparkles-active.png',
      },
      {
        pagePath: 'pages/dishes/index',
        text: '菜品库',
        iconPath: './assets/tabbar/utensils-crossed.png',
        selectedIconPath: './assets/tabbar/utensils-crossed-active.png',
      },
      {
        pagePath: 'pages/add/index',
        text: '录入菜品',
        iconPath: './assets/tabbar/plus-circle.png',
        selectedIconPath: './assets/tabbar/plus-circle-active.png',
      },
      {
        pagePath: 'pages/records/index',
        text: '美味记录',
        iconPath: './assets/tabbar/notebook-pen.png',
        selectedIconPath: './assets/tabbar/notebook-pen-active.png',
      },
    ],
  },
})
