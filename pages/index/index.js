import UIHelper from "../../utils/ui_helper";
import LoginHelper from "../../utils/login_helper"
import RequestHelper from "../../utils/request_helper";
import Constants from "../../utils/constants";

// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    "updateTime": null,
    // 刷新标识，如果为true则表明目前正在刷新
    "isLoadingNewBusLineList": false,
    // 获取新的数据，在数据初始化的时候会自增到0
    "page": -1,
    "pageSize": 5,
    // 公交线路列表
    "busLineList": [],
    "noMoreBusLineData": false,
    // 经度和纬度
    "lat": null,
    "lng": null,
    // 定时刷新时间间隔
    "updateInterval": 60000,
    // 定时刷新编号
    "timerNo": null,
    // 初始化标识
    "isInitializing": true,
    // 公共汽车模块最小高度
    "busContainerMinHeight": null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 计算实时地图占用的最小长度
    wx.getSystemInfo({
      success: (res) => {
        const height = res.windowHeight
        const heightRpx = UIHelper.px2rpx(height)
        this.setData({
          busContainerMinHeight: heightRpx - 123,
        })
      }
    });
  },
  onShow() {
    this.setData({
      "isInitializing": true
    })
    LoginHelper.checkSession({
      success: () => {
        // console.log("登录成功")
        // 重置数据
        this.setData({
          "updateTime": null,
          "isLoadingNewBusLineList": false,
          // 获取新的数据，在数据初始化的时候会自增到0
          "page": -1,
          "pageSize": 5,
          // 公交线路列表
          "busLineList": [],
          "noMoreBusLineData": false,
          "isLoadingNewBusLineList": false,
        })
        // 获取目前的经纬度信息
        wx.getLocation({
          type: 'gcj02',
          success: (res) => {
            const _latitude = res.latitude
            const _longitude = res.longitude
            this.setData({
              "lat": _latitude,
              "lng": _longitude
            })
            console.log(`目前位置为: (${_latitude}, ${_longitude})`)
            // 初始化数据
            this.getNewBusLine(true)
          }
        })
      },
      fail: () => {
        console.log("登录过期")
        wx.redirectTo({
          url: "/pages/auth/auth"
        })
      },
    })
  },
  onHide() {
    if (this.data.timerNo) {
      clearTimeout(this.data.timerNo)
      console.log(">>> index页面定时器已经被关闭")
    }
  },
  /**
   * 搜索按钮点击后转到搜索视图中
   */
  navigateToSearchView() {
    wx.navigateTo({
      url: "/pages/search/search"
    })
  },
  /**
   * 进入公交车详情页
   */
  navigateToBusLine(e) {
    // 首先收藏点击次数+1
    RequestHelper.get({
      url: Constants.getApiUrl(`/fav/hit?favId=${e.currentTarget.dataset.favid}`),
      serverErrorFail: (res) => {
        console.error("更新收藏次数失败，错误原因: " + res.data.message)
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
  },
  /**
   * 触底回调
   */
  onReachBottom() {
    // 启用更新
    this.getNewBusLine()
  },
  /**
   * 获取新的汽车列表
   * @param {bool} isInit 是否是初始化
   */
  getNewBusLine(isInit = false) {
    if (this.data.noMoreBusLineData) return
    console.log("加载公交车列表")
    this.setData({
      "page": this.data.page + 1
    })
    RequestHelper.get({
      url: Constants.getApiUrl(`/fav/getAll?page=${this.data.page}&pageSize=${this.data.pageSize}`),
      needDisplayErrorModal: true,
      customSuccess: (res) => {
        if (res.data.data.length == 0) {
          console.log("没有更多数据了，禁用加载")
          this.setData({
            "noMoreBusLineData": true,
            "isInitializing": false
          })
          return
        }
        let _busLineList = this.data.busLineList
        let _index = this.data.page * this.data.pageSize
        for (let fav of res.data.data) {
          fav.index = _index
          _busLineList.push(fav)
          _index++
        }
        // console.log(this.data.busLineList)
        this.setData({
          'busLineList': _busLineList
        })
        // 如果是初始化 则开启定时刷新
        if (isInit) {
          this.updateRealTimeInfoTimer()
        } else {
          this.updateRealTimeInfo()
        }
      }
    })
  },
  /**
   * 更新汽车实时信息
   */
  updateRealTimeInfo() {
    if (this.data.isLoadingNewBusLineList) {
      console.log("目前已经有进程正在刷新，本次刷新取消")
      return
    }
    this.setData({
      "isLoadingNewBusLineList": true
    })

    let postData = {};
    postData['lat'] = this.data.lat
    postData['lng'] = this.data.lng
    postData['list'] = []
    for (let item of this.data.busLineList) {
      let _data = {}
      _data['busLineId'] = item.busLineId
      _data['sn'] = item.startStation
      postData['list'].push(_data)
    }
    RequestHelper.post({
      url: Constants.getApiUrl("/bus/getPickUpPointInfo"),
      data: postData,
      customSuccess: (res) => {
        // 合并信息
        let _busLineList = this.data.busLineList
        let _pickUpPointInfo = res.data.data
        console.log(_busLineList)
        console.log(_pickUpPointInfo)
        for (let busLineItem of _busLineList) {
          const _busLineId = busLineItem.busLineId
          for (let pickUpPointInfoItem of _pickUpPointInfo) {
            if (_busLineId === pickUpPointInfoItem.busLineId) {
              busLineItem['distance'] = pickUpPointInfoItem.distance
              busLineItem['howManyStopsForTheNearestBus'] = pickUpPointInfoItem.howManyStopsForTheNearestBus
              busLineItem['isRunning'] = pickUpPointInfoItem.isRunning
              busLineItem['pickUpPointName'] = pickUpPointInfoItem.stationName
              break
            }
          }
        }
        // 更新更新时间
        let now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        this.setData({
          "busLineList": _busLineList,
          "updateTime": minutes < 10 ? `${hours}点0${minutes}分` : `${hours}点${minutes}分`
        })
      },
      complete: () => {
        // 本次刷新结束，关闭标志位
        this.setData({
          "isLoadingNewBusLineList": false,
          "isInitializing": false
        })
      }
    })
  },
  /**
   * 定时启动实时数据刷新
   */
  updateRealTimeInfoTimer() {
    console.log(">>> index页面定时刷新数据")
    this.updateRealTimeInfo()
    const timerNo = setTimeout(() => {
      this.updateRealTimeInfoTimer()
    }, this.data.updateInterval)
    this.setData({
      "timerNo": timerNo
    })
  }
})