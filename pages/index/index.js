import LoginHelper from '../../utils/login_helper'

Page({
  login(e) {
    LoginHelper.login()
  },
  getUserInfo(e) {
    console.log(e)
  }
})