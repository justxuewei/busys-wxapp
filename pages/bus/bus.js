import UIHelper from "../../utils/ui_helper";
import RequestHelper from "../../utils/request_helper";
import Constants from "../../utils/constants";

// pages/bus/bus.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    busLineId: null,
    startStation: null,
    endStation: null,
    busLineName: null,
    // 经度和纬度
    "lat": null,
    "lng": null,
    // 地图宽度
    mapWidth: 0,
    // 站点数据
    stationData: null,
    // 最近的站点编号
    nearestStationOrder: null,
    // 实时地图占用的最小长度
    realTimeContainerMinHeight: 0,
    // 公交汽车实时数据
    realTimeData: null,
    // detail类型
    detailType: "station",
    detailIndex: null,
    // 乘车点信息
    pickUpPointInfo: null,
    dpr: null,
    // 定时刷新时间
    updateTime: null,
    // 定时器编号
    timerNo: null,
    // 刷新间隔
    updateInterval: 60000,
    // 实时地图滑动距离
    scrollLeft: null,
    // 正在切换线路
    isSwitchingLine: false,
    // 切换动画
    switchingAnimate: null,
    animateTimes: 1
  },
  onLoad: function (options) {
    const busLineId = options.bli
    const startStation = options.sn
    const endStation = options.en
    const busLineName = options.bln
    this.setData({
      "busLineId": busLineId,
      "startStation": startStation,
      "endStation": endStation,
      "busLineName": busLineName
    })
    // 计算实时地图占用的最小长度
    wx.getSystemInfo({
      success: (res) => {
        const height = res.windowHeight
        const heightRpx = UIHelper.px2rpx(height)
        this.setData({
          realTimeContainerMinHeight: heightRpx - 597,
          dpr: res.pixelRatio
        })
      }
    });
  },
  onShow() {
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
        this.init()
      }
    })
  },
  onUnload() {
    if (this.data.timerNo) {
      clearTimeout(this.data.timerNo)
      console.log(">>> bus页面定时器已经被关闭")
    }
  },
  reset(busLineId, startStation, endStation, busLineName) {
    // 关闭定时器
    if (this.data.timerNo) {
      clearTimeout(this.data.timerNo)
      console.log(">>> bus页面定时器已经被关闭")
    }
    this.setData({
      busLineId: busLineId,
      startStation: startStation,
      endStation: endStation,
      busLineName: busLineName,
      // 地图宽度
      mapWidth: 0,
      // 站点数据
      stationData: null,
      // 最近的站点编号
      nearestStationOrder: null,
      // 公交汽车实时数据
      realTimeData: null,
      // detail类型
      detailType: "station",
      detailIndex: null,
      // 乘车点信息
      pickUpPointInfo: null,
      // 定时器编号
      timerNo: null,
      scrollLeft: null,
    })
    console.log("reset后的数据")
    console.log(this.data)
  },
  /**
   * 初始化数据，如果是切换线路需要先调用reset
   */
  init() {
    // 获取全部车站（仅一次）
    this.getStation({
      success: () => {
        this.calculateMapWidth(this.data.stationData.length)
        this.updateRealTimeInfoTimer()
        // 滑动地图至当前原点中心
        if (this.data.scrollLeft == null) {
          this.setData({
            scrollLeft: (this.data.nearestStationOrder - 2) * 108 - 50
          })
        }
      }
    })
  },
  calculateMapWidth(itemLength) {
    // 基础长度
    let width = 12 * 2 + itemLength * 100 + (itemLength - 1) * 8
    const param = this.data.dpr - 2
    this.setData({
      mapWidth: width - param * 10
    })
  },
  /**
   * 重新对实时数据排序
   */
  resortRealTimeData(data) {
    let _data = data
    this.setData({
      realTimeData: _data.sort(this.resortRule)
    })
    console.log(this.data.realTimeData)
  },
  /**
   * 实时数据排序规则
   */
  resortRule(a, b) {
    return a['stationSeqNum'] - b['stationSeqNum']
  },
  /**
   * 点击了实时地图的公交车
   * @param {*} e 
   */
  busTappedEvent(e) {
    this.setData({
      detailType: "bus",
      detailIndex: e.currentTarget.dataset.busid
    })
  },
  /**
   * 车站点击事件
   * @param {*} e 
   */
  stationTappedEvent(e) {
    this.setData({
      detailType: "station",
      detailIndex: e.currentTarget.dataset.order
    })
  },
  /**
   * 获取全部站牌信息
   * opts.success 成功后回调
   */
  getStation(opts) {
    RequestHelper.post({
      url: Constants.getApiUrl("/bus/getStation"),
      data: {
        busLineId: this.data.busLineId,
        startStation: this.data.startStation,
        location: `${this.data.lat}, ${this.data.lng}`
      },
      customSuccess: (res) => {
        this.setData({
          stationData: res.data.data.stations,
          nearestStationOrder: parseInt(res.data.data.nearStationOrder),
          detailIndex: res.data.data.nearStationOrder
        })
        // console.log(this.data.nearestStationOrder)
        if (opts.success) opts.success()
      }
    })
  },
  /**
   * 获取全部公交车实时数据
   */
  getRealTimeBusInfo(opts) {
    RequestHelper.post({
      url: Constants.getApiUrl('/bus/getAllBusesRealTimeInfo'),
      data: {
        busLineId: this.data.busLineId
      },
      customSuccess: (res) => {
        this.setData({
          realTimeData: res.data.data
        })
        // 重排数据
        this.resortRealTimeData(this.data.realTimeData)
        // 删除重复数据
        let _lastStationSeqNum = -1
        let _temp = []
        for (let i = 0; i < this.data.realTimeData.length; i++) {
          let _curr = this.data.realTimeData[i]
          if (_curr['stationSeqNum'] !== _lastStationSeqNum) {
            _temp.push(_curr)
          } else {
            console.log("发现重复的实时公交数据")
          }
          _lastStationSeqNum = _curr['stationSeqNum']
        }
        this.setData({
          realTimeData: _temp
        })
        if (opts.success) opts.success()
      }
    })
  },
  /**
   * 获取乘车点信息
   */
  getPickUpPoint() {
    RequestHelper.post({
      url: Constants.getApiUrl('/bus/getPickUpPointInfo'),
      data: {
        lat: this.data.lat,
        lng: this.data.lng,
        list: [{
          busLineId: this.data.busLineId
        }]
      },
      customSuccess: (res) => {
        let _pickUpPointInfo = res.data.data[0]
        this.setData({
          pickUpPointInfo: _pickUpPointInfo
        })
      }
    })
  },
  /**
   * 定时刷新实时数据
   */
  updateRealTimeInfoTimer() {
    console.log(">>> bus页面定时刷新数据")
    let now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    this.setData({
      "updateTime": minutes < 10 ? `${hours}点0${minutes}分` : `${hours}点${minutes}分`
    })
    this.getRealTimeBusInfo({
      success: () => {
        this.getPickUpPoint()
      }
    })
    const timerNo = setTimeout(() => {
      this.updateRealTimeInfoTimer()
    }, this.data.updateInterval)
    this.setData({
      "timerNo": timerNo
    })
  },
  /**
   * 转换到另一个线路上
   */
  switchToOtherLine() {
    if (this.data.isSwitchingLine) return
    this.setData({
      isSwitchingLine: true
    })
    // 创建一个旋转动画
    let option = {
      duration: 500, // 动画执行时间
      timingFunction: 'ease-in' // 动画执行效果
    };
    let switchAnimation = wx.createAnimation(option);
    switchAnimation.rotate(180 * this.data.animateTimes).step()
    this.setData({
      switchingAnimate: switchAnimation.export(),
      animateTimes: this.data.animateTimes + 1
    })

    RequestHelper.get({
      'url': Constants.getApiUrl(`/bus/getOtherLines?busLineId=${this.data.busLineId}&busLineName=${this.data.busLineName}`),
      customSuccess: (res) => {
        const arr = res.data.data[0]
        console.log(">>>>>>")
        console.log(arr)
        this.reset(arr.id, arr.startStation, arr.endStation, arr.busLineName)
        this.init()
        // 收藏该线路
        RequestHelper.get({
          url: Constants.getApiUrl(`/fav/create?busLineId=${arr.id}`)
        })
      },
      complete: () => {
        this.setData({
          isSwitchingLine: false
        })
      }
    })
  },
  pickUpPointChanged(e) {
    const order = e.detail.value
    const station = this.data.stationData[order]
    RequestHelper.post({
      url: Constants.getApiUrl("/bus/setPickUpPoint"),
      data: {
        busLineId: this.data.busLineId,
        stationOrder: order,
        stationName: station['stationName']
      },
      customSuccess: (res) => {
        this.getPickUpPoint()
      }
    })
  }
})