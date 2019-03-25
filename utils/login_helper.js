import Constants from './constants'
import RequestHelper from './request_helper'

export default class LoginHelper {

  /**
   * 用户登录
   * @param {*} opts 
   *  opts.success 成功回调
   *  opts.fail
   *  opts.complete
   */
  static login(opts = {}) {
    wx.login({
      success(res) {
        if (res.code) {
          wx.request({
            url: Constants.getApiUrl('/auth/login'),
            data: {
              js_code: res.code
            },
            method: 'POST',
            success: (res) => {
              // 将token存储到本地=
              console.log(`获取的用户token为${res.data.data.token}`)
              wx.setStorageSync('token', res.data.data.token)
              // 如果含有成功回调则调用
              if (opts.success) opts.success(res)
            }
          })
        } else {
          console.error("登录失败，错误信息：" + res.errMsg)
        }
      },
      fail(res) {
        console.error(">>> 登录失败")
        if (opts.fail) opts.fail(res)
      }
    })
  }

  /**
   * 检测用户是否已经登录
   * @param {*} opts
   *  opts.success
   *  opts.fail
   */
  static checkSession(opts) {
    wx.checkSession({
      success() {
        console.log(">>> 1")
        RequestHelper.get({
          url: Constants.getApiUrl("/auth/check"),
          customSuccess: (res) => {
            if (opts.success) opts.success()
          },
          serverErrorFail: (res) => {
            wx.redirectTo({
              url: "/pages/auth/auth"
            })
            // 重新登录
            // wx.showToast({
            //   title: "登录过期，请重新登录",
            //   icon: "none",
            //   duration: 1000,
            //   success: () => {
            //     setTimeout(() => {
            //       wx.redirectTo({
            //         url: "/pages/auth/auth"
            //       })
            //     }, 1000)
            //   }
            // })
          }
        })
      },
      fail: () => {
        if (opts.fail) opts.fail()
      },
      complete: opts.complete
    })
  }

}