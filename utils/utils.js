export default class Utils {

  static isNullOrUndefined(obj) {
    if (typeof(obj) == 'undefined' || typeof(obj) == 'null') {
      return true
    }
    return false
  }

}