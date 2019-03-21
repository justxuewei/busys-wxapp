import Constants from './constants'

export default class LoginHelper {

    /**
     * 用户登录
     * @param {*} opts 
     *  opts.success 成功回调
     */
    static login(opts={}) {
        wx.login({
            success(res) {
              if (res.code) {
                wx.request({
                  url: Constants.getApiUrl('auth/login'),
                  data: {
                    js_code: res.code
                  },
                  method: 'POST',
                  success: (res) => {
                      // 将token存储到本地=
                      console.log(`获取的用户token为${res.data.data.token}`)
                      wx.setStorageSync('token', res.data.data.token)
                      // 如果含有成功回调则调用
                      if (opts.success) opts.success()
                  }
                })
              } else {
                console.error("登录失败，错误信息：" + res.errMsg)
              }
            }
          })
    }

    /**
     * 检测用户是否已经登录
     * @param {*} opts
     *  opts.success
     *  opts.fail
     *  opts.reloginSuccess 重新登录成功后的回调
     */
    static checkSession(opts) {
        wx.checkSession({
            success: () => {
                opts.success()
            },
            fail: () => {
                login({
                    success: opts.reloginSuccess
                })
                opts.fail()
            }
        })
    }

}