import Constants from './constants'
import LoginHelper from './login_helper'
import UIHelper from './ui_helper'

export default class RequestHelper {

    /**
     * 通用接口，必须已经登录
     * @param {*} opts 传入的参数，包括: 
     *  opts.url
     *  opts.data
     *  opts.method
     *  opts.success
     *  opts.fail
     *  opts.complete
     */
    static request(opts) {
        // 用户已经登录
        wx.request({
            url: opts.url,
            data: opts.data,
            method: opts.method,
            header: {
                'Content-Type': 'application/json',
                'X-Gj-Token': Constants.getToken()
            },
            success: (res) => {
                if (opts.success) opts.success(res)
            },
            fail: (res) => {
                if (opts.fail) opts.fail(res);
            },
            complete: () => {
                if (opts.complete) opts.complete()
            }
        })
    }

    /**
     * GET方法
     * @param {*} opts 传入的参数，包括: 
     *  opts.url
     *  opts.customSuccess 用户自定义成功回调
     *  opts.serverErrorFail 服务器错误回调
     *  opts.customFail
     *  opts.complete
     *  opts.needDisplayLoading 是否显示正在加载
     *  opts.needDisplayErrorModal 是否需要在错误时返回Modal框
     */
    static get(opts) {
        if (opts.needDisplayLoading) {
            UIHelper.showLoading()
        }
        this.request({
            url: opts.url,
            method: 'GET',
            success: this.__success(opts),
            fail: this.__fail(opts),
            complete: opts.complete
        })
    }

    /**
     * POST方法
     * @param {*} opts 传入的参数，包括: 
     *  opts.url
     *  opts.data
     *  opts.customSuccess 用户自定义成功回调
     *  opts.serverErrorFail 服务器错误回调
     *  opts.customFail
     *  opts.complete
     *  opts.needDisplayLoading 是否显示正在加载
     *  opts.needDisplayErrorModal 是否需要在错误时返回Modal框
     */
    static post(opts) {
        if (opts.needDisplayLoading) {
            UIHelper.showLoading()
        }
        this.request({
            url: opts.url,
            data: opts.data,
            method: 'POST',
            success: this.__success(opts),
            fail: this.__fail(opts),
            complete: opts.complete
        })
    }

    /**
     * 内建成功处理方法
     * 该方法处理UI相关逻辑以及服务器相关错误
     * @param {*} opts
     *  opts.needDisplayLoading 是否显示正在加载
     *  opts.needDisplayErrorModal 是否需要在错误时返回Modal框
     *  opts.customSuccess 用户自定义成功回调
     *  opts.serverErrorFail 服务器错误回调
     */
    static __success(opts) {
        return (res) => {
            // 隐藏loading
            if (opts.needDisplayLoading) {
                UIHelper.hideLoading()
            }
            // 服务器返回正常则直接调用自定义成功回调
            if (res.data.code == 200) {
                if (opts.customSuccess) opts.customSuccess(res)
                return
            }
            // 服务器返回错误则需要进行相关处理
            const _message = res.data.message
            if (typeof res.data.message !== 'string') {
                _content = '网络错误，请重试'
            }
            // 以modal框的方式提示用户
            if (opts.needDisplayErrorModal) {
                wx.showModal({
                    title: "错误",
                    content: _message,
                    showCancel: false
                  })
            }
            if (opts.serverErrorFail) opts.serverErrorFail(res)
        }
    }

      /**
         * 失败回调
         * @param opts
         * opts.needDisplayLoading 是否显示正在加载
         * opts.customFail 失败回调
         */
        static __fail(opts) {
            return () => {
            if (opts.needDisplayLoading) {
                UIHelper.hideLoading()
            }
            wx.showModal({
                title: '请求错误',
                content: '网络错误，请重试',
                showCancel: false
            })
            if (opts.customFail) opts.customFail()
            }
        }

}