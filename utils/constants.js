export default class Constants {

    /**
     * 获取api的url
     * @param {string} path 格式为'/xxx/xxx'
     */
    static getApiUrl(path) {
        return `https://busys.niuxuewei.com:8443${path}`
    }

    /**
     * 获取程序token从小程序本地
     */
    static getToken() {
        try {
            return wx.getStorageSync('token')
        } catch (e) {
            return null;
        }
    }

}
