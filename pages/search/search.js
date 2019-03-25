import UIHelper from "../../utils/ui_helper";
import RequestHelper from "../../utils/request_helper"
import Constants from "../../utils/constants";

// pages/search/search.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    resultContainerMinHeight: 0,
    resultList: null
  },
  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        const height = res.windowHeight
        const heightRpx = UIHelper.px2rpx(height)
        this.setData({
          resultContainerMinHeight: heightRpx - 144
        })
      }
    });
  },
  searchInputEvent(e) {
    const searchText = e.detail.value
    if (searchText === "") {
      this.setData({
        resultList: null
      })
    }
  },
  searchConfirmEvent(e) {
    this.search(e.detail.value)
  },
  search(text) {
    RequestHelper.post({
      url: Constants.getApiUrl("/bus/line/search"),
      data: {
        busLineName: text
      },
      customSuccess: (res) => {
        const list = res.data.data.result
        this.setData({
          resultList: list
        })
      }
    })
  },
  navigateToBus(e) {
    RequestHelper.get({
      url: Constants.getApiUrl(`/fav/create?busLineId=${e.currentTarget.dataset.buslineid}&sn=${e.currentTarget.dataset.sn}`),
      serverErrorFail: (res) => {
        console.error("添加到收藏错误，错误原因: " + res.data.message)
      },
      complete: () => {
        const busLineId = e.currentTarget.dataset.buslineid
        const startStation = e.currentTarget.dataset.sn
        const endStation = e.currentTarget.dataset.en
        const busLineName = e.currentTarget.dataset.bln
        wx.navigateTo({
          url: `/pages/bus/bus?bli=${busLineId}&sn=${startStation}&en=${endStation}&bln=${busLineName}`
        })
      }
    })
  }
})