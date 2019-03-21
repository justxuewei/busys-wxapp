import LoginHelper from "../../utils/login_helper"
import RequestHelper from "../../utils/request_helper";
import Constants from "../../utils/constants";
import Utils from "../../utils/utils";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    description: '我们需要您授权登录以获取实时公交车信息并开启完整版功能',
    loginType: 'primary',
    loginDisabled: false,
    loginText: "微信登录",
    locationType: 'default',
    locationDisabled: true,
    locationText: "获取位置信息",
    nextPage: "123",
    canIAccessLocation: false,
  },

  onLoad: function(params) {
    // 确定用户是否已经授权位置
    wx.getSetting({
      success: (res) => {
        location = res.authSetting['scope.userLocation']
        console.log(">>> 是否拥有获取地理位置的权限: %s", !Utils.isNullOrUndefined(location))
        this.setData({
          canIAccessLocation: !Utils.isNullOrUndefined(location),
          nextPage: Utils.isNullOrUndefined(params.nextPage) ? "/pages/index/index" : params.nextPage
        })
      }
    })
  },

  // 切换状态
  switchToGetLocation: function() {
    this.setData({
      loginType: 'default',
      loginDisabled: true,
      locationType: 'primary',
      locationDisabled: false,
      description: "我们需要收集您的位置信息以提供最精确的车站定位服务"
    })
  },

  redirectToNext() {
    wx.redirectTo({
      url: this.data.nextPage
    })
  },

  login: function() {
    LoginHelper.login({
      success: (res) => {
        console.log("登录成功")
        wx.getUserInfo({
          lang: "zh_CN",
          success: (res) => {
            console.log("成功获取用户数据");
            console.log(res);
            // 用户数据上传
            RequestHelper.post({
              url: Constants.getApiUrl("/user/saveUserInfo"),
              data: res.userInfo,
              customSuccess: (res) => {
                // 用户信息上传成功
                console.log(">>> 用户信息上传成功")
                this.switchToGetLocation()
                this.location()
              },
              serverErrorFail: (res) => {
                wx.showToast({
                  title: res.data.message,
                  icon: "none",
                  duration: 1000
                })
              }
            })
          }
        })
      },
      fail: (res) => {
        wx.showToast({
          title: "登录失败，请稍后重试",
          icon: "none",
          duration: 1000
        })
      }
    })
  },

  location: function() {
    if (this.data.canIAccessLocation) {
      this.redirectToNext()
      return
    }
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        this.redirectToNext()
      }
    })
  }

})