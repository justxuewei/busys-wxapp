export default class UIHelper {

    /**
   * 带正在加载的Loading
   */
    static showLoading() {
        wx.showLoading({
            title: '正在加载',
            mask: true
        })
    }

    /**
     * 带增加新建的Loading
     */
    static showAdding() {
        wx.showLoading({
            title: '正在新建',
            mask: true
        })
    }

    /**
     * 隐藏Loading
     */
    static hideLoading() {
        wx.hideLoading()
    }

    /**
     * PX转RPX
     * @param px
     */
    static px2rpx(px) {
        let sysinfo = wx.getSystemInfoSync()
        let px2rpx = 750 / sysinfo.screenWidth
        return px * px2rpx
    }

    /**
     * rpx转px
     * @param rpx
     * @returns {number}
     */
    static rpx2px(rpx) {
        let sysinfo = wx.getSystemInfoSync()
        let rpx2px = sysinfo.screenWidth / 750
        return rpx * rpx2px
    }

}