export default class Constants {

    /**
     * 获取api的url
     * @param {string} path 
     */
    static getApiUrl(path) {
        return `http://localhost:8080/${path}`
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
